<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('residences', function (Blueprint $table) {
            $table->boolean('has_health_problem')->default(false)->after('structure_type');
            $table->string('health_problem_details')->nullable()->after('has_health_problem');

            $table->index('has_health_problem');
        });
    }

    public function down(): void
    {
        Schema::table('residences', function (Blueprint $table) {
            $table->dropIndex(['has_health_problem']);
            $table->dropColumn(['has_health_problem', 'health_problem_details']);
        });
    }
};
