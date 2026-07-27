<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('safety_circle_members', function (Blueprint $table) {
            $table->string('assistance_type', 150)->nullable()->after('response_status');
            $table->text('situation')->nullable()->after('assistance_type');
            $table->string('priority', 200)->nullable()->after('situation');
            $table->foreignId('responder_id')->nullable()->after('priority')->constrained('users')->nullOnDelete();
            $table->enum('responder_status', ['pending', 'accepted', 'resolved'])->nullable()->after('responder_id')->index();
            $table->timestamp('accepted_at')->nullable()->after('responder_status');
            $table->timestamp('resolved_at')->nullable()->after('accepted_at');
        });
    }

    public function down(): void
    {
        Schema::table('safety_circle_members', function (Blueprint $table) {
            $table->dropForeign(['responder_id']);
            $table->dropIndex(['responder_status']);
            $table->dropColumn([
                'assistance_type',
                'situation',
                'priority',
                'responder_id',
                'responder_status',
                'accepted_at',
                'resolved_at',
            ]);
        });
    }
};
