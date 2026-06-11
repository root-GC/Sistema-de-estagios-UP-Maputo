<?php

namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage; 

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
// PortfolioController  — RF-010
// ============================================================
class PortfolioController extends Controller
{
public function addDocument(Request $request, Internship $internship): JsonResponse
{
    $data = $request->validate([
        'document_type' => 'required|in:development_plan,activity_plan,journal,project,final_report',
        'file'          => 'required|file|mimes:pdf,doc,docx|max:5120',
    ]);

    $path = $request->file('file')->store('portfolio', 'public');

    $portfolio = $internship->portfolio()->firstOrCreate(
        ['internship_id' => $internship->id],
        ['status' => 'pending']
    );

    $doc = $portfolio->documents()->updateOrCreate(
        ['document_type' => $data['document_type']],
        ['file_path' => $path, 'uploaded_at' => now()]
    );

    return response()->json([
        'document' => $doc,
        'missing'  => $internship->fresh()->missingPortfolioDocs(),
    ], 201);
}
 
    public function submit(Request $request, Internship $internship): JsonResponse
    {
        $missing = $internship->missingPortfolioDocs();
 
        // RF-010: bloquear se faltar algum documento
        if (!empty($missing)) {
            return response()->json([
                'message'            => 'Portefólio incompleto. Documentos obrigatórios em falta.',
                'missing_documents'  => $missing,
            ], 422);
        }
 
        $internship->portfolio()->update(['status' => 'submitted', 'submitted_at' => now()]);
        $internship->update(['status' => 'submitted']);
 
        Notification::create([
            'user_id' => $internship->supervisor->user->id,
            'title'   => 'Portefólio Submetido',
            'message' => "{$internship->student->user->name} submeteu o portefólio final.",
        ]);
 
        return response()->json(['message' => 'Portefólio submetido com sucesso.']);
    }
 
   public function status(Internship $internship): JsonResponse
{
    $portfolio = $internship->portfolio?->load('documents');

    // Adiciona a URL pública a cada documento
    if ($portfolio) {
        $portfolio->documents->transform(function ($doc) {
            $doc->file_url = $doc->file_path
                ? Storage::url($doc->file_path)   // ex.: /storage/portfolio/ficheiro.pdf
                : null;
            return $doc;
        });
    }

    return response()->json([
        'portfolio'         => $portfolio,
        'missing_documents' => $internship->missingPortfolioDocs(),
        'is_complete'       => $internship->portfolioIsComplete(),
    ]);
}
}
 
