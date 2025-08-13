<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BidangSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Masukkan data awal untuk bidang/departemen
        DB::table('bidang')->insert([
            ['kode' => 'LH-01', 'nama' => 'Tata Ruang Lingkungan Hidup', 'deskripsi' => 'Bidang yang mengurus tata ruang dan lingkungan.'],
            ['kode' => 'LH-02', 'nama' => 'Pencemaran Lingkungan', 'deskripsi' => 'Bidang yang mengurus pengendalian pencemaran.'],
        ]);
    }
}
