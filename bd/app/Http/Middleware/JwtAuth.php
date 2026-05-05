<?php

namespace App\Http\Middleware;

use App\Exceptions\AxiomException;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JwtAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            throw new AxiomException('Нэвтрэх шаардлагатай.');
        }

        $user = app(JwtService::class)->userFromToken($token);

        if (!$user) {
            throw new AxiomException('Token хүчингүй эсвэл хугацаа дууссан байна.');
        }

        Auth::login($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
