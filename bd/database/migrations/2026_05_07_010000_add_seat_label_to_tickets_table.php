<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'seat_label')) {
                $table->string('seat_label', 20)->nullable()->after('price_paid');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (Schema::hasColumn('tickets', 'seat_label')) {
                $table->dropColumn('seat_label');
            }
        });
    }
};
