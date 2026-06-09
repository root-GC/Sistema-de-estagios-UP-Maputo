<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Mail;
use App\Models\{
    User, Role, Internship, StudentProfile, SupervisorProfile,
    Coordinator, PartnerInstitution, Tutor, InternshipPeriod,
    DevelopmentPlan, ActivityPlan, ReflectiveJournal, InternshipProject,
    FinalReport, Portfolio, PortfolioDocument, TutorEvaluation,
    TutorEvaluationItem, SupervisorEvaluation, InternshipResult,
    InternshipGradeSheet, InternshipGradeSheetItem, SigeupExport,
    CredentialLetter, InternshipRequirement, AuditLog, Notification,
    InternshipGradeSheet as GradeSheet,
};

// ============================================================
// UserController  — Admin (RF-000)
// ============================================================

// ============================================================
// app/Http/Controllers/Api/UserController.php
//
// Regras de criação:
//   admin       → cria: admin, dept_head
//   dept_head   → cria: coordinator  + tutor (via InstitutionController)
//   coordinator → cria: supervisor
//   público     → estudante auto-regista-se via /auth/register
// ============================================================
class UserController extends Controller
{
    // Roles que cada actor pode criar
    private const CAN_CREATE = [
        'admin'       => ['admin', 'dept_head'],
        'dept_head'   => ['coordinator'],
        'coordinator' => ['supervisor'],
    ];

    // ─────────────────────────────────────────────────────────
    // GET /users
    // ─────────────────────────────────────────────────────────
public function index(Request $request): JsonResponse
{
    $user  = $request->user();
    $query = User::with('roles', 'supervisorProfile.department');  // ← eager load do departamento

    // Filtros por papel
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

    // Adiciona o campo department e academic_rank a cada utilizador
    $users->getCollection()->transform(function ($user) {
        $userArray = $user->toArray();
        $userArray['academic_rank'] = $user->supervisorProfile->academic_rank ?? null;
        $userArray['department'] = $user->supervisorProfile->department ?? null;   // ← novo campo
        return $userArray;
    });

    return response()->json($users);
}
    // public function index(Request $request): JsonResponse
    // {
    //     $user  = $request->user();
    //     $query = User::with('roles');

    //     // Cada actor vê apenas os utilizadores que lhe são relevantes
    //     if ($user->hasRole('admin')) {
    //         // vê tudo
    //     } elseif ($user->hasRole('dept_head')) {
    //         // vê coordenadores e tutores
    //         $query->whereHas('roles', fn($q) =>
    //             $q->whereIn('name', ['coordinator', 'tutor'])
    //         );
    //     } elseif ($user->hasRole('coordinator')) {
    //         // vê supervisores do seu departamento
    //         $query->whereHas('roles', fn($q) => $q->where('name', 'supervisor'));
    //     } else {
    //         return response()->json(['data' => []]);
    //     }

    //     $query
    //         ->when($request->status, fn($q) => $q->where('status', $request->status))
    //         ->when($request->role,   fn($q) =>
    //             $q->whereHas('roles', fn($r) => $r->where('name', $request->role))
    //         );

    //     return response()->json($query->latest()->paginate(20));
    // }




    // ─────────────────────────────────────────────────────────
    // POST /users  — criação com perfil associado
    // ─────────────────────────────────────────────────────────
   public function store(Request $request): JsonResponse
{
    $actor = $request->user();
    $actorRole = $actor->roles->pluck('name')->first();
    $allowed = self::CAN_CREATE[$actorRole] ?? [];

    $data = $request->validate([
        'name'          => 'required|string|max:255',
        'email'         => 'required|email|unique:users,email',
        'role'          => 'required|in:admin,dept_head,coordinator,supervisor',

        'department_id' => 'sometimes|exists:departments,id',
        'course_id'     => 'sometimes|exists:courses,id',
        'academic_rank' => 'sometimes|string|max:100',
    ]);

    if (!in_array($data['role'], $allowed)) {
        return response()->json([
            'message' => "Sem permissão para criar utilizadores com o role '{$data['role']}'.",
            'allowed' => $allowed,
        ], 403);
    }

    // =====================================================
    // Regras contextuais
    // =====================================================

    if ($data['role'] === 'dept_head') {
        $request->validate([
            'department_id' => 'required|exists:departments,id',
        ]);
    }

    if ($data['role'] === 'coordinator') {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
        ]);
    }

    if (
        $data['role'] === 'supervisor'
        && $actor->hasRole('coordinator')
    ) {
        $courseId = $actor->coordinator->course_id;

        $departmentId = \App\Models\Course::find($courseId)?->department_id;

        if (!$departmentId) {
            return response()->json([
                'message' => 'Curso do coordenador não tem departamento associado.'
            ], 422);
        }

        $data['department_id'] = $departmentId;
    }

    // =====================================================
    // Password temporária
    // =====================================================

    $temporaryPassword = Str::random(20);

    $user = User::create([
        'name'     => $data['name'],
        'email'    => $data['email'],
        'password' => Hash::make($temporaryPassword),
        'status'   => 'active',
    ]);

    // =====================================================
    // Role
    // =====================================================

    $roleId = Role::where('name', $data['role'])->value('id');

    $user->roles()->attach($roleId);

    // =====================================================
    // Perfil
    // =====================================================

    match ($data['role']) {

        'admin' => \App\Models\Admin::create([
            'user_id' => $user->id,
            'is_root' => false,
        ]),

        'dept_head' => \App\Models\DepartmentHead::create([
            'user_id'       => $user->id,
            'department_id' => $data['department_id'],
        ]),

        'coordinator' => \App\Models\Coordinator::create([
            'user_id'   => $user->id,
            'course_id' => $data['course_id'],
        ]),

        'supervisor' => \App\Models\SupervisorProfile::create([
            'user_id'       => $user->id,
            'department_id' => $data['department_id'],
            'academic_rank' => $data['academic_rank'] ?? null,
        ]),
    };

    // =====================================================
    // Gerar token para definir password
    // =====================================================

    $token = Password::createToken($user);

    $resetUrl =
        config('app.frontend_url')
        . "/reset-password?token={$token}&email={$user->email}";

    // =====================================================
    // TODO: enviar email
    // =====================================================

    /*
    Mail::to($user->email)->send(
        new SetPasswordMail(
            $user,
            $resetUrl
        )
    );
    */

    Notification::create([
        'user_id' => $user->id,
        'title'   => 'Conta criada',
        'message' =>
            "A sua conta foi criada por {$actor->name}. "
            ."Utilize o link enviado por email para definir a sua senha.",
    ]);

    AuditLog::record(
        'create_user',
        'User',
        $user->id,
        "{$actor->name} ({$actorRole}) criou utilizador {$user->email} com role {$data['role']}"
    );

    return response()->json([
        'message' => 'Utilizador criado com sucesso.',
        'reset_url' => $resetUrl, // remover em produção
        'user' => $user->load('roles'),
    ], 201);
}

    // ─────────────────────────────────────────────────────────
    // GET /users/:id
    // ─────────────────────────────────────────────────────────
    public function show(User $user): JsonResponse
    {
        return response()->json($user->load([
            'roles',
            'studentProfile.course',
            'supervisorProfile.department',
            'coordinator.course',
            'departmentHead.department',
            'admin',
        ]));
    }

    // ─────────────────────────────────────────────────────────
    // PATCH /users/:id  — só admin pode alterar status
    // ─────────────────────────────────────────────────────────
    public function update(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();

        $data = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,inactive,suspended',
        ]);

        // Só admin pode mudar status
        if (isset($data['status']) && !$actor->hasRole('admin')) {
            return response()->json(['message' => 'Apenas o administrador pode alterar o estado da conta.'], 403);
        }

        // Proteger o root admin
        if ($user->admin?->is_root && isset($data['status']) && $data['status'] !== 'active') {
            return response()->json(['message' => 'Não é possível suspender o administrador root.'], 403);
        }

        $user->update($data);

        AuditLog::record('update_user', 'User', $user->id,
            "{$actor->name} actualizou utilizador {$user->email}: " . json_encode($data));

        return response()->json($user->load('roles'));
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
 