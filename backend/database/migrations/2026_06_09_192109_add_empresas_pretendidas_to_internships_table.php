<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   // database/migrations/2026_06_09_192109_add_empresas_pretendidas_to_internships_table.php
public function up(): void
{
    Schema::table('internships', function (Blueprint $table) {
        $table->json('empresas_pretendidas')->nullable()->after('status');
    });
}

public function down(): void
{
    Schema::table('internships', function (Blueprint $table) {
        $table->dropColumn('empresas_pretendidas');
    });
}
};