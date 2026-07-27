<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disaster_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->enum('hazard_type', ['flood', 'earthquake', 'fire', 'landslide', 'storm_surge', 'tsunami', 'medical', 'other']);
            $table->enum('severity', ['low', 'moderate', 'high', 'critical'])->default('moderate');
            $table->enum('status', ['open', 'monitoring', 'dispatching', 'resolved'])->default('open');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('radius_meters')->default(1000);
            $table->string('color', 7)->default('#dc2626');
            $table->string('location_name')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disaster_incidents');
    }
};
