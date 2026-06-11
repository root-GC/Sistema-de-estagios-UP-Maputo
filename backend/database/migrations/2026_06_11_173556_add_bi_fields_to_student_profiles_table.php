<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('student_profiles', function (Blueprint $table) {
        $table->string('bi_numero')->nullable()->after('current_year');
        $table->date('bi_data_emissao')->nullable()->after('bi_numero');
        $table->string('pai_nome')->nullable()->after('bi_data_emissao');
        $table->string('mae_nome')->nullable()->after('pai_nome');
    });
}

public function down(): void
{
    Schema::table('student_profiles', function (Blueprint $table) {
        $table->dropColumn(['bi_numero', 'bi_data_emissao', 'pai_nome', 'mae_nome']);
    });
}
};
