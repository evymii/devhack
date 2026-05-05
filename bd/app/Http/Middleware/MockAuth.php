<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class MockAuth
{
    public function handle(Request $request, Closure $next)
    {
        // Хөгжүүлэлтийн үед Token шаардахгүйгээр шууд Админ эрхээр нэвтэрсэн мэт ажиллах
        $user = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            ['name' => 'Admin Tester', 'password' => bcrypt('12345678'), 'role' => 'admin']
        );
        
        Auth::login($user);

        return $next($request);
    }
}
