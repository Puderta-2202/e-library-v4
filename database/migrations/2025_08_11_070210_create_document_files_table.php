<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->bigInteger('file_size');
            $table->integer('version_number')->default(1);
            $table->unsignedBigInteger('uploaded_by');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('document_id')->references('id')->on('documents');
            $table->foreign('uploaded_by')->references('id')->on('users');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('document_files');
    }
};
