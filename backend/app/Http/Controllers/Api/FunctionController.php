<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FunctionController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::all()->map(function ($role) {
            return [
                'id'         => $role->id,
                'name'       => $role->name,
                'guard_name' => 'web',      // fixo, pois usas apenas web
                'description'=> $role->description,
            ];
        });

        return response()->json(['data' => $roles]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:500',
        ]);

        $role = Role::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'data' => [
                'id'         => $role->id,
                'name'       => $role->name,
                'guard_name' => 'web',
                'description'=> $role->description,
            ]
        ], 201);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'data' => [
                'id'         => $role->id,
                'name'       => $role->name,
                'guard_name' => 'web',
                'description'=> $role->description,
            ]
        ]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255|unique:roles,name,'.$role->id,
            'description' => 'nullable|string|max:500',
        ]);

        $role->update($validated);

        return response()->json([
            'data' => [
                'id'         => $role->id,
                'name'       => $role->name,
                'guard_name' => 'web',
                'description'=> $role->description,
            ]
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        $role->delete();

        return response()->json(['message' => 'Papel eliminado com sucesso.']);
    }
}