<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Masukkan data awal untuk kategori dokumen
        DB::table('categories')->insert([
            ['nama' => 'Laporan Tahunan', 'deskripsi' => 'Dokumen laporan tahunan dinas.'],
            ['nama' => 'Kebijakan', 'deskripsi' => 'Dokumen terkait kebijakan pemerintah.'],
        ]);
    }
}
