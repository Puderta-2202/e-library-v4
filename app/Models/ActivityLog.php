<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $table = 'activity_log';

    // Menentukan kolom yang dapat diisi secara massal
    protected $fillable = ['user_id', 'action', 'document_id', 'detail'];

    /**
     * Relasi 'belongs to' ke User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi 'belongs to' ke Document
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
