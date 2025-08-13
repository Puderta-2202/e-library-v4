<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;
use App\Models\Bidang;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil ID dari peran dan bidang yang sudah dibuat
        $adminRole = Role::where('name', 'Admin')->first();
        $pegawaiRole = Role::where('name', 'Pegawai')->first();
        $bidang = Bidang::first();

        // Masukkan data pengguna awal
        DB::table('users')->insert([
            [
                'nip' => '1234567890',
                'name' => 'Admin Utama',
                'email' => 'admin@mail.com',
                'jabatan' => 'Kepala Dinas',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'bidang_id' => $bidang->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nip' => '0987654321',
                'name' => 'Pegawai Contoh',
                'email' => 'pegawai@mail.com',
                'jabatan' => 'Staf',
                'password' => Hash::make('password'),
                'role_id' => $pegawaiRole->id,
                'bidang_id' => $bidang->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
