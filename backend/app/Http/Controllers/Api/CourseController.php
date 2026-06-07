<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(): JsonResponse
    {
        // Inclui o departamento para mostrar o nome
        return response()->json(['data' => Course::with('department')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_id'              => 'required|exists:departments,id',
            'name'                       => 'required|string|max:255',
            'code'                       => 'nullable|string|max:50',
            'duration_years'             => 'required|integer|min:1|max:10',
            'weight_contact_hours'       => 'nullable|integer',
            'weight_independent_study'   => 'nullable|integer',
        ]);

        $course = Course::create($validated);

        return response()->json(['data' => $course->load('department')], 201);
    }

    public function show(Course $course): JsonResponse
    {
        return response()->json(['data' => $course->load('department')]);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $validated = $request->validate([
            'department_id'              => 'sometimes|exists:departments,id',
            'name'                       => 'sometimes|string|max:255',
            'code'                       => 'nullable|string|max:50',
            'duration_years'             => 'sometimes|integer|min:1|max:10',
            'weight_contact_hours'       => 'nullable|integer',
            'weight_independent_study'   => 'nullable|integer',
        ]);

        $course->update($validated);

        return response()->json(['data' => $course->fresh('department')]);
    }

    public function destroy(Course $course): JsonResponse
    {
        $course->delete();

        return response()->json(['message' => 'Curso eliminado com sucesso.']);
    }
}