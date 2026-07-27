<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE affected_residents MODIFY status ENUM('possibly_affected', 'affected', 'evacuated', 'missing', 'rescued', 'deceased') NOT NULL DEFAULT 'possibly_affected'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE affected_residents MODIFY status ENUM('affected', 'evacuated', 'missing', 'rescued', 'deceased') NOT NULL DEFAULT 'affected'");
    }
};
