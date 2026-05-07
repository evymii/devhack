<?php

namespace App\Http\Controllers;

use App\Exceptions\AxiomException;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    private const DEFAULT_FACE_MATCH_THRESHOLD = 0.60;

    public function login(Request $request, JwtService $jwt)
    {
        $validated = $this->validateMe($request, [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->where('statusid', 1)->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw new AxiomException('Email эсвэл password буруу байна.');
        }

        return $this->success([
            'token' => $jwt->issue($user),
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function sendRegisterOtp(Request $request)
    {
        $validated = $this->validateMe($request, [
            'email' => 'required|email|max:200',
        ]);

        $email = strtolower($validated['email']);
        $otp = (string) random_int(100000, 999999);

        Cache::put($this->otpCacheKey($email), Hash::make($otp), now()->addMinutes(10));

        try {
            Mail::raw("Your FacePass verification code is: {$otp}", function ($message) use ($email) {
                $message->to($email)->subject('FacePass OTP');
            });
        } catch (\Throwable) {
            // Local dev often has no mail transport. The OTP remains in cache.
        }

        $response = ['message' => 'OTP илгээгдлээ.'];
        if (App::environment('local')) {
            $response['dev_otp'] = $otp;
        }

        return $this->success($response);
    }

    public function verifyRegisterOtp(Request $request)
    {
        $validated = $this->validateMe($request, [
            'email' => 'required|email|max:200',
            'otp' => 'required|string|size:6',
        ]);

        $email = strtolower($validated['email']);
        $cached = Cache::get($this->otpCacheKey($email));

        if (!$cached || !Hash::check($validated['otp'], $cached)) {
            throw new AxiomException('OTP код буруу эсвэл хугацаа дууссан байна.');
        }

        $token = Str::random(48);
        Cache::put($this->verifiedCacheKey($email), $token, now()->addMinutes(20));
        Cache::forget($this->otpCacheKey($email));

        return $this->success([
            'message' => 'Email баталгаажлаа.',
            'verification_token' => $token,
        ]);
    }

    public function completeRegister(Request $request, JwtService $jwt)
    {
        $validated = $this->validateMe($request, [
            'email' => 'required|email|max:200',
            'verification_token' => 'required|string',
            'name' => 'nullable|string|max:200',
            'national_id' => 'required|string|max:30',
            'biometric_data' => 'required|array|min:64',
            'biometric_data.*' => 'numeric',
            'biometric_snapshot' => 'nullable|string',
        ]);

        $email = strtolower($validated['email']);
        $expectedToken = Cache::get($this->verifiedCacheKey($email));
        if (!$expectedToken || !hash_equals($expectedToken, $validated['verification_token'])) {
            throw new AxiomException('Email баталгаажуулалт хүчингүй байна.');
        }

        $descriptor = array_map(fn ($value) => round((float) $value, 8), $validated['biometric_data']);
        $faceId = 'face_' . substr(hash('sha256', $email . '|' . json_encode($descriptor)), 0, 24);

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $validated['name'] ?: $email,
                'national_id' => $validated['national_id'],
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
                'biometric_data' => json_encode($descriptor),
                'face_id' => $faceId,
                'biometric_snapshot' => $validated['biometric_snapshot'] ?? null,
                'role' => User::where('email', $email)->value('role') ?? 'user',
                'statusid' => 1,
            ]
        );

        Cache::forget($this->verifiedCacheKey($email));

        return $this->success([
            'token' => $jwt->issue($user),
            'token_type' => 'Bearer',
            'face_id' => $faceId,
            'user' => $user,
        ]);
    }

    public function faceLogin(Request $request, JwtService $jwt)
    {
        $validated = $this->validateMe($request, [
            'biometric_data' => 'required|array|min:64',
            'biometric_data.*' => 'numeric',
        ]);

        $probe = array_map(fn ($value) => (float) $value, $validated['biometric_data']);
        $bestUser = null;
        $bestDistance = null;

        User::where('statusid', 1)
            ->whereNotNull('biometric_data')
            ->get()
            ->each(function (User $user) use ($probe, &$bestUser, &$bestDistance) {
                $stored = json_decode($user->biometric_data, true);
                if (!is_array($stored) || count($stored) !== count($probe)) {
                    return;
                }

                $distance = $this->euclideanDistance($probe, array_map('floatval', $stored));
                if ($bestDistance === null || $distance < $bestDistance) {
                    $bestDistance = $distance;
                    $bestUser = $user;
                }
            });

        $threshold = $this->faceMatchThreshold();
        if (!$bestUser || $bestDistance === null || $bestDistance > $threshold) {
            $distanceMessage = $bestDistance === null
                ? ''
                : ' Best distance: ' . round($bestDistance, 4) . ', threshold: ' . round($threshold, 4) . '.';
            throw new AxiomException('Face not recognized. Take a clearer full-face photo and try again.' . $distanceMessage);
        }

        return $this->success([
            'token' => $jwt->issue($bestUser),
            'token_type' => 'Bearer',
            'distance' => $bestDistance,
            'user' => $bestUser,
        ]);
    }

    public function me(Request $request)
    {
        return $this->success($request->user());
    }

    public function logout()
    {
        return $this->success(['message' => 'Logged out']);
    }

    private function otpCacheKey(string $email): string
    {
        return 'register_otp:' . strtolower($email);
    }

    private function verifiedCacheKey(string $email): string
    {
        return 'register_verified:' . strtolower($email);
    }

    private function euclideanDistance(array $a, array $b): float
    {
        $sum = 0.0;
        foreach ($a as $index => $value) {
            $diff = (float) $value - (float) $b[$index];
            $sum += $diff * $diff;
        }
        return sqrt($sum);
    }

    private function faceMatchThreshold(): float
    {
        $threshold = (float) env('FACE_MATCH_THRESHOLD', self::DEFAULT_FACE_MATCH_THRESHOLD);

        return max(0.35, min(0.75, $threshold));
    }
}
