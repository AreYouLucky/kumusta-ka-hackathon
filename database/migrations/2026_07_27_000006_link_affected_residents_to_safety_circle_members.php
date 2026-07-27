<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affected_residents', function (Blueprint $table) {
            $table->foreignId('safety_circle_member_id')
                ->nullable()
                ->after('residence_id')
                ->constrained('safety_circle_members')
                ->nullOnDelete();

            $table->unique(
                ['disaster_incident_id', 'safety_circle_member_id'],
                'affected_residents_incident_circle_member_unique'
            );

            $table->date('birthdate')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('affected_residents', function (Blueprint $table) {
            $table->dropUnique('affected_residents_incident_circle_member_unique');
            $table->dropConstrainedForeignId('safety_circle_member_id');
        });
    }
};
