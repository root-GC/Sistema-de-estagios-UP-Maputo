<?php

namespace App\Http\Controllers\Api;

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
// PartnerInstitutionController  — Chefe Repartição (RF-001)
// ============================================================
class PartnerInstitutionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PartnerInstitution::with('tutors')->get());
    }
 
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => 'required|string',
            'address' => 'nullable|string',
            'phone'   => 'nullable|string|max:30',
            'email'   => 'nullable|email',
        ]);
 
        $inst = PartnerInstitution::create($data);
        AuditLog::record('create_institution', 'PartnerInstitution', $inst->id,
            "Registou instituição: {$inst->name}");
 
        return response()->json($inst, 201);
    }
 
    public function update(Request $request, PartnerInstitution $partnerInstitution): JsonResponse
    {
        $data = $request->validate([
            'name'    => 'sometimes|string',
            'address' => 'nullable|string',
            'phone'   => 'nullable|string|max:30',
            'email'   => 'nullable|email',
        ]);
 
        $partnerInstitution->update($data);
        return response()->json($partnerInstitution);
    }
 
    // Registo de Ponto Focal / Tutor
    public function storeTutor(Request $request, PartnerInstitution $institution): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|email|unique:tutors',
            'phone'    => 'nullable|string|max:30',
            'position' => 'nullable|string',
        ]);
 
        $tutor = $institution->tutors()->create(array_merge($data, [
            'access_token' => Str::random(60),
        ]));
 
        return response()->json($tutor, 201);
    }
 
    public function tutors(PartnerInstitution $institution): JsonResponse
    {
        return response()->json($institution->tutors);
    }
}
 