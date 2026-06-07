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
// InternshipProjectController  — RF-008
// ============================================================
class InternshipProjectController extends Controller
{
    public function index(Internship $internship): JsonResponse
    {
        return response()->json($internship->projects);
    }
 
    public function store(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_path'   => 'nullable|string',
        ]);
 
        $project = $internship->projects()->create(array_merge($data, ['submitted_at' => now()]));
        return response()->json($project, 201);
    }
}
 