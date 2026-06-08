<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\{
    User, Role, Permission, Faculty, Department, Course,
    Admin, StudentProfile, SupervisorProfile, Coordinator,
    DepartmentHead, PartnerInstitution, Tutor, InternshipPeriod,
    Internship, InternshipRequirement, DevelopmentPlan,
    ActivityPlan, ReflectiveJournal, TutorEvaluation,
    TutorEvaluationItem, Notification
};

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRoles();
        $this->seedPermissions();
        $this->seedRolePermissions();
        $this->seedAcademic();
        $this->seedUsers();
        $this->seedInstitutions();
        $this->seedPeriods();
        $this->seedInternships();
        $this->seedSampleArtifacts();

        $this->command->info('');
        $this->command->info('✅  Seed concluído! Contas de teste:');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Administrador',     'admin@up.ac.mz',        'password'],
                ['Chefe Repartição',  'chefe@up.ac.mz',        'password'],
                ['Coordenador',       'coord@up.ac.mz',        'password'],
                ['Supervisor 1',      'sup1@up.ac.mz',         'password'],
                ['Supervisor 2',      'sup2@up.ac.mz',         'password'],
                ['Estudante 1 (OK)',  'est1@up.ac.mz',         'password'],
                ['Estudante 2 (OK)',  'est2@up.ac.mz',         'password'],
                ['Estudante 3 (NOK)', 'est3@up.ac.mz',         'password'],
                ['Tutor Vodacom (PF)', 'marcia.guambe@vodacom.co.mz', 'password'],
                ['Tutor Vodacom',      'tutor@vodacom.co.mz',       'password'],
                ['Tutor EMOSE (PF)',   'carlos.nhantumbo@emose.co.mz', 'password'],
                ['Tutor EMOSE',        'isabel.tivane@emose.co.mz',   'password'],
                ['Tutor MCel (PF)',    'sergio.matola@mcel.co.mz',     'password'],
                ['Tutor TVM (PF)',     'ana.cumbe@tvm.co.mz',          'password'],
            ]
        );
    }

    // ─────────────────────────────────────────────────────────
    private function seedRoles(): void
    {
        $roles = [
            ['name' => 'admin',       'description' => 'Administrador técnico — RF-000'],
            ['name' => 'dept_head',   'description' => 'Chefe de Repartição — RF-001'],
            ['name' => 'coordinator', 'description' => 'Coordenador de Curso — RF-002/003/004/013/014'],
            ['name' => 'supervisor',  'description' => 'Supervisor Académico — RF-005/006/007/011'],
            ['name' => 'student',     'description' => 'Estagiário — RF-005/006/007/008/010'],
            ['name' => 'tutor',       'description' => 'Tutor Externo — RF-009'],
        ];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r['name']], $r);
        }
    }

    // ─────────────────────────────────────────────────────────
    private function seedPermissions(): void
    {
        $perms = [
            // Sistema
            'system.manage'           => 'Gerir utilizadores e configuração do sistema',
            'audit.view'              => 'Consultar logs de auditoria',
            // Chefe Repartição
            'institution.manage'      => 'RF-001: CRUD de Instituições Parceiras e Tutores',
            // Coordenador
            'internship.allocate'     => 'RF-002: Alocar estagiários a supervisores',
            'requirement.verify'      => 'RF-004: Verificar pré-requisitos curriculares',
            'credential.generate'     => 'RF-003: Gerar cartas credenciais',
            'gradesheet.manage'       => 'RF-013: Gerar e visualizar pautas',
            'sigeup.export'           => 'RF-014: Exportar notas para SIGEUP',
            'course.view.all'         => 'Ver todos os estágios do curso',
            // Supervisor
            'plan.review'             => 'RF-005/006: Aprovar/rejeitar PDI e plano de actividades',
            'journal.view'            => 'RF-007: Ver diários dos estagiários atribuídos',
            'report.review'           => 'RF-011: Rever relatório e portefólio',
            'evaluation.supervisor'   => 'RF-011: Registar avaliação do supervisor',
            // Estudante
            'plan.submit'             => 'RF-005/006: Submeter PDI e plano de actividades',
            'journal.write'           => 'RF-007: Escrever diários reflexivos',
            'project.submit'          => 'RF-008: Submeter projectos',
            'portfolio.submit'        => 'RF-010: Submeter portefólio final',
            'credential.view.own'     => 'Ver as suas próprias cartas credenciais',
            // Tutor
            'evaluation.tutor'        => 'RF-009: Submeter ficha de avaliação (10 critérios)',
            'activityplan.view'       => 'RF-019: Ver plano de actividades do estagiário',
        ];

        foreach ($perms as $name => $desc) {
            Permission::firstOrCreate(['name' => $name], ['name' => $name, 'description' => $desc]);
        }
    }

    // ─────────────────────────────────────────────────────────
    private function seedRolePermissions(): void
    {
        $map = [
            'admin'       => ['system.manage', 'audit.view'],
            'dept_head'   => ['institution.manage', 'audit.view'],
            'coordinator' => [
                'internship.allocate','requirement.verify','credential.generate',
                'gradesheet.manage','sigeup.export','course.view.all','audit.view',
            ],
            'supervisor'  => [
                'plan.review','journal.view','report.review',
                'evaluation.supervisor','course.view.all',
            ],
            'student'     => [
                'plan.submit','journal.write','project.submit',
                'portfolio.submit','credential.view.own',
            ],
            'tutor'       => ['evaluation.tutor','activityplan.view'],
        ];

        foreach ($map as $roleName => $permNames) {
            $role    = Role::where('name', $roleName)->first();
            $permIds = Permission::whereIn('name', $permNames)->pluck('id');
            $role->permissions()->syncWithoutDetaching($permIds);
        }
    }

    // ─────────────────────────────────────────────────────────
    private function seedAcademic(): void
    {
        $faculty = Faculty::firstOrCreate(
            ['code' => 'FETP'],
            ['name' => 'Faculdade de Engenharia e Tecnologia de Produção']
        );

        $dept = Department::firstOrCreate(
            ['code' => 'DINFO'],
            ['name' => 'Departamento de Informática', 'faculty_id' => $faculty->id]
        );

        // Curso de 4 anos — requisito: concluir 3º ano
        Course::firstOrCreate(
            ['code' => 'LINF'],
            [
                'name'                    => 'Licenciatura em Informática',
                'department_id'           => $dept->id,
                'duration_years'          => 4,
                'weight_contact_hours'    => 65.00,
                'weight_independent_study'=> 35.00,
            ]
        );

        // Curso de 5 anos — requisito: concluir 4º ano
        Course::firstOrCreate(
            ['code' => 'MENG'],
            [
                'name'                    => 'Mestrado Integrado em Engenharia Informática',
                'department_id'           => $dept->id,
                'duration_years'          => 5,
                'weight_contact_hours'    => 70.00,
                'weight_independent_study'=> 30.00,
            ]
        );
    }

    // ─────────────────────────────────────────────────────────
    private function seedUsers(): void
    {
        $dept   = Department::where('code', 'DINFO')->first();
        $linf   = Course::where('code', 'LINF')->first();

        // Admin
        $admin = $this->makeUser('Administrador Sistema', 'admin@up.ac.mz', 'admin');
        Admin::firstOrCreate(['user_id' => $admin->id], ['is_root' => true]);

        // Chefe de Repartição
        $head = $this->makeUser('António Maputo', 'chefe@up.ac.mz', 'dept_head');
        DepartmentHead::firstOrCreate(['user_id' => $head->id], ['department_id' => $dept->id]);

        // Coordenador
        $coord = $this->makeUser('Maria Nhampule', 'coord@up.ac.mz', 'coordinator');
        Coordinator::firstOrCreate(['user_id' => $coord->id], ['course_id' => $linf->id]);

        // Supervisor 1
        $sup1 = $this->makeUser('Prof. Carlos Sitoe', 'sup1@up.ac.mz', 'supervisor');
        SupervisorProfile::firstOrCreate(
            ['user_id' => $sup1->id],
            ['department_id' => $dept->id, 'academic_rank' => 'Professor Assistente']
        );

        // Supervisor 2
        $sup2 = $this->makeUser('Prof.ª Fátima Chissano', 'sup2@up.ac.mz', 'supervisor');
        SupervisorProfile::firstOrCreate(
            ['user_id' => $sup2->id],
            ['department_id' => $dept->id, 'academic_rank' => 'Professora Associada']
        );

        // Estudante 1 — ano 4, cumpre pré-requisitos (curso 4 anos)
        $est1 = $this->makeUser('João Macuácua', 'est1@up.ac.mz', 'student');
        StudentProfile::firstOrCreate(
            ['student_number' => '2021001'],
            ['user_id' => $est1->id, 'course_id' => $linf->id, 'current_year' => 4]
        );

        // Estudante 2 — ano 4, cumpre pré-requisitos
        $est2 = $this->makeUser('Ana Bila', 'est2@up.ac.mz', 'student');
        StudentProfile::firstOrCreate(
            ['student_number' => '2021002'],
            ['user_id' => $est2->id, 'course_id' => $linf->id, 'current_year' => 4]
        );

        // Estudante 3 — ano 2, NÃO cumpre (bloqueado RF-004)
        $est3 = $this->makeUser('Pedro Zimba', 'est3@up.ac.mz', 'student');
        StudentProfile::firstOrCreate(
            ['student_number' => '2022003'],
            ['user_id' => $est3->id, 'course_id' => $linf->id, 'current_year' => 2]
        );
    }

    // ─────────────────────────────────────────────────────────
    private function seedInstitutions(): void
    {
        // 1 – Vodacom (aprovada)
        $vodacom = PartnerInstitution::firstOrCreate(
            ['name' => 'Vodacom Moçambique'],
            [
                'address'             => 'Av. 25 de Setembro, 1230, Maputo',
                'phone'               => '+258 21 350 000',
                'email'               => 'rh@vodacom.co.mz',
                'nuit'                => '400123456',
                'ponto_focal_nome'     => 'Dra. Márcia Guambe',
                'ponto_focal_contacto' => 'marcia.guambe@vodacom.co.mz',
                'status'              => 'aprovada',
            ]
        );

        // Ponto focal (tutor)
        $pf1 = $this->makeTutorUser('Dra. Márcia Guambe', 'marcia.guambe@vodacom.co.mz');
        Tutor::firstOrCreate(
            ['email' => 'marcia.guambe@vodacom.co.mz'],
            [
                'user_id'        => $pf1->id,
                'institution_id' => $vodacom->id,
                'name'           => 'Dra. Márcia Guambe',
                'position'       => 'Ponto Focal',
            ]
        );

        // Tutor adicional
        $tutor1 = $this->makeTutorUser('Eng. Rui Mondlane', 'tutor@vodacom.co.mz');
        Tutor::firstOrCreate(
            ['email' => 'tutor@vodacom.co.mz'],
            [
                'user_id'        => $tutor1->id,
                'institution_id' => $vodacom->id,
                'name'           => 'Eng. Rui Mondlane',
                'phone'          => '+258 84 111 2222',
                'position'       => 'Gestor de Tecnologias de Informação',
            ]
        );

        // 2 – EMOSE (pendente)
        $emose = PartnerInstitution::firstOrCreate(
            ['name' => 'EMOSE – Empresa Moçambicana de Seguros'],
            [
                'address'             => 'Rua da Sé, 100, Maputo',
                'phone'               => '+258 21 300 400',
                'email'               => 'contacto@emose.co.mz',
                'nuit'                => '400654321',
                'ponto_focal_nome'     => 'Dr. Carlos Nhantumbo',
                'ponto_focal_contacto' => 'carlos.nhantumbo@emose.co.mz',
                'status'              => 'pendente',
            ]
        );

        $pf2 = $this->makeTutorUser('Dr. Carlos Nhantumbo', 'carlos.nhantumbo@emose.co.mz');
        Tutor::firstOrCreate(
            ['email' => 'carlos.nhantumbo@emose.co.mz'],
            [
                'user_id'        => $pf2->id,
                'institution_id' => $emose->id,
                'name'           => 'Dr. Carlos Nhantumbo',
                'position'       => 'Ponto Focal',
            ]
        );

        $tutor2 = $this->makeTutorUser('Dra. Isabel Tivane', 'isabel.tivane@emose.co.mz');
        Tutor::firstOrCreate(
            ['email' => 'isabel.tivane@emose.co.mz'],
            [
                'user_id'        => $tutor2->id,
                'institution_id' => $emose->id,
                'name'           => 'Dra. Isabel Tivane',
                'phone'          => '+258 84 567 8901',
                'position'       => 'Directora de RH',
            ]
        );

        // 3 – MCel (rejeitada)
        PartnerInstitution::firstOrCreate(
            ['name' => 'MCel Moçambique'],
            [
                'address'             => 'Av. da Marginal, 45, Maputo',
                'phone'               => '+258 21 450 450',
                'email'               => 'parcerias@mcel.co.mz',
                'nuit'                => '400789012',
                'ponto_focal_nome'     => 'Eng. Sérgio Matola',
                'ponto_focal_contacto' => 'sergio.matola@mcel.co.mz',
                'status'              => 'rejeitada',
            ]
        );

        $pf3 = $this->makeTutorUser('Eng. Sérgio Matola', 'sergio.matola@mcel.co.mz');
        Tutor::firstOrCreate(
            ['email' => 'sergio.matola@mcel.co.mz'],
            [
                'user_id'        => $pf3->id,
                'institution_id' => PartnerInstitution::where('name', 'MCel Moçambique')->first()->id,
                'name'           => 'Eng. Sérgio Matola',
                'position'       => 'Ponto Focal',
            ]
        );

        // 4 – TVM (suspensa)
        $tvm = PartnerInstitution::firstOrCreate(
            ['name' => 'Televisão de Moçambique'],
            [
                'address'             => 'Rua da Rádio, 1000, Maputo',
                'phone'               => '+258 21 430 700',
                'email'               => 'tvm@tvm.co.mz',
                'nuit'                => '400345678',
                'ponto_focal_nome'     => 'Jornalista Ana Cumbe',
                'ponto_focal_contacto' => 'ana.cumbe@tvm.co.mz',
                'status'              => 'suspensa',
            ]
        );

        $pf4 = $this->makeTutorUser('Jornalista Ana Cumbe', 'ana.cumbe@tvm.co.mz');
        Tutor::firstOrCreate(
            ['email' => 'ana.cumbe@tvm.co.mz'],
            [
                'user_id'        => $pf4->id,
                'institution_id' => $tvm->id,
                'name'           => 'Jornalista Ana Cumbe',
                'position'       => 'Ponto Focal',
            ]
        );
    }

    // ─────────────────────────────────────────────────────────
    private function seedPeriods(): void
    {
        InternshipPeriod::firstOrCreate(
            ['academic_year' => '2024/2025'],
            [
                'name'       => 'Estágio Profissionalizante 2024/2025',
                'start_date' => '2025-02-01',
                'end_date'   => '2025-07-31',
            ]
        );
    }

    // ─────────────────────────────────────────────────────────
    private function seedInternships(): void
    {
        $period  = InternshipPeriod::where('academic_year', '2024/2025')->first();
        $sup1    = SupervisorProfile::whereHas('user', fn($q) => $q->where('email', 'sup1@up.ac.mz'))->first();
        $tutor   = Tutor::where('email', 'tutor@vodacom.co.mz')->first();
        $inst    = PartnerInstitution::where('name', 'Vodacom Moçambique')->first();
        $coord   = User::where('email', 'coord@up.ac.mz')->first();

        $est1 = StudentProfile::where('student_number', '2021001')->first();
        $est2 = StudentProfile::where('student_number', '2021002')->first();

        // Estágio 1 — em progresso, com tutor e instituição
        $int1 = Internship::firstOrCreate(
            ['student_id' => $est1->id, 'period_id' => $period->id],
            [
                'supervisor_id'  => $sup1->id,
                'tutor_id'       => $tutor->id,
                'institution_id' => $inst->id,
                'status'         => 'in_progress',
            ]
        );
        InternshipRequirement::firstOrCreate(
            ['internship_id' => $int1->id],
            [
                'requirements_met' => true,
                'observations'     => 'Todas as disciplinas até ao 3.º ano concluídas.',
                'verified_by'      => $coord->id,
                'verified_at'      => now(),
            ]
        );

        // Estágio 2 — só alocado, sem tutor ainda
        $int2 = Internship::firstOrCreate(
            ['student_id' => $est2->id, 'period_id' => $period->id],
            [
                'supervisor_id'  => $sup1->id,
                'tutor_id'       => null,
                'institution_id' => null,
                'status'         => 'allocated',
            ]
        );
        InternshipRequirement::firstOrCreate(
            ['internship_id' => $int2->id],
            ['requirements_met' => true, 'verified_by' => $coord->id, 'verified_at' => now()]
        );

        // Notificações de boas-vindas
        Notification::create([
            'user_id' => $est1->user->id,
            'title'   => 'Estágio alocado com sucesso',
            'message' => "Foi alocado ao supervisor {$sup1->user->name} e à instituição {$inst->name}.",
        ]);
        Notification::create([
            'user_id' => $est2->user->id,
            'title'   => 'Estágio alocado',
            'message' => "Foi alocado ao supervisor {$sup1->user->name}. Aguarda atribuição de tutor e instituição.",
        ]);
    }

    // ─────────────────────────────────────────────────────────
    private function seedSampleArtifacts(): void
    {
        $est1    = StudentProfile::where('student_number', '2021001')->first();
        $period  = InternshipPeriod::where('academic_year', '2024/2025')->first();
        $int1    = Internship::where('student_id', $est1->id)->where('period_id', $period->id)->first();

        if (!$int1) return;

        // PDI submetido e aprovado
        DevelopmentPlan::firstOrCreate(
            ['internship_id' => $int1->id, 'title' => 'PDI 2024 — João Macuácua'],
            [
                'file_path'          => 'uploads/pdi_joao_2024.pdf',
                'status'             => 'approved',
                'supervisor_comment' => 'Plano bem estruturado. Aprovado.',
                'submitted_at'       => now()->subDays(20),
                'reviewed_at'        => now()->subDays(18),
            ]
        );

        // Plano de actividades aprovado
        ActivityPlan::firstOrCreate(
            ['internship_id' => $int1->id],
            [
                'file_path'          => 'uploads/plano_actividades_joao_2024.pdf',
                'status'             => 'approved',
                'supervisor_comment' => 'Aprovado conforme orientações.',
                'submitted_at'       => now()->subDays(15),
                'reviewed_at'        => now()->subDays(13),
            ]
        );

        // Diários reflexivos
        $entries = [
            ['title' => 'Semana 1 — Integração', 'content' => 'Primeira semana na Vodacom. Conheci a equipa de TI e fui apresentado às ferramentas internas. Sentimento de entusiasmo e alguma ansiedade.'],
            ['title' => 'Semana 2 — Primeiro projecto', 'content' => 'Comecei a trabalhar num dashboard de monitorização de rede. Aprendi muito sobre protocolos de comunicação internos.'],
            ['title' => 'Semana 3 — Desafios técnicos', 'content' => 'Encontrei dificuldades na integração com a API legada. Resolvi com apoio do tutor. Experiência muito formativa.'],
        ];

        foreach ($entries as $entry) {
            ReflectiveJournal::firstOrCreate(
                ['internship_id' => $int1->id, 'title' => $entry['title']],
                array_merge($entry, ['created_at' => now()])
            );
        }

        // Avaliação do tutor (RF-009) — 10 critérios
        $tutorEval = TutorEvaluation::firstOrCreate(
            ['internship_id' => $int1->id],
            [
                'tutor_id'     => $int1->tutor_id,
                'score'        => 15.80,
                'observations' => 'Estudante empenhado, proactivo e com boa capacidade de aprendizagem.',
                'submitted_at' => now()->subDays(2),
            ]
        );

        $criteria = [
            ['criteria' => 'Conhecimentos Práticos',       'score' => 16],
            ['criteria' => 'Assiduidade',                  'score' => 18],
            ['criteria' => 'Pontualidade',                 'score' => 17],
            ['criteria' => 'Responsabilidade',             'score' => 16],
            ['criteria' => 'Iniciativa',                   'score' => 15],
            ['criteria' => 'Relacionamento Interpessoal',  'score' => 16],
            ['criteria' => 'Capacidade de Aprendizagem',   'score' => 17],
            ['criteria' => 'Qualidade do Trabalho',        'score' => 14],
            ['criteria' => 'Criatividade',                 'score' => 14],
            ['criteria' => 'Apresentação Pessoal',         'score' => 16],
        ];

        foreach ($criteria as $c) {
            TutorEvaluationItem::firstOrCreate(
                ['evaluation_id' => $tutorEval->id, 'criteria' => $c['criteria']],
                $c
            );
        }

        // Notificação ao supervisor
        $sup = $int1->supervisor->user;
        Notification::create([
            'user_id' => $sup->id,
            'title'   => 'Avaliação do Tutor submetida',
            'message' => "O tutor submeteu a avaliação de {$est1->user->name}. Nota: 15.80.",
        ]);
    }

    // ─────────────────────────────────────────────────────────
    private function makeUser(string $name, string $email, string $roleName): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make('password'), 'status' => 'active']
        );

        $role = Role::where('name', $roleName)->first();
        $user->roles()->syncWithoutDetaching([$role->id]);

        return $user;
    }

    // ── Método auxiliar para criar um utilizador com role 'tutor' ─
    private function makeTutorUser(string $name, string $email): User
    {
        return $this->makeUser($name, $email, 'tutor');
    }
}