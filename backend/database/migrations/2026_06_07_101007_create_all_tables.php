<?php
// database/migrations/2024_01_01_000001_create_all_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── ESTRUTURA ACADÉMICA ───────────────────────────────
        Schema::create('faculties', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedTinyInteger('duration_years'); // 4 ou 5
            // RF-012: pesos por curso
            $table->decimal('weight_contact_hours', 5, 2)->default(65.00);    // 60–75%
            $table->decimal('weight_independent_study', 5, 2)->default(35.00); // 25–40%
            $table->timestamps();
        });

        // ── RBAC ─────────────────────────────────────────────
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // admin|dept_head|coordinator|supervisor|student|tutor
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->unique(['role_id', 'permission_id']);
        });

        // ── UTILIZADORES ─────────────────────────────────────
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->unique(['user_id', 'role_id']);
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // ── PERFIS ───────────────────────────────────────────
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('is_root')->default(false);
            $table->timestamps();
        });

        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->string('student_number')->unique();
            $table->unsignedTinyInteger('current_year');
            $table->timestamps();
        });

        Schema::create('supervisor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->constrained()->restrictOnDelete();
            $table->string('academic_rank')->nullable();
            $table->timestamps();
        });

        Schema::create('coordinators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('department_heads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->constrained()->restrictOnDelete();
            $table->timestamps();
        });

       // ── INSTITUIÇÕES PARCEIRAS & TUTORES ─────────────────
        Schema::create('partner_institutions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('status')->default('pendente');
            $table->string('nuit')->nullable();
            $table->string('ponto_focal_nome')->nullable();
            $table->string('ponto_focal_contacto')->nullable();
            $table->timestamps();
        });

        Schema::create('tutors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // ← novo
            $table->foreignId('institution_id')->constrained('partner_institutions')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 30)->nullable();
            $table->string('position')->nullable();
            $table->string('access_token', 80)->nullable()->unique(); // mantido para links externos, se necessário
            $table->timestamps();
        });

        // ── PERÍODOS ─────────────────────────────────────────
        Schema::create('internship_periods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('academic_year', 9); // ex: 2024/2025
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();
        });

        // ── ESTÁGIO (tabela central) ──────────────────────────
        Schema::create('internships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('student_profiles')->restrictOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('supervisor_profiles')->nullOnDelete();
            $table->foreignId('tutor_id')->nullable()->constrained('tutors')->nullOnDelete();
            $table->foreignId('institution_id')->nullable()->constrained('partner_institutions')->nullOnDelete();
            $table->foreignId('period_id')->constrained('internship_periods')->restrictOnDelete();
            $table->enum('status', ['allocated','in_progress','submitted','evaluated','completed'])
                  ->default('allocated');
            $table->timestamps();

            $table->unique(['student_id', 'period_id']); // 1 estágio por período
        });

        // ── PRÉ-REQUISITOS (RF-004) ───────────────────────────
        Schema::create('internship_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('requirements_met')->default(false);
            $table->text('observations')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
        });

        // ── CARTAS CREDENCIAIS (RF-003) ───────────────────────
        Schema::create('credential_letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->constrained()->cascadeOnDelete();
            $table->text('file_path')->nullable();
            $table->foreignId('generated_by')->constrained('users');
            $table->timestamp('generated_at')->useCurrent();
        });

        // ── PDI/PDP (RF-005) ──────────────────────────────────
        Schema::create('development_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('file_path')->nullable();
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
            $table->text('supervisor_comment')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        // ── PLANO DE ACTIVIDADES (RF-006) ─────────────────────
        Schema::create('activity_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->constrained()->cascadeOnDelete();
            $table->text('file_path')->nullable();
            $table->enum('status', ['pending','approved','rejected'])->default('pending');
            $table->text('supervisor_comment')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        // ── DIÁRIOS REFLEXIVOS (RF-007) ───────────────────────
        Schema::create('reflective_journals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            $table->timestamps();
        });

        // ── PROJECTOS (RF-008) ────────────────────────────────
        Schema::create('internship_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('file_path')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        // ── RELATÓRIO FINAL ───────────────────────────────────
        Schema::create('final_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('file_path');
            $table->timestamp('submitted_at')->nullable();
        });

        // ── PORTEFÓLIO (RF-010) ───────────────────────────────
        Schema::create('portfolios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending','submitted','approved'])->default('pending');
            $table->timestamp('submitted_at')->nullable();
        });

        Schema::create('portfolio_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained()->cascadeOnDelete();
            $table->string('document_type'); // development_plan|activity_plan|journal|project|final_report
            $table->text('file_path');
            $table->timestamp('uploaded_at')->useCurrent();
        });

        // ── AVALIAÇÃO DO TUTOR (RF-009) ───────────────────────
        Schema::create('tutor_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('tutor_id')->constrained()->restrictOnDelete();
            $table->decimal('score', 5, 2)->nullable();
            $table->text('observations')->nullable();
            $table->timestamp('submitted_at')->nullable();
        });

        Schema::create('tutor_evaluation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained('tutor_evaluations')->cascadeOnDelete();
            $table->string('criteria');
            $table->decimal('score', 5, 2);
        });

        // ── AVALIAÇÃO DO SUPERVISOR (RF-011) ──────────────────
        Schema::create('supervisor_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable();
            $table->text('observations')->nullable();
            $table->timestamp('submitted_at')->nullable();
        });

        // ── RESULTADOS (RF-012) ───────────────────────────────
        Schema::create('internship_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('tutor_score', 5, 2)->nullable();
            $table->decimal('supervisor_score', 5, 2)->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->boolean('approved')->nullable();
            $table->timestamp('calculated_at')->nullable();
        });

        // ── PAUTAS (RF-013) ───────────────────────────────────
        Schema::create('internship_grade_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->restrictOnDelete();
            $table->foreignId('period_id')->constrained('internship_periods')->restrictOnDelete();
            $table->foreignId('generated_by')->constrained('users');
            $table->timestamp('generated_at')->useCurrent();
        });

        Schema::create('internship_grade_sheet_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_sheet_id')->constrained('internship_grade_sheets')->cascadeOnDelete();
            $table->foreignId('internship_result_id')->constrained('internship_results');
        });

        // ── EXPORTAÇÃO SIGEUP (RF-014) ────────────────────────
        Schema::create('sigeup_exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_sheet_id')->constrained('internship_grade_sheets')->cascadeOnDelete();
            $table->text('file_path')->nullable();
            $table->foreignId('exported_by')->constrained('users');
            $table->timestamp('exported_at')->useCurrent();
        });

        // ── NOTIFICAÇÕES ──────────────────────────────────────
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });

        // ── AUDITORIA ─────────────────────────────────────────
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('description')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        $tables = [
            'audit_logs','notifications','sigeup_exports',
            'internship_grade_sheet_items','internship_grade_sheets',
            'internship_results','supervisor_evaluations',
            'tutor_evaluation_items','tutor_evaluations',
            'portfolio_documents','portfolios','final_reports',
            'internship_projects','reflective_journals',
            'activity_plans','development_plans',
            'credential_letters','internship_requirements',
            'internships','internship_periods',
            'tutors','partner_institutions',
            'department_heads','coordinators',
            'supervisor_profiles','student_profiles','admins',
            'personal_access_tokens','user_roles','users',
            'role_permissions','permissions','roles',
            'courses','departments','faculties',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};