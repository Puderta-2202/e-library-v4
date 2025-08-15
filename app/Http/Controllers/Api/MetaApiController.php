<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bidang;
use App\Models\Category;
use App\Models\Location;

class MetaApiController extends Controller
{
    // GET /api/meta/bidang
    public function bidang()
    {
        return response()->json(
            Bidang::query()->select('id', 'nama', 'deskripsi')->orderBy('nama')->get()
        );
    }

    // GET /api/meta/categories
    public function categories()
    {
        return response()->json(
            Category::query()->select('id', 'nama')->orderBy('nama')->get()
        );
    }

    // GET /api/meta/locations  (rak)
    public function locations()
    {
        return response()->json(
            Location::query()->select('id', 'kode_rak', 'nama_rak', 'ruang', 'deskripsi')->orderBy('nama_rak')->get()
        );
    }
}
