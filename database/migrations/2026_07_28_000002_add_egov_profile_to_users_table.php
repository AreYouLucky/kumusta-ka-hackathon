<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('egov_subject')->nullable()->unique()->after('id');
            $table->json('egov_profile')->nullable()->after('last_login');
            $table->timestamp('egov_profile_synced_at')->nullable()->after('egov_profile');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['egov_subject']);
            $table->dropColumn([
                'egov_subject',
                'egov_profile',
                'egov_profile_synced_at',
            ]);
        });
    }
};
