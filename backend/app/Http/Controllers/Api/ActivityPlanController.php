<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use App\Models\{Internship, ActivityPlan, Notification};
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ActivityPlanController extends Controller
{
    /** Lista os planos de atividades de um estágio */
    public function index(Internship $internship): JsonResponse
    {
        $plans = $internship->activityPlans()
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($plan) {
                $plan->file_url = $plan->file_path
                    ? Storage::url($plan->file_path)
                    : null;
                return $plan;
            });

        return response()->json($plans);
    }

    /** Submete um novo plano de atividades (estudante) */
    public function store(Request $request, Internship $internship): JsonResponse
    {
        Log::info("Submetendo plano de atividades para estágio ID {$internship->id} por estudante ID {$internship->student_id}");
        Log::debug("Dados recebidos: " . json_encode($request->all()));
        $data = $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx|max:5120', // 5MB
        ]);

        // Guarda o ficheiro no disco público
        $path = $request->file('file')->store('activity_plans', 'public');

        $plan = $internship->activityPlans()->create([
            'file_path'    => $path,
            'status'       => 'pending',
            'submitted_at' => now(),
        ]);

        // Notificar o supervisor
        if ($internship->supervisor?->user) {
            Notification::create([
                'user_id' => $internship->supervisor->user->id,
                'title'   => 'Plano de Actividades Submetido',
                'message' => "{$internship->student->user->name} submeteu o plano de actividades.",
            ]);
        }

        $plan->file_url = Storage::url($path);

        return response()->json($plan, 201);
    }

    /** Aprova ou rejeita um plano de atividades (supervisor) */
    public function review(Request $request, ActivityPlan $plan): JsonResponse
    {
        $data = $request->validate([
            'status'             => 'required|in:approved,rejected',
            'supervisor_comment' => 'nullable|string',
        ]);

        $plan->update(array_merge($data, ['reviewed_at' => now()]));

        Notification::create([
            'user_id' => $plan->internship->student->user->id,
            'title'   => 'Plano de Actividades ' . ($data['status'] === 'approved' ? 'Aprovado' : 'Rejeitado'),
            'message' => $data['supervisor_comment'] ?? 'Revisto pelo supervisor.',
        ]);

        return response()->json($plan);
    }
}