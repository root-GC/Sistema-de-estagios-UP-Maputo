<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  // database/migrations/2026_06_09_193907_update_internships_status_check_constraint.php
public function up(): void
{
    DB::statement("ALTER TABLE internships DROP CONSTRAINT IF EXISTS internships_status_check");
    DB::statement("ALTER TABLE internships ADD CONSTRAINT internships_status_check CHECK (status::text = ANY (ARRAY['pendente','aprovada','rejeitada','allocated','in_progress','submitted','evaluated','completed']::text[]))");
}

public function down(): void
{
    DB::statement("ALTER TABLE internships DROP CONSTRAINT IF EXISTS internships_status_check");
    DB::statement("ALTER TABLE internships ADD CONSTRAINT internships_status_check CHECK (status::text = ANY (ARRAY['allocated','in_progress','submitted','evaluated','completed']::text[]))");
}
};
