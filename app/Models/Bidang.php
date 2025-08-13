<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bidang extends Model
{
    use HasFactory;

    // Menentukan nama tabel yang berbeda dari nama model
    protected $table = 'bidang';

    // Menentukan kolom yang dapat diisi secara massal
    protected $fillable = ['kode', 'nama', 'kepala_bidang_id', 'deskripsi'];

    /**
     * Mendefinisikan relasi 'belongs to' dengan model User untuk kepala bidang.
     * Sebuah Bidang memiliki satu kepala bidang.
     */
    public function kepalaBidang(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kepala_bidang_id');
    }

    /**
     * Mendefinisikan relasi 'has many' dengan model User.
     * Sebuah Bidang bisa memiliki banyak User (pegawai).
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Mendefinisikan relasi 'has many' dengan model Document.
     * Sebuah Bidang bisa memiliki banyak Document.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
