<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('residences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('household_number')->nullable();
            $table->string('household_head')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->string('barangay')->nullable();
            $table->string('purok')->nullable();
            $table->string('street')->nullable();
            $table->string('address_line')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedSmallInteger('resident_count')->default(0);
            $table->boolean('has_pwd')->default(false);
            $table->boolean('has_children')->default(false);
            $table->boolean('has_pregnant')->default(false);
            $table->boolean('has_senior')->default(false);
            $table->enum('structure_type', ['concrete', 'semi_concrete', 'light_material', 'temporary', 'other'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['latitude', 'longitude']);
            $table->index(['barangay', 'city']);
            $table->index('household_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('residences');
    }
};
