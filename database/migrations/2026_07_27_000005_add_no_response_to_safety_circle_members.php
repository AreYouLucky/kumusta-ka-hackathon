<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement(
            "ALTER TABLE safety_circle_members MODIFY safety_status ENUM('no_response', 'safe', 'help', 'rescue') NOT NULL DEFAULT 'safe'"
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::table('safety_circle_members')
            ->where('safety_status', 'no_response')
            ->update(['safety_status' => 'safe']);

        DB::statement(
            "ALTER TABLE safety_circle_members MODIFY safety_status ENUM('safe', 'help', 'rescue') NOT NULL DEFAULT 'safe'"
        );
    }
};
