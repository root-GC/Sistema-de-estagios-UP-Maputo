<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use App\Models\{Internship, DevelopmentPlan, Notification};

class DevelopmentPlanController extends Controller
{
    /** Lista todos os planos de desenvolvimento de um estágio */
    public function index(Internship $internship): JsonResponse
    {
        $plans = $internship->developmentPlans()->orderByDesc('created_at')->get();
        return response()->json($plans);
    }

    /** Submete um novo PDI (estudante) */
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

    /** Aprova ou rejeita um PDI (supervisor) */
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