<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Category extends Model
{
    use HasFactory;

    // Menentukan kolom yang dapat diisi secara massal
    protected $fillable = ['nama', 'deskripsi'];

    /**
     * Mendefinisikan relasi 'belongs to many' dengan model Document.
     * Sebuah Category bisa memiliki banyak Document, dan sebaliknya.
     */
    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class, 'document_categories');
    }
}
