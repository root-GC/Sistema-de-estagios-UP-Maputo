<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Department::with('faculty')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'faculty_id' => 'required|exists:faculties,id',
            'name'       => 'required|string|max:255',
            'code'       => 'nullable|string|max:50',
        ]);

        $department = Department::create($validated);

        return response()->json(['data' => $department->load('faculty')], 201);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json(['data' => $department->load('faculty')]);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'faculty_id' => 'sometimes|exists:faculties,id',
            'name'       => 'sometimes|string|max:255',
            'code'       => 'nullable|string|max:50',
        ]);

        $department->update($validated);

        return response()->json(['data' => $department->fresh('faculty')]);
    }

    public function destroy(Department $department): JsonResponse
    {
        $department->delete();

        return response()->json(['message' => 'Departamento eliminado com sucesso.']);
    }
}