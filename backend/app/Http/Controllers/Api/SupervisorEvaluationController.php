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
// SupervisorEvaluationController  — RF-011 + RF-012
// ============================================================
class SupervisorEvaluationController extends Controller
{
    public function store(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'score'        => 'required|numeric|min:0|max:20',
            'observations' => 'nullable|string',
        ]);
 
        $eval = SupervisorEvaluation::updateOrCreate(
            ['internship_id' => $internship->id],
            array_merge($data, ['submitted_at' => now()])
        );
 
        // RF-012: calcular nota final automaticamente
        $result = $this->calculateFinal($internship->fresh()->load(['tutorEvaluation','supervisorEvaluation','student.course']));
 
        return response()->json(['evaluation' => $eval, 'result' => $result]);
    }
 
    // RF-012: peso contacto + estudo independente
    private function calculateFinal(Internship $internship): ?InternshipResult
    {
        $te = $internship->tutorEvaluation;
        $se = $internship->supervisorEvaluation;
 
        if (!$te?->score || !$se?->score) return null;
 
        $course = $internship->student->course;
        $wc     = $course->weight_contact_hours    / 100; // 0.65
        $wi     = $course->weight_independent_study / 100; // 0.35
 
        $final  = round(($te->score * $wc) + ($se->score * $wi), 2);
 
        $result = InternshipResult::updateOrCreate(
            ['internship_id' => $internship->id],
            [
                'tutor_score'      => $te->score,
                'supervisor_score' => $se->score,
                'final_score'      => $final,
                'approved'         => $final >= 10,
                'calculated_at'    => now(),
            ]
        );
 
        $internship->update(['status' => 'evaluated']);
 
        Notification::create([
            'user_id' => $internship->student->user->id,
            'title'   => 'Nota Final Calculada',
            'message' => "Nota final do estágio: {$final}/20. " . ($final >= 10 ? 'Aprovado ✓' : 'Reprovado ✗'),
        ]);
 
        AuditLog::record('calculate_result', 'InternshipResult', $result->id,
            "Nota final {$final} calculada para estágio {$internship->id}");
 
        return $result;
    }
}