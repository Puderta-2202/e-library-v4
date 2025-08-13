<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('kode_document')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('bidang_id');
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('created_by');
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->foreign('bidang_id')->references('id')->on('bidang');
            $table->foreign('location_id')->references('id')->on('locations');
            $table->foreign('created_by')->references('id')->on('users');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
