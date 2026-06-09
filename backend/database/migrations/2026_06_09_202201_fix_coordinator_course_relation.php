<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   // database/migrations/xxxx_xx_xx_fix_coordinator_course_relation.php
// database/migrations/2026_06_09_202201_fix_coordinator_course_relation.php
public function up(): void
{
    Schema::table('courses', function (Blueprint $table) {
        $table->foreignId('coordinator_id')->nullable()->after('department_id')
              ->constrained('coordinators')->nullOnDelete();
    });

    // Remove course_id da tabela coordinators (se existir)
    if (Schema::hasColumn('coordinators', 'course_id')) {
        Schema::table('coordinators', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });
    }
}

public function down(): void
{
    Schema::table('courses', function (Blueprint $table) {
        $table->dropForeign(['coordinator_id']);
        $table->dropColumn('coordinator_id');
    });

    Schema::table('coordinators', function (Blueprint $table) {
        $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
    });
}
};
