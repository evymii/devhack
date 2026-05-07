<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'national_id')) {
                $table->string('national_id', 30)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'face_id')) {
                $table->string('face_id', 80)->nullable()->after('biometric_data');
            }
            if (!Schema::hasColumn('users', 'biometric_snapshot')) {
                $table->longText('biometric_snapshot')->nullable()->after('face_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['national_id', 'face_id', 'biometric_snapshot'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
