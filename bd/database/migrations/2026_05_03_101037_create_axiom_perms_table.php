<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('axiom_perms', function (Blueprint $table) {
            $table->id();
            $table->string('process_code');
            $table->string('name');
            $table->string('name2')->nullable();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('statusid')->default(1);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('axiom_perms');
    }
};
