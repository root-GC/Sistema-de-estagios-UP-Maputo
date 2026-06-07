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
// TutorEvaluationController  — RF-009
// ============================================================
class TutorEvaluationController extends Controller
{
    const CRITERIA = [
        'Conhecimentos Práticos', 'Assiduidade', 'Pontualidade',
        'Responsabilidade', 'Iniciativa', 'Relacionamento Interpessoal',
        'Capacidade de Aprendizagem', 'Qualidade do Trabalho',
        'Criatividade', 'Apresentação Pessoal',
    ];
 
    public function store(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'observations'       => 'nullable|string',
            'items'              => 'required|array|size:10',
            'items.*.criteria'   => 'required|string|in:' . implode(',', self::CRITERIA),
            'items.*.score'      => 'required|numeric|min:0|max:20',
        ]);
 
        $avg = collect($data['items'])->avg('score');
 
        $eval = TutorEvaluation::updateOrCreate(
            ['internship_id' => $internship->id],
            [
                'tutor_id'     => $internship->tutor_id,
                'score'        => round($avg, 2),
                'observations' => $data['observations'] ?? null,
                'submitted_at' => now(),
            ]
        );
 
        $eval->items()->delete();
        foreach ($data['items'] as $item) {
            $eval->items()->create($item);
        }
 
        Notification::create([
            'user_id' => $internship->supervisor->user->id,
            'title'   => 'Avaliação do Tutor Submetida',
            'message' => "Nota do tutor para {$internship->student->user->name}: {$avg}/20.",
        ]);
 
        return response()->json($eval->load('items'), 201);
    }
 
    public function show(Internship $internship): JsonResponse
    {
        return response()->json($internship->tutorEvaluation?->load('items'));
    }
 
    public function criteria(): JsonResponse
    {
        return response()->json(self::CRITERIA);
    }
}