<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use App\Models\{Internship, DevelopmentPlan, Notification};
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DevelopmentPlanController extends Controller
{
    /** Lista todos os planos de desenvolvimento de um estágio */
    public function index(Internship $internship): JsonResponse
    {
        $plans = $internship->developmentPlans()
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($plan) {
                // Adiciona URL pública para o frontend
                $plan->file_url = $plan->file_path
                    ? Storage::url($plan->file_path)
                    : null;
                return $plan;
            });

        return response()->json($plans);
    }

    /** Submete um novo PDI (estudante) – upload de ficheiro */
    public function store(Request $request, Internship $internship): JsonResponse
    {
        Log::info("Submetendo plano de desenvolvimento para estágio ID {$internship->id} por estudante ID {$internship->student_id}");
        Log::debug("Dados recebidos: " . json_encode($request->all()));
        
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'file'  => 'required|file|mimes:pdf,doc,docx|max:5120', // 5MB
        ]);

        // Guarda o ficheiro no disco público
        $path = $request->file('file')->store('development_plans', 'public');

        $plan = $internship->developmentPlans()->create([
            'title'        => $data['title'],
            'file_path'    => $path,
            'status'       => 'pending',
            'submitted_at' => now(),
        ]);

        // Notificar o supervisor
        if ($internship->supervisor?->user) {
            Notification::create([
                'user_id' => $internship->supervisor->user->id,
                'title'   => 'PDI/PDP Submetido',
                'message' => "{$internship->student->user->name} submeteu o PDI/PDP: {$data['title']}.",
            ]);
        }

        // Adiciona URL pública na resposta
        $plan->file_url = Storage::url($path);

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