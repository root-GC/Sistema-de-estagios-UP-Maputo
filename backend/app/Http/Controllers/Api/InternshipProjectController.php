<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use App\Models\{Internship, InternshipProject, Notification};
use Illuminate\Support\Facades\Storage;

class InternshipProjectController extends Controller
{
    /** Lista todos os projetos submetidos no estágio */
    public function index(Internship $internship): JsonResponse
    {
        $projects = $internship->projects()
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($project) {
                $project->file_url = $project->file_path
                    ? Storage::url($project->file_path)
                    : null;
                return $project;
            });

        return response()->json($projects);
    }

    /** Submete um novo projeto (estudante) */
    public function store(Request $request, Internship $internship): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'file'        => 'required|file|mimes:pdf,doc,docx,zip|max:10240', // 10MB
        ]);

        // Guarda o ficheiro no disco público
        $path = $request->file('file')->store('projects', 'public');

        $project = $internship->projects()->create([
            'title'        => $data['title'],
            'description'  => $data['description'] ?? null,
            'file_path'    => $path,
            'submitted_at' => now(),
        ]);

        // Notificar o supervisor
        if ($internship->supervisor?->user) {
            Notification::create([
                'user_id' => $internship->supervisor->user->id,
                'title'   => 'Projeto Submetido',
                'message' => "{$internship->student->user->name} submeteu o projeto: {$data['title']}.",
            ]);
        }

        $project->file_url = Storage::url($path);

        return response()->json($project, 201);
    }
}