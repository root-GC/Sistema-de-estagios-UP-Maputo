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
// DashboardController
// ============================================================
class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');
 
        if ($user->hasRole('admin')) {
            return response()->json([
                'total_users'       => User::count(),
                'active_users'      => User::where('status', 'active')->count(),
                'total_internships' => Internship::count(),
                'by_status'         => Internship::selectRaw('status, count(*) as total')
                                         ->groupBy('status')->pluck('total', 'status'),
                'recent_audit'      => AuditLog::with('user')->latest()->take(10)->get(),
            ]);
        }
 
        if ($user->hasRole('coordinator')) {
            $courseId = $user->coordinator->course_id;
            $base     = Internship::whereHas('student', fn($q) => $q->where('course_id', $courseId));
 
            return response()->json([
                'total'         => (clone $base)->count(),
                'by_status'     => (clone $base)->selectRaw('status, count(*) as total')
                                     ->groupBy('status')->pluck('total', 'status'),
                'supervisors'   => SupervisorProfile::withCount(['internships as active_students' => fn($q) =>
                                     $q->whereIn('status', ['allocated','in_progress'])
                                   ])->with('user')->get(),
                'institutions'  => PartnerInstitution::withCount('tutors')->get(),
                'periods'       => InternshipPeriod::latest()->get(),
            ]);
        }
 
        if ($user->hasRole('supervisor')) {
            $profile = $user->supervisorProfile;
            return response()->json([
                'active_count'    => $profile->activeCount(),
                'can_accept_more' => $profile->canAcceptMore(),
                'students'        => $profile->internships()
                                       ->with(['student.user','student.course','period','result'])
                                       ->get(),
            ]);
        }
 
        if ($user->hasRole('student')) {
            $internship = $user->studentProfile->internships()
                ->with([
                    'supervisor.user','tutor.institution','institution',
                    'period','requirement','credentialLetters',
                    'developmentPlans','activityPlans',
                    'reflectiveJournals','projects',
                    'portfolio.documents','result',
                ])->latest()->first();
 
            return response()->json(['internship' => $internship]);
        }
 
        if ($user->hasRole('dept_head')) {
            return response()->json([
                'institutions' => PartnerInstitution::with('tutors')->withCount('internships')->get(),
            ]);
        }
 
        return response()->json([]);
    }
}
 