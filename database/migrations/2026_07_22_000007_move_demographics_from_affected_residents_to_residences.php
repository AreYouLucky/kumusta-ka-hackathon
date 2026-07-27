<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('residences', function (Blueprint $table) {
            if (!Schema::hasColumn('residences', 'is_pwd')) {
                $table->boolean('is_pwd')->default(false)->after('sex');
            }

            if (!Schema::hasColumn('residences', 'is_pregnant')) {
                $table->boolean('is_pregnant')->default(false)->after('is_pwd');
            }

            if (!Schema::hasColumn('residences', 'pregnancy_month')) {
                $table->unsignedTinyInteger('pregnancy_month')->nullable()->after('is_pregnant');
            }
        });

        Schema::table('affected_residents', function (Blueprint $table) {
            if (Schema::hasColumn('affected_residents', 'is_pwd') && Schema::hasColumn('affected_residents', 'is_pregnant')) {
                $table->dropIndex(['is_pwd', 'is_pregnant']);
            }

            if (Schema::hasColumn('affected_residents', 'has_health_problem')) {
                $table->dropIndex(['has_health_problem']);
            }
        });

        Schema::table('affected_residents', function (Blueprint $table) {
            $columns = collect([
                'is_pwd',
                'is_pregnant',
                'pregnancy_month',
                'has_health_problem',
                'health_problem_details',
            ])->filter(fn (string $column) => Schema::hasColumn('affected_residents', $column))->all();

            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }

    public function down(): void
    {
        Schema::table('affected_residents', function (Blueprint $table) {
            $table->boolean('is_pwd')->default(false)->after('resident_status');
            $table->boolean('is_pregnant')->default(false)->after('is_pwd');
            $table->unsignedTinyInteger('pregnancy_month')->nullable()->after('is_pregnant');
            $table->boolean('has_health_problem')->default(false)->after('pregnancy_month');
            $table->string('health_problem_details')->nullable()->after('has_health_problem');

            $table->index(['is_pwd', 'is_pregnant']);
            $table->index('has_health_problem');
        });

        Schema::table('residences', function (Blueprint $table) {
            $table->dropColumn(['is_pwd', 'is_pregnant', 'pregnancy_month']);
        });
    }
};
