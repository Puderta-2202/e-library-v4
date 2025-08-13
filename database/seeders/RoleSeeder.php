<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Masukkan data awal untuk peran (roles)
        DB::table('roles')->insert([
            ['name' => 'Admin', 'description' => 'Administrator sistem'],
            ['name' => 'Pegawai', 'description' => 'Pegawai Dinas LH'],
        ]);
    }
}
