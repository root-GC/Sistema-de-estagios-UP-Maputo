<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use App\Models\{
    User, Role, Internship, StudentProfile, SupervisorProfile,
    Coordinator, PartnerInstitution, Tutor, InternshipPeriod,
    DevelopmentPlan, ActivityPlan, ReflectiveJournal, InternshipProject,
    FinalReport, Portfolio, PortfolioDocument, TutorEvaluation,
    TutorEvaluationItem, SupervisorEvaluation, InternshipResult,
    InternshipGradeSheet, InternshipGradeSheetItem, SigeupExport,
    CredentialLetter, InternshipRequirement, AuditLog, Notification,
};

class InternshipController extends Controller
{
public function index(Request $request): JsonResponse
{
    $user  = $request->user();
    $query = Internship::with([
        'student.user','student.course',
        'supervisor.user','tutor.institution',
        'institution','period','result',
    ]);

    if ($user->hasRole('student')) {
        $query->where('student_id', $user->studentProfile->id);
    } elseif ($user->hasRole('supervisor')) {
        $query->where('supervisor_id', $user->supervisorProfile->id);
    } elseif ($user->hasRole('coordinator')) {
        $courseIds = $user->coordinator->courses->pluck('id');
        if ($courseIds->isEmpty()) {
            return response()->json(['data' => []]);
        }
        $query->whereHas('student', fn($q) => $q->whereIn('course_id', $courseIds));
    }

    // Filtro de status: aceita string separada por vírgulas (ex: "pendente,aprovada")
    if ($statusFilter = $request->status) {
        $statuses = explode(',', $statusFilter);
        $query->whereIn('status', $statuses);
    }

    return response()->json(['data' => $query->latest()->get()]);
}

    public function show(Request $request, Internship $internship): JsonResponse
    {
        $this->authorizeAccess($request->user(), $internship);

        return response()->json($internship->load([
            'student.user','student.course.department.faculty',
            'supervisor.user','tutor.institution',
            'institution','period',
            'requirement.verifier',
            'credentialLetters',
            'developmentPlans','activityPlans',
            'reflectiveJournals','projects',
            'finalReport','portfolio.documents',
            'tutorEvaluation.items','supervisorEvaluation','result',
        ]));
    }

    public function allocate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_id'     => 'required|exists:student_profiles,id',
            'supervisor_id'  => 'required|exists:supervisor_profiles,id',
            'period_id'      => 'required|exists:internship_periods,id',
            'institution_id' => 'nullable|exists:partner_institutions,id',
            'tutor_id'       => 'nullable|exists:tutors,id',
        ]);

        $student    = StudentProfile::findOrFail($data['student_id']);
        $supervisor = SupervisorProfile::findOrFail($data['supervisor_id']);

        if (!$student->meetsInternshipRequirements()) {
            return response()->json([
                'message' => sprintf(
                    'Pré-requisitos não cumpridos. O estudante está no %dº ano e precisa de concluir até ao %dº ano primeiro.',
                    $student->current_year,
                    $student->course->min_year_for_internship
                ),
            ], 422);
        }

        if (!$supervisor->canAcceptMore()) {
            return response()->json([
                'message'       => 'Supervisor com limite máximo de 5 estudantes atingido.',
                'active_count'  => $supervisor->activeCount(),
            ], 422);
        }

        if (Internship::where('student_id', $student->id)->where('period_id', $data['period_id'])->exists()) {
            return response()->json(['message' => 'Estudante já tem estágio neste período.'], 422);
        }

        $internship = Internship::create(array_merge($data, ['status' => 'allocated']));

        InternshipRequirement::create([
            'internship_id'    => $internship->id,
            'requirements_met' => true,
            'observations'     => 'Verificado na alocação. Pré-requisitos cumpridos.',
            'verified_by'      => $request->user()->id,
            'verified_at'      => now(),
        ]);

        Notification::create([
            'user_id' => $student->user->id,
            'title'   => 'Estágio Alocado',
            'message' => "Foi alocado ao supervisor {$supervisor->user->name}.",
        ]);

        AuditLog::record('allocate_internship', 'Internship', $internship->id,
            "Alocou {$student->student_number} → Supervisor {$supervisor->user->name}");

        return response()->json($internship->load(['student.user','supervisor.user']), 201);
    }

    public function updateStatus(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:pendente,aprovada,rejeitada,allocated,in_progress,submitted,evaluated,completed',
        ]);
        $internship->update($data);
        return response()->json($internship);
    }

    public function requestInternship(Request $request): JsonResponse
    {
        $user    = $request->user();
        $student = $user->studentProfile;

        if (!$student) {
            return response()->json(['message' => 'Perfil de estudante não encontrado.'], 404);
        }

        $data = $request->validate([
            'empresas_pretendidas'   => 'required|array|min:1|max:5',
            'empresas_pretendidas.*' => 'string|max:255',
        ]);

        $existente = Internship::where('student_id', $student->id)
            ->where('status', 'pendente')
            ->first();

        if ($existente) {
            return response()->json(['message' => 'Já possui uma requisição de estágio pendente.'], 422);
        }

        $period = InternshipPeriod::latest('id')->first();
        if (!$period) {
            return response()->json(['message' => 'Nenhum período de estágio disponível. Contacte o administrador.'], 422);
        }

        $internship = Internship::create([
            'student_id'           => $student->id,
            'period_id'            => $period->id,
            'status'               => 'pendente',
            'empresas_pretendidas' => $data['empresas_pretendidas'],
        ]);

        // Notificar o coordenador do curso (agora único)
        $coordinator = $student->course->coordinator;
        if ($coordinator?->user) {
            Notification::create([
                'user_id' => $coordinator->user->id,
                'title'   => 'Nova Requisição de Estágio',
                'message' => "{$user->name} ({$student->student_number}) solicitou estágio em: " . implode(', ', $data['empresas_pretendidas']),
            ]);
        }

        AuditLog::record('request_internship', 'Internship', $internship->id,
            "{$student->student_number} solicitou estágio.");

        return response()->json($internship, 201);
    }

    public function approve(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'supervisor_id'  => 'nullable|exists:supervisor_profiles,id',
            'institution_id' => 'nullable|exists:partner_institutions,id',
            'tutor_id'       => 'nullable|exists:tutors,id',
        ]);

        $internship->update([
            'status'         => 'aprovada',
            'supervisor_id'  => $data['supervisor_id'] ?? $internship->supervisor_id,
            'institution_id' => $data['institution_id'] ?? $internship->institution_id,
            'tutor_id'       => $data['tutor_id'] ?? $internship->tutor_id,
        ]);

        if (!$internship->requirement) {
            InternshipRequirement::create([
                'internship_id'    => $internship->id,
                'requirements_met' => true,
                'observations'     => 'Verificado na aprovação.',
                'verified_by'      => $request->user()->id,
                'verified_at'      => now(),
            ]);
        }

        Notification::create([
            'user_id' => $internship->student->user->id,
            'title'   => 'Estágio Aprovado',
            'message' => 'A sua requisição de estágio foi aprovada.',
        ]);

        AuditLog::record('approve_internship', 'Internship', $internship->id,
            "Requisição aprovada. Supervisor: {$internship->supervisor?->user?->name}, Instituição: {$internship->institution?->name}");

        return response()->json($internship->load(['student.user','supervisor.user','tutor','institution']));
    }

    private function authorizeAccess(User $user, Internship $internship): void
    {
        if ($user->hasRole('admin', 'coordinator', 'dept_head')) return;

        if ($user->hasRole('student')) {
            abort_if($internship->student_id !== $user->studentProfile->id, 403);
        } elseif ($user->hasRole('supervisor')) {
            abort_if($internship->supervisor_id !== $user->supervisorProfile->id, 403);
        }
    }
}