<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affected_residents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('disaster_incident_id')->nullable()->constrained('disaster_incidents')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('household_number')->nullable();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('suffix')->nullable();
            $table->date('birthdate');
            $table->enum('sex', ['female', 'male', 'other']);
            $table->string('contact_number')->nullable();
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->string('barangay')->nullable();
            $table->string('address_line')->nullable();
            $table->string('evacuation_center')->nullable();
            $table->enum('status', ['possibly_affected', 'affected', 'evacuated', 'missing', 'rescued', 'deceased'])->default('possibly_affected');
            $table->boolean('is_pwd')->default(false);
            $table->boolean('is_pregnant')->default(false);
            $table->unsignedTinyInteger('pregnancy_month')->nullable();
            $table->text('medical_notes')->nullable();
            $table->timestamps();
            $table->index(['barangay', 'status']);
            $table->index(['is_pwd', 'is_pregnant']);
            $table->index('birthdate');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affected_residents');
    }
};
