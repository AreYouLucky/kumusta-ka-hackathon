<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('safety_circle_members', function (Blueprint $table) {
            $table->string('last_seen_location_name')->nullable()->after('checked_in_at');
            $table->decimal('last_seen_latitude', 10, 7)->nullable()->after('last_seen_location_name');
            $table->decimal('last_seen_longitude', 10, 7)->nullable()->after('last_seen_latitude');
            $table->timestamp('last_seen_at')->nullable()->after('last_seen_longitude');
        });
    }

    public function down(): void
    {
        Schema::table('safety_circle_members', function (Blueprint $table) {
            $table->dropColumn([
                'last_seen_location_name',
                'last_seen_latitude',
                'last_seen_longitude',
                'last_seen_at',
            ]);
        });
    }
};
