<?php

namespace App\Services;

use App\Models\User;

class JwtService
{
    public function issue(User $user): string
    {
        $now = time();

        return $this->encode([
            'iss' => config('app.url'),
            'iat' => $now,
            'exp' => $now + (60 * 60 * 24 * 7),
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
        ]);
    }

    public function userFromToken(string $token): ?User
    {
        $payload = $this->decode($token);

        if (!$payload || empty($payload['sub'])) {
            return null;
        }

        return User::find($payload['sub']);
    }

    private function encode(array $payload): string
    {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $segments = [
            $this->base64UrlEncode(json_encode($header)),
            $this->base64UrlEncode(json_encode($payload)),
        ];
        $segments[] = $this->sign(implode('.', $segments));

        return implode('.', $segments);
    }

    private function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        $expected = $this->sign($header . '.' . $payload);

        if (!hash_equals($expected, $signature)) {
            return null;
        }

        $decoded = json_decode($this->base64UrlDecode($payload), true);
        if (!is_array($decoded)) {
            return null;
        }

        if (!empty($decoded['exp']) && $decoded['exp'] < time()) {
            return null;
        }

        return $decoded;
    }

    private function sign(string $value): string
    {
        return $this->base64UrlEncode(hash_hmac('sha256', $value, config('app.key'), true));
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/'));
    }
}
