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
// ActivityPlanController  — RF-006
// ============================================================
class ActivityPlanController extends Controller
{
    public function index(Internship $internship): JsonResponse
    {
        return response()->json($internship->activityPlans);
    }
 
    public function store(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate(['file_path' => 'nullable|string']);
 
        $plan = $internship->activityPlans()->create(array_merge($data, [
            'status'       => 'pending',
            'submitted_at' => now(),
        ]));
 
        Notification::create([
            'user_id' => $internship->supervisor->user->id,
            'title'   => 'Plano de Actividades Submetido',
            'message' => "{$internship->student->user->name} submeteu o plano de actividades.",
        ]);
 
        return response()->json($plan, 201);
    }
 
    public function review(Request $request, ActivityPlan $plan): JsonResponse
    {
        $data = $request->validate([
            'status'             => 'required|in:approved,rejected',
            'supervisor_comment' => 'nullable|string',
        ]);
 
        $plan->update(array_merge($data, ['reviewed_at' => now()]));
        return response()->json($plan);
    }
}
 