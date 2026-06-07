<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Laravel\Sanctum\PersonalAccessToken;

class ActiveSessionController extends Controller
{
    public function index(): JsonResponse
    {
        $tokens = PersonalAccessToken::with('tokenable')
            ->latest('last_used_at')
            ->get()
            ->filter(function ($token) {
                // Mostra apenas tokens que pertencem a um utilizador autêntico (não null)
                return $token->tokenable !== null;
            })
            ->map(function ($token) {
                $user = $token->tokenable;
                return [
                    'id'              => $token->id,
                    'name'            => $user?->name ?? '—',
                    'email'           => $user?->email ?? '—',
                    'last_login'      => $token->last_used_at?->toIso8601String(),
                    'last_ip'         => $token->last_ip ?? '—',
                    'failed_attempts' => 0,
                ];
            })
            ->values();

        return response()->json(['data' => $tokens]);
    }
}
