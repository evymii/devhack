<?php

namespace App\Http\Controllers;

use App\Exceptions\AxiomException;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request, JwtService $jwt)
    {
        $validated = $this->validateMe($request, [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw new AxiomException('Email эсвэл password буруу байна.');
        }

        return $this->success([
            'token' => $jwt->issue($user),
            'token_type' => 'Bearer',
            'user' => $user,
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
}
