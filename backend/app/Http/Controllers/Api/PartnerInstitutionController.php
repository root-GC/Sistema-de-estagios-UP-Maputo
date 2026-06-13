<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Password;
use App\Models\{User, Role, PartnerInstitution, Tutor, AuditLog};

class PartnerInstitutionController extends Controller
{
    public function index(): JsonResponse
    {
        $institutions = PartnerInstitution::with('tutors.user')->get();
        return response()->json(['data' => $institutions]);   // ← envolto em { data: [...] }
    }

    public function store(Request $request): JsonResponse
    {

        // dd($request);
        $data = $request->validate([
            'name'                => 'required|string',
            'address'             => 'nullable|string',
            'phone'               => 'nullable|string|max:30',
            'email'               => 'nullable|email',
            'nuit'                => 'nullable|string|max:20',
            'ponto_focal_nome'     => 'nullable|string|max:255',
            'ponto_focal_contacto' => 'nullable|email|max:255',   // email do ponto focal
            'status'              => 'nullable|in:pendente,aprovada,rejeitada,suspensa',
        ]);

        $inst = PartnerInstitution::create($data);

        // Se fornecido email do ponto focal, cria User (tutor) e Tutor
        if (!empty($data['ponto_focal_contacto'])) {
            $user = User::firstOrCreate(
                ['email' => $data['ponto_focal_contacto']],
                [
                    'name'     => $data['ponto_focal_nome'] ?? 'Ponto Focal ' . $inst->name,
                    'password' => Hash::make(Str::random(32)),
                    'status'   => 'active',
                ]
            );

            // Atribuir role 'tutor'
            $role = Role::where('name', 'tutor')->first();
            if ($role) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }

            // Criar Tutor vinculado à instituição (se não existir)
            Tutor::firstOrCreate(
                ['email' => $user->email, 'institution_id' => $inst->id],
                [
                    'user_id'  => $user->id,
                    'name'     => $user->name,
                    'phone'    => $request->input('ponto_focal_phone'), // opcional
                    'position' => 'Ponto Focal',
                ]
            );

            // Enviar email de reset de senha
            Password::sendResetLink(['email' => $user->email]);
        }

        AuditLog::record('create_institution', 'PartnerInstitution', $inst->id,
            "Registou instituição: {$inst->name}");

        return response()->json(['data' => $inst->load('tutors.user')], 201);
    }

    public function update(Request $request, PartnerInstitution $partnerInstitution): JsonResponse
    {
        $data = $request->validate([
            'name'                => 'sometimes|string',
            'address'             => 'nullable|string',
            'phone'               => 'nullable|string|max:30',
            'email'               => 'nullable|email',
            'nuit'                => 'nullable|string|max:20',
            'ponto_focal_nome'     => 'nullable|string|max:255',
            'ponto_focal_contacto' => 'nullable|email|max:255',
            'status'              => 'nullable|in:pendente,aprovada,rejeitada,suspensa',
        ]);

        $partnerInstitution->update($data);

        // Se mudou o email do ponto focal, actualiza/cria o User/Tutor
        if ($request->has('ponto_focal_contacto')) {
            $user = User::where('email', $partnerInstitution->getOriginal('ponto_focal_contacto'))->first()
                ?? User::firstOrCreate(
                    ['email' => $data['ponto_focal_contacto']],
                    [
                        'name'     => $data['ponto_focal_nome'] ?? 'Ponto Focal ' . $partnerInstitution->name,
                        'password' => Hash::make(Str::random(32)),
                        'status'   => 'active',
                    ]
                );

            if ($user->email !== $data['ponto_focal_contacto']) {
                $user->email = $data['ponto_focal_contacto'];
                $user->save();
            }

            $role = Role::where('name', 'tutor')->first();
            if ($role) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }

            Tutor::updateOrCreate(
                ['email' => $user->email, 'institution_id' => $partnerInstitution->id],
                [
                    'user_id' => $user->id,
                    'name'    => $user->name,
                    'position'=> 'Ponto Focal',
                ]
            );
        }

        return response()->json(['data' => $partnerInstitution->load('tutors.user')]);
    }

    public function storeTutor(Request $request, PartnerInstitution $institution): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string|max:30',
            'position' => 'nullable|string',
        ]);

        $user = User::firstOrCreate(
            ['email' => $data['email']],
            [
                'name'     => $data['name'],
                'password' => Hash::make(Str::random(32)),
                'status'   => 'active',
            ]
        );

        $role = Role::where('name', 'tutor')->first();
        if ($role) {
            $user->roles()->syncWithoutDetaching([$role->id]);
        }

        $tutor = $institution->tutors()->firstOrCreate(
            ['email' => $user->email],
            [
                'user_id'  => $user->id,
                'name'     => $data['name'],
                'phone'    => $data['phone'] ?? null,
                'position' => $data['position'] ?? null,
            ]
        );

        Password::sendResetLink(['email' => $user->email]);

        AuditLog::record('create_tutor', 'Tutor', $tutor->id,
            "Registou tutor {$tutor->name} na instituição {$institution->name}");

        return response()->json(['data' => $tutor->load('user')], 201);
    }

    public function tutors(PartnerInstitution $institution): JsonResponse
    {
        return response()->json(['data' => $institution->tutors()->with('user')->get()]);
    }
}