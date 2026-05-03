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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
                        $table->string('name');
            $table->text('description')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->string('location')->nullable();
            $table->string('map_image_url')->nullable();
            $table->json('settings')->nullable();
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
        Schema::dropIfExists('events');
    }
};
