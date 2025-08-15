<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RakApiController extends Controller
{
    /**
     * LIST (read-only, untuk pegawai) — dipakai oleh:
     * GET /api/raks
     * GET /api/bidang/{id}/raks  (route merge 'bidang_id' pada Request)
     */
    public function index(Request $request)
    {
        $q = DB::table('locations as l')
            ->select('l.id', 'l.kode_rak', 'l.nama_rak', 'l.bidang_id');

        // kalau kolom bidang_id ada, join untuk ambil nama bidang
        if (Schema::hasColumn('locations', 'bidang_id')) {
            $q->leftJoin('bidang as b', 'b.id', '=', 'l.bidang_id')
                ->addSelect(DB::raw('b.nama as bidang_nama'));
        }

        // filter opsional: ?bidang_id=... (atau hasil merge dari route /bidang/{id}/raks)
        if ($request->filled('bidang_id') && Schema::hasColumn('locations', 'bidang_id')) {
            $q->where('l.bidang_id', (int) $request->integer('bidang_id'));
        }

        // pencarian opsional: ?q=...
        if ($request->filled('q')) {
            $q->where(function ($w) use ($request) {
                $qv = '%' . trim($request->input('q')) . '%';
                $w->where('l.nama_rak', 'like', $qv)
                    ->orWhere('l.kode_rak', 'like', $qv);
            });
        }

        return $q->orderBy('l.nama_rak')->get();
    }

    /**
     * LIST (admin) — dipakai oleh /api/admin/locations
     */
    public function adminIndex(Request $request)
    {
        $q = DB::table('locations as l')
            ->select('l.id', 'l.kode_rak', 'l.nama_rak', 'l.bidang_id');

        if (Schema::hasColumn('locations', 'bidang_id')) {
            $q->leftJoin('bidang as b', 'b.id', '=', 'l.bidang_id')
                ->addSelect(DB::raw('b.nama as bidang_nama'));
        }

        return $q->orderByDesc('l.id')->get();
    }

    /**
     * CREATE (admin)
     */
    public function store(Request $r)
    {
        $data = $r->validate([
            'nama_rak'  => ['required', 'string', 'max:100'],
            'kode_rak'  => ['sometimes', 'nullable', 'string', 'max:50'],
            'bidang_id' => ['sometimes', 'nullable', 'integer', 'exists:bidang,id'],
        ]);

        $ins = [
            'nama_rak' => $data['nama_rak'],
            'kode_rak' => $data['kode_rak'] ?? null,
        ];
        if (Schema::hasColumn('locations', 'bidang_id')) {
            $ins['bidang_id'] = $data['bidang_id'] ?? null;
        }

        $id = DB::table('locations')->insertGetId($ins);
        return $this->showRow($id);
    }

    /**
     * UPDATE (admin)
     */
    public function update(Request $r, $id)
    {
        $data = $r->validate([
            'nama_rak'  => ['sometimes', 'string', 'max:100'],
            'kode_rak'  => ['sometimes', 'nullable', 'string', 'max:50'],
            'bidang_id' => ['sometimes', 'nullable', 'integer', 'exists:bidang,id'],
        ]);

        $upd = [];
        if ($r->has('nama_rak')) $upd['nama_rak'] = $data['nama_rak'];
        if ($r->has('kode_rak')) $upd['kode_rak'] = $data['kode_rak'] ?? null;
        if ($r->has('bidang_id') && Schema::hasColumn('locations', 'bidang_id')) {
            $upd['bidang_id'] = $data['bidang_id']; // boleh null untuk “lepas” relasi
        }

        DB::table('locations')->where('id', $id)->update($upd);
        return $this->showRow($id);
    }

    /**
     * DELETE (admin)
     */
    public function destroy($id)
    {
        DB::table('locations')->where('id', $id)->delete();
        return response()->noContent();
    }

    // helper untuk kembalikan satu baris plus bidang_nama (kalau ada)
    private function showRow($id)
    {
        $q = DB::table('locations as l')
            ->where('l.id', $id)
            ->select('l.id', 'l.kode_rak', 'l.nama_rak', 'l.bidang_id');

        if (Schema::hasColumn('locations', 'bidang_id')) {
            $q->leftJoin('bidang as b', 'b.id', '=', 'l.bidang_id')
                ->addSelect(DB::raw('b.nama as bidang_nama'));
        }

        return $q->first();
    }
}
