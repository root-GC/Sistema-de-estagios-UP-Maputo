<?php
// app/Http/Middleware/RoleMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Uso nas rotas: middleware('role:coordinator,admin')
     * Passa se o utilizador tiver PELO MENOS um dos roles listados.
     */
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Não autenticado.'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'Conta suspensa ou inativa.'], 403);
        }

        if (!$user->hasRole(...$roles)) {
            return response()->json([
                'message'        => 'Acesso negado. Permissão insuficiente.',
                'required_roles' => $roles,
                'your_roles'     => $user->roles->pluck('name'),
            ], 403);
        }

        return $next($request);
    }
}

// ── Registar em bootstrap/app.php (Laravel 11) ──────────────
//
// ->withMiddleware(function (Middleware $middleware) {
//     $middleware->alias([
//         'role' => \App\Http\Middleware\RoleMiddleware::class,
//     ]);
// })