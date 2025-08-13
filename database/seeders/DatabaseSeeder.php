<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Panggil seeder yang telah dibuat
        $this->call([
            RoleSeeder::class,
            BidangSeeder::class,
            CategorySeeder::class,
            UserSeeder::class,
        ]);
    }
}
