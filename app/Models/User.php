<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Menentukan kolom yang dapat diisi secara massal
    protected $fillable = [
        'nip',
        'name',
        'email',
        'jabatan',
        'password',
        'role_id',
        'bidang_id',
    ];

    // Kolom yang akan disembunyikan saat dikonversi ke array/JSON
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Tipe data kolom
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Mendefinisikan relasi 'belongs to' dengan model Role.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Mendefinisikan relasi 'belongs to' dengan model Bidang.
     */
    public function bidang(): BelongsTo
    {
        return $this->belongsTo(Bidang::class);
    }

    /**
     * Mendefinisikan relasi 'has many' dengan model Document.
     * Pengguna bisa membuat banyak dokumen.
     */
    public function createdDocuments(): HasMany
    {
        return $this->hasMany(Document::class, 'created_by');
    }

    /**
     * Mendefinisikan relasi 'has many' dengan model DocumentFile.
     * Pengguna bisa mengunggah banyak file dokumen.
     */
    public function uploadedFiles(): HasMany
    {
        return $this->hasMany(DocumentFile::class, 'uploaded_by');
    }

    /**
     * Mendefinisikan relasi 'has many' dengan model DownloadsLog.
     * Pengguna bisa memiliki banyak log unduhan.
     */
    public function downloadsLog(): HasMany
    {
        return $this->hasMany(DownloadsLog::class);
    }

    /**
     * Mendefinisikan relasi 'has many' dengan model ActivityLog.
     * Pengguna bisa memiliki banyak log aktivitas.
     */
    public function activityLog(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
