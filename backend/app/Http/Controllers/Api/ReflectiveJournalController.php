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
// ReflectiveJournalController  — RF-007
// ============================================================
class ReflectiveJournalController extends Controller
{
    public function index(Internship $internship): JsonResponse
    {
        return response()->json($internship->reflectiveJournals()->latest()->get());
    }
 
    public function store(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
        ]);
 
        $journal = $internship->reflectiveJournals()->create($data);
        return response()->json($journal, 201);
    }
 
    public function show(Internship $internship, ReflectiveJournal $journal): JsonResponse
    {
        abort_if($journal->internship_id !== $internship->id, 404);
        return response()->json($journal);
    }
}