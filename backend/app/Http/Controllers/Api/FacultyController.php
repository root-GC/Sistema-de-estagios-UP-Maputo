<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Faculty::all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
        ]);

        $faculty = Faculty::create($validated);

        return response()->json(['data' => $faculty], 201);
    }

    public function show(Faculty $faculty): JsonResponse
    {
        return response()->json(['data' => $faculty]);
    }

    public function update(Request $request, Faculty $faculty): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'nullable|string|max:50',
        ]);

        $faculty->update($validated);

        return response()->json(['data' => $faculty]);
    }

    public function destroy(Faculty $faculty): JsonResponse
    {
        $faculty->delete();

        return response()->json(['message' => 'Faculdade eliminada com sucesso.']);
    }
}