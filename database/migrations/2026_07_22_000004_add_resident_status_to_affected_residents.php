<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('affected_residents', 'resident_status')) {
            Schema::table('affected_residents', function (Blueprint $table) {
                $table->unsignedTinyInteger('resident_status')
                    ->default(0)
                    ->after('status')
                    ->comment('0=no response, 1=marked safe, 2=needs help, 3=urgently needs help');
            });
        }

        Schema::table('affected_residents', function (Blueprint $table) {
            $table->index('resident_status');
        });
    }

    public function down(): void
    {
        Schema::table('affected_residents', function (Blueprint $table) {
            $table->dropIndex(['resident_status']);
            $table->dropColumn('resident_status');
        });
    }
};
