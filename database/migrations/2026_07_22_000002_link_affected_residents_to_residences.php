<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affected_residents', function (Blueprint $table) {
            $table->foreignId('residence_id')
                ->nullable()
                ->after('disaster_incident_id')
                ->constrained('residences')
                ->nullOnDelete();

            $table->unique(['disaster_incident_id', 'residence_id'], 'affected_residents_incident_residence_unique');
        });
    }

    public function down(): void
    {
        Schema::table('affected_residents', function (Blueprint $table) {
            $table->dropUnique('affected_residents_incident_residence_unique');
            $table->dropConstrainedForeignId('residence_id');
        });
    }
};
