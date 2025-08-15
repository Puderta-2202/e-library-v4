<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DocumentApiController;
use App\Http\Controllers\Api\MetaApiController;
use App\Http\Controllers\Api\AnalyticsApiController;
use App\Http\Controllers\Api\UserManagementApiController;
use App\Http\Controllers\Api\BidangApiController;
use App\Http\Controllers\Api\RakApiController;
// use Illuminate\Http\Request;


// profil user (wajib login)
Route::middleware(['auth:sanctum'])->group(function () {
    // Profil
    Route::get('/user', fn(\Illuminate\Http\Request $r) => $r->user()->load('role'));

    // —— Admin-only —— 
    Route::middleware('can:isAdmin')->group(function () {
        // Users
        Route::apiResource('admin/users', UserManagementApiController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Bidang
        Route::apiResource('admin/bidang', BidangApiController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Rak (locations)
        Route::apiResource('admin/raks', RakApiController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Dokumen (CRUD admin)
        Route::get('admin/documents', [DocumentApiController::class, 'index']);
        Route::post('admin/documents', [DocumentApiController::class, 'store']);
        Route::put('admin/documents/{id}', [DocumentApiController::class, 'update']);
        Route::delete('admin/documents/{id}', [DocumentApiController::class, 'destroy']);
        Route::get('/admin/locations',        [RakApiController::class, 'index']);
        Route::post('/admin/locations',       [RakApiController::class, 'store']);
        Route::put('/admin/locations/{id}',   [RakApiController::class, 'update']);
        Route::delete('/admin/locations/{id}', [RakApiController::class, 'destroy']);
    });

    // 🔹 ADD: Read-only untuk pegawai (wajib login, tapi tidak perlu admin)
    Route::get('/raks', [RakApiController::class, 'index']); // ?bidang_id=ID
    // Dua opsi akses dokumen berdasarkan rak:
    Route::get('/raks/{id}/documents', function ($id, \Illuminate\Http\Request $r) {
        // forward ke index DocumentApiController dengan query rak_id
        $r->merge(['rak_id' => (int)$id]);
        return app(DocumentApiController::class)->index($r);
    });
    Route::get('/bidang/{id}/raks', function ($id, \Illuminate\Http\Request $r) {
        $r->merge(['bidang_id' => (int)$id]);
        return app(RakApiController::class)->index($r);
    });
    Route::post('/documents', [DocumentApiController::class, 'store']);
    Route::put('/documents/{id}', [DocumentApiController::class, 'update']);
    Route::delete('/documents/{id}', [DocumentApiController::class, 'destroy']);
});

// documents (publik—kalau mau proteksi, pindah ke dalam auth:sanctum di atas)
Route::get('/documents', [DocumentApiController::class, 'index']);
Route::get('/documents/{id}', [DocumentApiController::class, 'show']);
Route::get('/documents/{id}/download', [DocumentApiController::class, 'downloadActive']);

// metadata
Route::get('/meta/locations', [RakApiController::class, 'meta']);
Route::get('/meta/bidang', [MetaApiController::class, 'bidang']);
Route::get('/meta/categories', [MetaApiController::class, 'categories']);
Route::get('/meta/locations', [MetaApiController::class, 'locations']);

// analytics
Route::get('/analytics/overview', [AnalyticsApiController::class, 'overview']);
Route::get('/analytics/bidang-summary', [AnalyticsApiController::class, 'bidangSummary']);
Route::get('/analytics/bidang/{id}/raks', [AnalyticsApiController::class, 'raksByBidang']); // 🔹 ADD (dipakai FE pegawai)
Route::get('/analytics/bidang/{id}/documents-per-month', [AnalyticsApiController::class, 'documentsPerMonth']);
Route::get('/analytics/top-categories', [AnalyticsApiController::class, 'topCategories']);
