<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    // Menentukan kolom yang dapat diisi secara massal
    protected $fillable = ['name', 'description'];

    /**
     * Mendefinisikan relasi 'has many' dengan model User.
     * Sebuah Role bisa memiliki banyak User.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
