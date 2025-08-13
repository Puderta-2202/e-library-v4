<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory;

    // Menentukan nama tabel yang berbeda dari nama model
    protected $table = 'locations';

    // Menentukan kolom yang dapat diisi secara massal
    protected $fillable = ['kode_rak', 'nama_rak', 'ruang', 'deskripsi'];

    /**
     * Mendefinisikan relasi 'has many' dengan model Document.
     * Sebuah Location (rak) bisa memiliki banyak Document.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
