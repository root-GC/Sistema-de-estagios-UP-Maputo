<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Password;
use App\Models\{
    User, Role, SupervisorProfile, Coordinator,
    StudentProfile, DepartmentHead, AuditLog, Notification
};

class UserController extends Controller
{
    // ─────────────────────────────────────────────────────────
    // GET /users
    // ─────────────────────────────────────────────────────────
   public function index(Request $request): JsonResponse
{
    $user  = $request->user();
    $query = User::with('roles', 'supervisorProfile.department');

    if ($user->hasRole('admin')) {
        // vê tudo
    } elseif ($user->hasRole('dept_head')) {
        $query->whereHas('roles', fn($q) =>
            $q->whereIn('name', ['coordinator', 'tutor'])
        );
    } elseif ($user->hasRole('coordinator')) {
        $query->whereHas('roles', fn($q) => $q->where('name', 'supervisor'));
    } else {
        return response()->json(['data' => []]);
    }

    $query
        ->when($request->status, fn($q) => $q->where('status', $request->status))
        ->when($request->role,   fn($q) =>
            $q->whereHas('roles', fn($r) => $r->where('name', $request->role))
        );

    $users = $query->latest()->paginate(20);

    // Transforma a coleção para incluir campos extra do perfil de supervisor
    $users->getCollection()->transform(function ($user) {
        $userArray = $user->toArray();

        if ($user->supervisorProfile) {
            $userArray['supervisor_profile_id'] = $user->supervisorProfile->id;
            $userArray['academic_rank']         = $user->supervisorProfile->academic_rank;
            $userArray['department']            = $user->supervisorProfile->department;
            $userArray['department_id']         = $user->supervisorProfile->department_id;
            $userArray['estagiarios_count']     = $user->supervisorProfile->activeCount();   // ← ESSENCIAL
        } else {
            $userArray['supervisor_profile_id'] = null;
            $userArray['academic_rank']         = null;
            $userArray['department']            = null;
            $userArray['department_id']         = null;
            $userArray['estagiarios_count']     = 0;
        }

        return $userArray;
    });

    return response()->json($users);
}

    // ─────────────────────────────────────────────────────────
    // GET /users/{user}
    // ─────────────────────────────────────────────────────────
    public function show(User $user): JsonResponse
    {
        $user->load('roles', 'supervisorProfile.department', 'coordinator.courses');
        $data = $user->toArray();
        $data['academic_rank'] = $user->supervisorProfile->academic_rank ?? null;
        $data['department']    = $user->supervisorProfile->department ?? null;
        return response()->json(['data' => $data]);
    }

    // ─────────────────────────────────────────────────────────
    // POST /users   – criação de utilizadores
    // ─────────────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'role'           => 'required|in:admin,dept_head,coordinator,supervisor,student,tutor',
            'department_id'  => 'nullable|integer|exists:departments,id',
            'course_id'      => 'nullable|integer|exists:courses,id',
            'course_ids'     => 'nullable|array',            // para coordenador (múltiplos)
            'course_ids.*'   => 'integer|exists:courses,id',
            'academic_rank'  => 'nullable|string|max:100',
            'student_number' => 'nullable|string',
            'current_year'   => 'nullable|integer|min:1|max:5',
            'password'       => 'nullable|string|min:8',     // se não enviado, gera-se uma
        ]);

        $password = $data['password'] ?? Str::random(12);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($password),
            'status'   => 'active',
        ]);

        $role = Role::where('name', $data['role'])->first();
        if ($role) {
            $user->roles()->syncWithoutDetaching([$role->id]);
        }

        // Criar perfis específicos consoante a role
        switch ($data['role']) {
            case 'supervisor':
                SupervisorProfile::create([
                    'user_id'        => $user->id,
                    'department_id'  => $data['department_id'] ?? null,
                    'academic_rank'  => $data['academic_rank'] ?? null,
                ]);
                break;

            case 'coordinator':
                $coordinator = Coordinator::create([
                    'user_id' => $user->id,
                ]);
                // Associa os cursos enviados (array course_ids)
                if (!empty($data['course_ids'])) {
                    Course::whereIn('id', $data['course_ids'])
                        ->update(['coordinator_id' => $coordinator->id]);
                } elseif (!empty($data['course_id'])) {
                    Course::where('id', $data['course_id'])
                        ->update(['coordinator_id' => $coordinator->id]);
                }
                break;

            case 'dept_head':
                DepartmentHead::create([
                    'user_id'       => $user->id,
                    'department_id' => $data['department_id'],
                ]);
                break;

            case 'student':
                StudentProfile::create([
                    'user_id'        => $user->id,
                    'course_id'      => $data['course_id'],
                    'student_number' => $data['student_number'],
                    'current_year'   => $data['current_year'],
                ]);
                break;
        }

        AuditLog::record('create_user', 'User', $user->id,
            "Criou {$data['role']}: {$user->email}", $request->user()->id);

        // Enviar email de reset se não foi enviada password (opcional)
        if (!$request->filled('password')) {
            Password::sendResetLink(['email' => $user->email]);
        }

        return response()->json(['data' => $user->load('roles')], 201);
    }

    // ─────────────────────────────────────────────────────────
    // PATCH /users/{user}
    // ─────────────────────────────────────────────────────────
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'email'          => 'sometimes|email|unique:users,email,' . $user->id,
            'status'         => 'sometimes|in:active,inactive,suspended',
            'department_id'  => 'nullable|integer|exists:departments,id',
            'course_id'      => 'nullable|integer|exists:courses,id',
            'course_ids'     => 'nullable|array',
            'course_ids.*'   => 'integer|exists:courses,id',
            'academic_rank'  => 'nullable|string|max:100',
        ]);

        $user->update($data);

        // Actualizar perfil de supervisor se aplicável
        if ($user->hasRole('supervisor') && ($data['department_id'] ?? $data['academic_rank'] ?? null)) {
            SupervisorProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'department_id' => $data['department_id'] ?? $user->supervisorProfile->department_id ?? null,
                    'academic_rank' => $data['academic_rank'] ?? $user->supervisorProfile->academic_rank ?? null,
                ]
            );
        }

        // Actualizar cursos do coordenador
        if ($user->hasRole('coordinator') && ($data['course_ids'] ?? $data['course_id'] ?? null)) {
            $courseIds = $data['course_ids'] ?? [$data['course_id']];
            Course::where('coordinator_id', $user->coordinator->id)->update(['coordinator_id' => null]);
            Course::whereIn('id', $courseIds)->update(['coordinator_id' => $user->coordinator->id]);
        }

        return response()->json(['data' => $user->fresh()->load('roles')]);
    }
}