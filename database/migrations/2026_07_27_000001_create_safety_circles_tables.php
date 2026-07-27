<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('safety_circles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('location_name', 100);
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamps();

            $table->index(['owner_id', 'created_at']);
        });

        Schema::create('safety_circle_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('safety_circle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('relationship', 50)->default('Member');
            $table->enum('safety_status', ['no_response', 'safe', 'help', 'rescue'])->default('safe');
            $table->enum('response_status', ['forwarded_to_lgu', 'responders_dispatched'])->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamps();

            $table->unique(['safety_circle_id', 'user_id']);
            $table->index(['safety_circle_id', 'safety_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('safety_circle_members');
        Schema::dropIfExists('safety_circles');
    }
};
