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
// GradeSheetController  — RF-013 + RF-014
// ============================================================
class GradeSheetController extends Controller
{
    public function index(): JsonResponse
{
    // Busca todas as avaliações que já têm nota final calculada
    $resultados = InternshipResult::whereNotNull('final_score')
        ->with('internship.student.user')
        ->orderByDesc('calculated_at')
        ->get()
        ->map(function ($r) {
            return [
                'id'           => $r->id,
                'student_name' => $r->internship->student->user->name ?? '—',
                'nota'         => $r->final_score,
                'estado'       => $r->approved ? 'Aprovado' : 'Reprovado',
            ];
        });

    return response()->json(['data' => $resultados]);
}
    // RF-013: Gerar pauta
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'period_id' => 'required|exists:internship_periods,id',
        ]);
 
        $results = InternshipResult::whereHas('internship', fn($q) =>
            $q->where('period_id', $data['period_id'])
              ->whereHas('student', fn($sq) => $sq->where('course_id', $data['course_id']))
        )->with('internship.student.user')->get();
 
        if ($results->isEmpty()) {
            return response()->json(['message' => 'Não existem resultados para gerar pauta.'], 422);
        }
 
        $sheet = GradeSheet::create([
            'course_id'    => $data['course_id'],
            'period_id'    => $data['period_id'],
            'generated_by' => $request->user()->id,
            'generated_at' => now(),
        ]);
 
        $results->each(fn($r) => InternshipGradeSheetItem::create([
            'grade_sheet_id'       => $sheet->id,
            'internship_result_id' => $r->id,
        ]));
 
        AuditLog::record('generate_grade_sheet', 'InternshipGradeSheet', $sheet->id,
            "Pauta gerada — curso {$data['course_id']}, período {$data['period_id']}");
 
        return response()->json($sheet->load([
            'course','period','generatedBy',
            'items.internshipResult.internship.student.user',
        ]), 201);
    }
 
    public function indexPauta(): JsonResponse
    {
        return response()->json(GradeSheet::with(['course','period','generatedBy'])->latest('generated_at')->get());
    }
 
    public function show(GradeSheet $internshipGradeSheet): JsonResponse
    {
        return response()->json($internshipGradeSheet->load([
            'course','period','generatedBy',
            'items.internshipResult.internship.student.user',
            'exports.exportedBy',
        ]));
    }
 
    // RF-014: Exportar para SIGEUP
    public function exportSigeup(Request $request, GradeSheet $internshipGradeSheet): JsonResponse
    {
        $sheet = $internshipGradeSheet->load([
            'items.internshipResult.internship.student.user',
            'course','period',
        ]);
 
        // Gerar CSV no formato SIGEUP
        $rows   = ["NR;NOME;NOTA;APROVADO"];
        $nr     = 1;
 
        foreach ($sheet->items as $item) {
            $result  = $item->internshipResult;
            $student = $result->internship->student->user;
            $rows[]  = sprintf('%d;%s;%.2f;%s',
                $nr++,
                $student->name,
                $result->final_score,
                $result->approved ? 'SIM' : 'NÃO'
            );
        }
 
        $csv      = implode("\n", $rows);
        $fileName = "sigeup_{$sheet->course->code}_{$sheet->period->academic_year}_" . now()->timestamp . ".csv";
        $filePath = "exports/{$fileName}";
 
        // Em produção: Storage::put($filePath, $csv);
 
        $export = SigeupExport::create([
            'grade_sheet_id' => $sheet->id,
            'file_path'      => $filePath,
            'exported_by'    => $request->user()->id,
            'exported_at'    => now(),
        ]);
 
        AuditLog::record('sigeup_export', 'SigeupExport', $export->id,
            "Exportação SIGEUP: {$fileName}");
 
        return response()->json([
            'export'   => $export,
            'csv'      => $csv,     // em prod: URL de download
            'filename' => $fileName,
        ]);
    }
    public function exportLatestSigeup(): JsonResponse
    {
        // Encontra a pauta mais recente gerada pelo utilizador autenticado (ou geral)
        $gradeSheet = GradeSheet::where('generated_by', auth()->id())
            ->latest()
            ->first();

        if (!$gradeSheet) {
            return response()->json(['message' => 'Nenhuma pauta encontrada.'], 404);
        }

        // Reutiliza a lógica de exportação
        return $this->exportSigeup($gradeSheet);
    }
}