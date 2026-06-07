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
// DevelopmentPlanController  — RF-005
// ============================================================
class DevelopmentPlanController extends Controller
{
    public function store(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'title'     => 'required|string|max:255',
            'file_path' => 'nullable|string',
        ]);
 
        $plan = $internship->developmentPlans()->create(array_merge($data, [
            'status'       => 'pending',
            'submitted_at' => now(),
        ]));
 
        Notification::create([
            'user_id' => $internship->supervisor->user->id,
            'title'   => 'PDI/PDP Submetido',
            'message' => "{$internship->student->user->name} submeteu o PDI/PDP: {$data['title']}.",
        ]);
 
        return response()->json($plan, 201);
    }
 
    public function review(Request $request, DevelopmentPlan $plan): JsonResponse
    {
        $data = $request->validate([
            'status'             => 'required|in:approved,rejected',
            'supervisor_comment' => 'nullable|string',
        ]);
 
        $plan->update(array_merge($data, ['reviewed_at' => now()]));
 
        Notification::create([
            'user_id' => $plan->internship->student->user->id,
            'title'   => 'PDI/PDP ' . ($data['status'] === 'approved' ? 'Aprovado' : 'Rejeitado'),
            'message' => $data['supervisor_comment'] ?? 'Revisto pelo supervisor.',
        ]);
 
        return response()->json($plan);
    }
}