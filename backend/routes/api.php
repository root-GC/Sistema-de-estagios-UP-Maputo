<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuthController,
    UserController,
    PartnerInstitutionController,
    InternshipController,
    CredentialLetterController,
    DevelopmentPlanController,
    ActivityPlanController,
    ReflectiveJournalController,
    InternshipProjectController,
    TutorEvaluationController,
    PortfolioController,
    SupervisorEvaluationController,
    GradeSheetController,
    DashboardController,
    NotificationController,
    AuditLogController,

    // ─── NOVOS (cria estes controladores) ───
    FacultyController,
    DepartmentController,
    CourseController,          // Admin CRUD de Cursos
    FunctionController,
    ActiveSessionController,
};

// ═══════════════════════════════════════════════════════════
//  PÚBLICAS
// ═══════════════════════════════════════════════════════════
Route::post('/auth/register',        [AuthController::class, 'register']);
Route::post('/auth/login',           [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [AuthController::class, 'resetPassword']);

// Cursos visíveis publicamente (formulário de registo)
Route::get('/public/courses', fn() =>
    response()->json(
        \App\Models\Course::with('department.faculty')
            ->select('id','name','code','duration_years','department_id')
            ->get()
    )
);

// ═══════════════════════════════════════════════════════════
//  AUTENTICADAS (auth:sanctum)
// ═══════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->group(function () {

    // ─── Dados do próprio utilizador ─────────────────────
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::get('/dashboard',    [DashboardController::class, 'index']);

    // ─── Notificações (genéricas) ───────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get('/',                      [NotificationController::class, 'index']);
        Route::get('/unread-count',          [NotificationController::class, 'unreadCount']);
        Route::patch('/mark-all-read',       [NotificationController::class, 'markAllRead']);
        Route::patch('/{notification}/read', [NotificationController::class, 'markRead']);
    });

    // ╔════════════════════════════════════════════════════╗
    // ║  ADMINISTRAÇÃO TÉCNICA (RF-000) – só admin       ║
    // ╚════════════════════════════════════════════════════╝
    Route::middleware('role:admin,dept_head')->group(function () {

        // Utilizadores
        Route::get('/users',          [UserController::class, 'index']);
        Route::post('/users',         [UserController::class, 'store']);
        Route::get('/users/{user}',   [UserController::class, 'show']);
        Route::patch('/users/{user}', [UserController::class, 'update']);

        // Logs de auditoria
        Route::get('/audit-logs',     [AuditLogController::class, 'index']);

        // Faculdades
        Route::get('/faculties',              [FacultyController::class, 'index']);
        Route::post('/faculties',             [FacultyController::class, 'store']);
        Route::get('/faculties/{faculty}',    [FacultyController::class, 'show']);
        Route::patch('/faculties/{faculty}',  [FacultyController::class, 'update']);
        Route::delete('/faculties/{faculty}', [FacultyController::class, 'destroy']);

        // Departamentos
        Route::get('/departments',                   [DepartmentController::class, 'index']);
        Route::post('/departments',                  [DepartmentController::class, 'store']);
        Route::get('/departments/{department}',      [DepartmentController::class, 'show']);
        Route::patch('/departments/{department}',    [DepartmentController::class, 'update']);
        Route::delete('/departments/{department}',   [DepartmentController::class, 'destroy']);

        // Cursos (gestão completa)
        Route::get('/courses',              [CourseController::class, 'index']);
        Route::post('/courses',             [CourseController::class, 'store']);
        Route::get('/courses/{course}',     [CourseController::class, 'show']);
        Route::patch('/courses/{course}',   [CourseController::class, 'update']);   // activar/desactivar
        Route::delete('/courses/{course}',  [CourseController::class, 'destroy']);

        // Papéis (Roles)
        Route::get('/roles',             [FunctionController::class, 'index']);
        Route::post('/roles',            [FunctionController::class, 'store']);
        Route::get('/roles/{role}',      [FunctionController::class, 'show']);
        Route::patch('/roles/{role}',    [FunctionController::class, 'update']);
        Route::delete('/roles/{role}',   [FunctionController::class, 'destroy']);

        // Sessões Activas (tokens Sanctum)
        Route::get('/active-sessions',   [ActiveSessionController::class, 'index']);
    });

    // ── Chefe de Repartição + Admin ──────────────────────
    Route::middleware('role:dept_head,admin')->group(function () {
        Route::get('/institutions',                        [PartnerInstitutionController::class, 'index']);
        Route::post('/institutions',                       [PartnerInstitutionController::class, 'store']);
        Route::patch('/institutions/{partnerInstitution}', [PartnerInstitutionController::class, 'update']);
        Route::get('/institutions/{institution}/tutors',   [PartnerInstitutionController::class, 'tutors']);
        Route::post('/institutions/{institution}/tutors',  [PartnerInstitutionController::class, 'storeTutor']);
        Route::patch('/tutors/{tutor}',                    [PartnerInstitutionController::class, 'updateTutor']);
    });

    // ── Coordenador + Admin ──────────────────────────────
    Route::middleware('role:coordinator,admin')->group(function () {
        Route::post('/internships/allocate',                       [InternshipController::class, 'allocate']);
        Route::patch('/internships/{internship}/status',           [InternshipController::class, 'updateStatus']);
        Route::post('/internships/{internship}/credential',        [CredentialLetterController::class, 'generate']);
        Route::get('/grade-sheets',                                [GradeSheetController::class, 'index']);
        Route::post('/grade-sheets',                               [GradeSheetController::class, 'generate']);
        Route::get('/grade-sheets/{internshipGradeSheet}',         [GradeSheetController::class, 'show']);
        Route::post('/grade-sheets/{internshipGradeSheet}/export', [GradeSheetController::class, 'exportSigeup']);
        Route::get('/students/eligible',                           [InternshipController::class, 'eligibleStudents']);
    });

    // Leitura de estágios (multi-role)
    Route::get('/internships',              [InternshipController::class, 'index']);
    Route::get('/internships/{internship}', [InternshipController::class, 'show']);

    // ── Supervisor + Coordenador + Admin ─────────────────
    Route::middleware('role:supervisor,coordinator,admin')->group(function () {
        Route::patch('/development-plans/{plan}/review', [DevelopmentPlanController::class, 'review']);
        Route::patch('/activity-plans/{plan}/review',    [ActivityPlanController::class, 'review']);
        Route::post('/internships/{internship}/supervisor-evaluation',
            [SupervisorEvaluationController::class, 'store']);
    });

    // Leitura partilhada supervisor + estudante
    Route::middleware('role:supervisor,coordinator,admin,student')->group(function () {
        Route::get('/internships/{internship}/journals',           [ReflectiveJournalController::class, 'index']);
        Route::get('/internships/{internship}/journals/{journal}', [ReflectiveJournalController::class, 'show']);
        Route::get('/internships/{internship}/activity-plans',     [ActivityPlanController::class, 'index']);
        Route::get('/internships/{internship}/projects',           [InternshipProjectController::class, 'index']);
        Route::get('/internships/{internship}/portfolio',          [PortfolioController::class, 'status']);
        Route::get('/internships/{internship}/tutor-evaluation',   [TutorEvaluationController::class, 'show']);
    });

    // ── Estudante ────────────────────────────────────────
    Route::middleware('role:student')->group(function () {
        Route::post('/internships/{internship}/development-plans',  [DevelopmentPlanController::class, 'store']);
        Route::post('/internships/{internship}/activity-plans',     [ActivityPlanController::class, 'store']);
        Route::post('/internships/{internship}/journals',           [ReflectiveJournalController::class, 'store']);
        Route::post('/internships/{internship}/projects',           [InternshipProjectController::class, 'store']);
        Route::post('/internships/{internship}/portfolio/document', [PortfolioController::class, 'addDocument']);
        Route::post('/internships/{internship}/portfolio/submit',   [PortfolioController::class, 'submit']);
    });

    // ── Tutor ────────────────────────────────────────────
    Route::post('/internships/{internship}/tutor-evaluation', [TutorEvaluationController::class, 'store']);
});