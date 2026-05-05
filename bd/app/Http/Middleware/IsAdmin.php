<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Exceptions\AxiomException;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            throw new AxiomException('Энэ үйлдлийг хийхэд Админ эрх шаардлагатай.');
        }

        return $next($request);
    }
}
