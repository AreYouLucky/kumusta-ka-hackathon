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

        DB::statement("ALTER TABLE disaster_incidents MODIFY hazard_type ENUM('flood', 'earthquake', 'fire', 'landslide', 'storm_surge', 'tsunami', 'medical', 'other') NOT NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE disaster_incidents MODIFY hazard_type ENUM('flood', 'earthquake', 'fire', 'landslide', 'storm_surge', 'medical', 'other') NOT NULL");
    }
};
