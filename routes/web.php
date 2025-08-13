<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Main application route
Route::get('/', function () {
    return view('app');
})->name('home');

// Catch-all route untuk React Router (jika nanti digunakan)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
