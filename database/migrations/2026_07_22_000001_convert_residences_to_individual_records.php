<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('residences', function (Blueprint $table) {
            $table->string('resident_code')->nullable()->unique()->after('created_by');
            $table->string('first_name')->nullable()->after('resident_code');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');
            $table->string('suffix')->nullable()->after('last_name');
            $table->date('birthdate')->nullable()->after('suffix');
            $table->enum('sex', ['female', 'male', 'other'])->nullable()->after('birthdate');

            $table->dropColumn([
                'household_head',
                'resident_count',
                'has_pwd',
                'has_children',
                'has_pregnant',
                'has_senior',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('residences', function (Blueprint $table) {
            $table->string('household_head')->nullable()->after('household_number');
            $table->unsignedSmallInteger('resident_count')->default(0)->after('longitude');
            $table->boolean('has_pwd')->default(false)->after('resident_count');
            $table->boolean('has_children')->default(false)->after('has_pwd');
            $table->boolean('has_pregnant')->default(false)->after('has_children');
            $table->boolean('has_senior')->default(false)->after('has_pregnant');

            $table->dropColumn([
                'resident_code',
                'first_name',
                'middle_name',
                'last_name',
                'suffix',
                'birthdate',
                'sex',
            ]);
        });
    }
};
