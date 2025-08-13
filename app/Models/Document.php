<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Document extends Model
{
    use HasFactory;

    // Menentukan kolom yang dapat diisi secara massal
    protected $fillable = [
        'kode_document',
        'title',
        'description',
        'bidang_id',
        'location_id',
        'created_by',
        'status',
    ];

    /**
     * Relasi 'belongs to' ke Bidang
     */
    public function bidang(): BelongsTo
    {
        return $this->belongsTo(Bidang::class);
    }

    /**
     * Relasi 'belongs to' ke Location
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Relasi 'belongs to' ke User (pembuat dokumen)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relasi 'has many' ke DocumentFile
     */
    public function files(): HasMany
    {
        return $this->hasMany(DocumentFile::class);
    }

    /**
     * Relasi 'belongs to many' ke Category
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'document_categories');
    }

    /**
     * Relasi 'has many' ke ActivityLog
     */
    public function activityLog(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
