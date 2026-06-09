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
// CredentialLetterController  — RF-003
// ============================================================
class CredentialLetterController extends Controller
{
    public function generate(Request $request, Internship $internship): JsonResponse
    {
        $letter = CredentialLetter::create([
            'internship_id' => $internship->id,
            'file_path'     => "storage/credentials/carta_{$internship->id}_" . now()->timestamp . ".pdf",
            'generated_by'  => $request->user()->id,
            'generated_at'  => now(),
        ]);
 
        Notification::create([
            'user_id' => $internship->student->user->id,
            'title'   => 'Carta Credencial Disponível',
            'message' => 'A sua carta credencial foi gerada pelo coordenador.',
        ]);
 
        return response()->json($letter, 201);
    }

    public function index(): JsonResponse
{
    // Retorna todas as cartas emitidas, com os dados do estágio e estudante
    $letters = CredentialLetter::with('internship.student.user')
        ->orderByDesc('generated_at')
        ->get()
        ->map(fn($l) => [
            'id'              => $l->id,
            'internship_id'   => $l->internship_id,
            'file_path'       => $l->file_path,
            'generated_at'    => $l->generated_at,
            'student_name'    => $l->internship->student->user->name ?? '—',
        ]);

    return response()->json(['data' => $letters]);
}
}