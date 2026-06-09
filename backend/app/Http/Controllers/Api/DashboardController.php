<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use App\Models\{
    User, Internship, StudentProfile, SupervisorProfile,
    PartnerInstitution, AuditLog, InternshipPeriod, Tutor,
};

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');

        if ($user->hasRole('tutor')) {
            $tutor = Tutor::where('user_id', $user->id)->first();
            if (!$tutor) {
                return response()->json(['internships' => []]);
            }
            $internships = Internship::with([
                'student.user', 'student.course', 'institution',
                'period', 'tutorEvaluation.items'
            ])
            ->where('tutor_id', $tutor->id)
            ->get();

            return response()->json(['internships' => $internships]);
        }

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
            $courses = $user->coordinator->courses;           // coleção
            $courseIds = $courses->pluck('id');
            $base = Internship::whereHas('student', fn($q) => $q->whereIn('course_id', $courseIds));

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
            $internships = $profile->internships()
                ->with(['student.user','student.course','period','result','institution'])
                ->get()
                ->map(function ($internship) {
                    $internship->nota_final = $internship->result->final_score ?? null;
                    return $internship;
                });

            return response()->json([
                'active_count'    => $profile->activeCount(),
                'can_accept_more' => $profile->canAcceptMore(),
                'students'        => $internships,
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

    public function coordinator(Request $request): JsonResponse
    {
        $user    = $request->user();
        $student = $user->studentProfile;

        if (!$student) {
            return response()->json(['message' => 'Perfil de estudante não encontrado.'], 404);
        }

        $coordinator = $student->course->coordinator;
        if (!$coordinator) {
            return response()->json(['message' => 'Coordenador não atribuído.'], 404);
        }

        return response()->json([
            'data' => [
                'id'    => $coordinator->id,
                'name'  => $coordinator->user->name ?? '—',
                'email' => $coordinator->user->email ?? '—',
            ]
        ]);
    }
}