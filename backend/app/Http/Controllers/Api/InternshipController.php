<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
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
// InternshipController  — Coordenador / multi-role
// ============================================================
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
            $courseId = $user->coordinator->course_id;
            $query->whereHas('student', fn($q) => $q->where('course_id', $courseId));
        }
 
        $query->when($request->status, fn($q) => $q->where('status', $request->status));
 
        return response()->json($query->get());
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
 
    // RF-002 + RF-004: Alocar estagiário
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
 
        // RF-004: pré-requisitos curriculares
        if (!$student->meetsInternshipRequirements()) {
            return response()->json([
                'message' => sprintf(
                    'Pré-requisitos não cumpridos. O estudante está no %dº ano e precisa de concluir até ao %dº ano primeiro.',
                    $student->current_year,
                    $student->course->min_year_for_internship
                ),
            ], 422);
        }
 
        // RF-002: limite de 5 estudantes por supervisor
        if (!$supervisor->canAcceptMore()) {
            return response()->json([
                'message'       => 'Supervisor com limite máximo de 5 estudantes atingido.',
                'active_count'  => $supervisor->activeCount(),
            ], 422);
        }
 
        // 1 estágio por período
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
            'status' => 'required|in:allocated,in_progress,submitted,evaluated,completed',
        ]);
        $internship->update($data);
        return response()->json($internship);
    }
 
    // helper de autorização de acesso ao estágio
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
 