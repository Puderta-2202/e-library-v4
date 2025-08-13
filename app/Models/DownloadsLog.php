<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DownloadsLog extends Model
{
    use HasFactory;

    protected $table = 'downloads_log';

    // Menentukan kolom yang dapat diisi secara massal
    protected $fillable = [
        'user_id',
        'document_file_id',
        'downloaded_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'downloaded_at' => 'datetime',
    ];

    /**
     * Relasi 'belongs to' ke User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi 'belongs to' ke DocumentFile
     */
    public function documentFile(): BelongsTo
    {
        return $this->belongsTo(DocumentFile::class);
    }
}
