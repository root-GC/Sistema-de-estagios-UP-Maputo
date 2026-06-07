<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\{Hash, Password, DB};
use Illuminate\Support\{Str, Carbon};
use Illuminate\Validation\Rules\Password as PasswordRule;
use App\Models\{User, Role, StudentProfile, AuditLog, Notification};

class AuthController extends Controller
{
    // ─────────────────────────────────────────────────────────
    // POST /auth/register  — apenas estudantes (público)
    // ─────────────────────────────────────────────────────────
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => ['required', 'confirmed', PasswordRule::min(8)],
            'student_number' => 'required|string|unique:student_profiles,student_number',
            'course_id'      => 'required|exists:courses,id',
            'current_year'   => 'required|integer|min:1|max:5',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'status'   => 'active',
        ]);

        $user->roles()->attach(
            Role::where('name', 'student')->value('id')
        );

        StudentProfile::create([
            'user_id'        => $user->id,
            'course_id'      => $data['course_id'],
            'student_number' => $data['student_number'],
            'current_year'   => $data['current_year'],
        ]);

        AuditLog::record('register', 'User', $user->id,
            "Auto-registo do estudante {$user->email}", $user->id);

        $token = $user->createToken('spa-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userData($user),
        ], 201);
    }

    // ─────────────────────────────────────────────────────────
    // POST /auth/login
    // ─────────────────────────────────────────────────────────
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Credenciais inválidas.'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'Conta suspensa ou inativa. Contacte o administrador.'], 403);
        }

        AuditLog::record('login', 'User', $user->id,
            "Login: {$user->email}", $user->id);

        return response()->json([
            'token' => $user->createToken('spa-token')->plainTextToken,
            'user'  => $this->userData($user),
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // POST /auth/logout
    // ─────────────────────────────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sessão terminada.']);
    }

    // ─────────────────────────────────────────────────────────
    // GET /auth/me
    // ─────────────────────────────────────────────────────────
    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userData($request->user()->load('roles')));
    }

    // ─────────────────────────────────────────────────────────
    // POST /auth/forgot-password  (público)
    // ─────────────────────────────────────────────────────────
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        // Sempre responde OK (não revelar se email existe)
        $status = Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'Se o email estiver registado, receberá um link de recuperação.',
        ]);
    }

    // ─────────────────────────────────────────────────────────
    // POST /auth/reset-password  (público)
    // ─────────────────────────────────────────────────────────
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete(); // invalida todos os tokens activos

                AuditLog::record('password_reset', 'User', $user->id,
                    "Password redefinida via link: {$user->email}", $user->id);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Token inválido ou expirado. Solicite um novo link.',
            ], 422);
        }

        return response()->json(['message' => 'Password redefinida com sucesso. Pode fazer login.']);
    }

    // ─────────────────────────────────────────────────────────
    // helper interno
    // ─────────────────────────────────────────────────────────
    public function userData(User $user): array
    {
        $user->loadMissing('roles');

        $data = [
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'status' => $user->status,
            'roles'  => $user->roles->pluck('name'),
        ];

        if ($user->hasRole('student') && $sp = $user->studentProfile) {
            $data['profile'] = $sp->load('course.department.faculty');
        } elseif ($user->hasRole('supervisor') && $sp = $user->supervisorProfile) {
            $data['profile'] = $sp->load('department.faculty');
        } elseif ($user->hasRole('coordinator') && $c = $user->coordinator) {
            $data['profile'] = $c->load('course.department');
        } elseif ($user->hasRole('dept_head') && $dh = $user->departmentHead) {
            $data['profile'] = $dh->load('department.faculty');
        }

        return $data;
    }
}
