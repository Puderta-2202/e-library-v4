<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsApiController extends Controller
{
    /**
     * GET /api/analytics/overview
     * Ringkas: total_bidang, total_rak (locations), total_dokumen, total_user (opsional bila ada tabel users).
     */
    public function overview()
    {
        $row = DB::query()->fromSub(function ($q) {
            $q->selectRaw('(SELECT COUNT(*) FROM bidang) AS total_bidang')
                ->selectRaw('(SELECT COUNT(*) FROM locations) AS total_rak')
                ->selectRaw('(SELECT COUNT(*) FROM documents) AS total_dokumen')
                ->selectRaw('(SELECT COUNT(*) FROM users) AS total_user');
        }, 'x')->first();

        return response()->json([
            'total_bidang'  => (int) ($row->total_bidang ?? 0),
            'total_rak'     => (int) ($row->total_rak ?? 0),
            'total_dokumen' => (int) ($row->total_dokumen ?? 0),
            'total_user'    => (int) ($row->total_user ?? 0),
        ]);
    }

    /**
     * GET /api/analytics/bidang-summary
     * List semua bidang beserta total rak (distinct location_id yang terpakai),
     * total dokumen, dan last_updated (MAX dokumen.created_at).
     */
    public function bidangSummary(Request $request)
    {
        $rows = DB::table('bidang as b')
            ->leftJoin('documents as d', 'd.bidang_id', '=', 'b.id')
            ->groupBy('b.id', 'b.nama', 'b.deskripsi')
            ->orderBy('b.nama')
            ->select([
                'b.id',
                'b.nama',
                'b.deskripsi',
                DB::raw('COUNT(d.id) AS total_dokumen'),
                DB::raw('COUNT(DISTINCT d.location_id) AS total_rak'),
                DB::raw('MAX(d.created_at) AS last_updated'),
            ])
            ->get();

        // Normalisasi output
        $data = $rows->map(function ($r) {
            return [
                'id'             => (int) $r->id,
                'nama'           => $r->nama,
                'deskripsi'      => $r->deskripsi,
                'total_rak'      => (int) $r->total_rak,
                'total_dokumen'  => (int) $r->total_dokumen,
                'last_updated'   => $r->last_updated,
            ];
        });

        return response()->json($data);
    }

    /**
     * GET /api/analytics/bidang/{id}/raks
     * Daftar rak (locations) dalam satu bidang + total dokumen per rak + last_updated.
     * Hanya menampilkan rak yang memiliki dokumen pada bidang tsb (lebih relevan untuk UI).
     * Tambahkan ?include_empty=1 untuk menampilkan rak tanpa dokumen.
     */
    public function raksByBidang($bidangId, Request $request)
    {
        $includeEmpty = (bool) $request->boolean('include_empty', false);

        // Basis: semua lokasi
        $base = DB::table('locations as l')
            ->leftJoin('documents as d', function ($j) use ($bidangId) {
                $j->on('d.location_id', '=', 'l.id')
                    ->where('d.bidang_id', '=', $bidangId);
            })
            ->groupBy('l.id', 'l.kode_rak', 'l.nama_rak', 'l.ruang', 'l.deskripsi')
            ->orderBy('l.nama_rak')
            ->select([
                'l.id',
                'l.kode_rak',
                'l.nama_rak',
                'l.ruang',
                'l.deskripsi',
                DB::raw('COUNT(d.id) AS total_dokumen'),
                DB::raw('MAX(d.created_at) AS last_updated'),
            ]);

        if (!$includeEmpty) {
            $base->havingRaw('COUNT(d.id) > 0');
        }

        $rows = $base->get();

        $data = $rows->map(function ($r) {
            return [
                'id'            => (int) $r->id,
                'kode_rak'      => $r->kode_rak,
                'nama_rak'      => $r->nama_rak,
                'ruang'         => $r->ruang,
                'deskripsi'     => $r->deskripsi,
                'total_dokumen' => (int) $r->total_dokumen,
                'last_updated'  => $r->last_updated,
            ];
        });

        return response()->json($data);
    }

    /**
     * GET /api/analytics/bidang/{id}/documents-per-month?year=2025
     * Total dokumen per bulan untuk 1 bidang pada tahun tertentu (default: tahun berjalan).
     */
    public function documentsPerMonth($bidangId, Request $request)
    {
        $year = (int) ($request->get('year') ?: now()->year);

        $rows = DB::table('documents')
            ->where('bidang_id', $bidangId)
            ->whereYear('created_at', $year)
            ->groupBy(DB::raw('MONTH(created_at)'))
            ->selectRaw('MONTH(created_at) AS month, COUNT(*) AS total')
            ->orderBy('month')
            ->get();

        // Pastikan 1-12 terisi
        $map = array_fill(1, 12, 0);
        foreach ($rows as $r) {
            $map[(int) $r->month] = (int) $r->total;
        }

        $data = [];
        foreach ($map as $m => $v) {
            $data[] = ['month' => $m, 'total' => $v];
        }

        return response()->json([
            'year' => $year,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/analytics/top-categories?limit=10
     * Kategori teratas berdasarkan jumlah dokumen (global).
     * Bisa difilter per bidang: ?bidang_id=123
     */
    public function topCategories(Request $request)
    {
        $limit    = (int) max(1, min(50, (int) $request->get('limit', 10)));
        $bidangId = $request->integer('bidang_id');

        $q = DB::table('categories as c')
            ->join('document_categories as dc', 'dc.category_id', '=', 'c.id')
            ->join('documents as d', 'd.id', '=', 'dc.document_id')
            ->when($bidangId, fn($w) => $w->where('d.bidang_id', $bidangId))
            ->groupBy('c.id', 'c.nama')
            ->orderByDesc(DB::raw('COUNT(d.id)'))
            ->select([
                'c.id',
                'c.nama',
                DB::raw('COUNT(d.id) AS total_dokumen'),
                DB::raw('MAX(d.created_at) AS last_used'),
            ])
            ->limit($limit);

        $rows = $q->get();

        $data = $rows->map(function ($r) {
            return [
                'id'            => (int) $r->id,
                'nama'          => $r->nama,
                'total_dokumen' => (int) $r->total_dokumen,
                'last_used'     => $r->last_used,
            ];
        });

        return response()->json($data);
    }
}
