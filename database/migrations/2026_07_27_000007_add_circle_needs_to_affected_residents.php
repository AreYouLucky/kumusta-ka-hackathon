<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affected_residents', function (Blueprint $table) {
            $table->enum('circle_safety_status', ['no_response', 'safe', 'help', 'rescue'])
                ->nullable()
                ->after('resident_status')
                ->index();
            $table->string('assistance_type', 150)->nullable()->after('circle_safety_status');
            $table->text('situation')->nullable()->after('assistance_type');
            $table->string('priority', 200)->nullable()->after('situation');
        });
    }

    public function down(): void
    {
        Schema::table('affected_residents', function (Blueprint $table) {
            $table->dropIndex(['circle_safety_status']);
            $table->dropColumn([
                'circle_safety_status',
                'assistance_type',
                'situation',
                'priority',
            ]);
        });
    }
};
