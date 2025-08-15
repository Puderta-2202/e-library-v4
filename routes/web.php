<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\SpaController;

// SPA (semua non-API render React)
Route::get('/', [SpaController::class, 'index']);
Route::get('/{any}', [SpaController::class, 'index'])->where('any', '^(?!api|storage).*$');

// Session endpoints (Sanctum SPA)
Route::get('/login', fn() => response()->json(['message' => 'Unauthenticated'], 401))
    ->name('login');
Route::post('/login', function (Request $request) {
    $request->validate(['email' => ['required', 'email'], 'password' => ['required']]);

    if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
        return response()->json(['message' => 'Email atau password salah'], 422);
    }

    $request->session()->regenerate();
    return response()->json(['message' => 'OK']);
});

Route::post('/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return response()->json(['message' => 'OK']);
});
