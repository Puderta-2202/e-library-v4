<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bidang;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class BidangApiController extends Controller
{
    public function index()
    {
        return Bidang::latest()->paginate(10);
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'nama'      => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string'],
            // opsional: admin bisa kirim kode; jika tidak dikirim kita buatkan
            'kode'      => ['nullable', 'string', 'max:50', 'unique:bidang,kode'],
        ]);

        if (empty($data['kode'])) {
            $data['kode'] = $this->makeKode($data['nama']);
        }

        $b = Bidang::create($data);
        return response()->json($b, 201);
    }

    public function update(Request $r, $id)
    {
        $b = Bidang::findOrFail($id);
        $data = $r->validate([
            'nama'      => ['sometimes', 'string', 'max:255'],
            'deskripsi' => ['sometimes', 'nullable', 'string'],
            'kode'      => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('bidang', 'kode')->ignore($b->id)],
        ]);

        // jika admin mengosongkan kode, regenerate dari nama (kalau ada)
        if (array_key_exists('kode', $data) && ($data['kode'] === null || $data['kode'] === '')) {
            $nama = $data['nama'] ?? $b->nama;
            $data['kode'] = $this->makeKode($nama);
        }

        $b->update($data);
        return $b;
    }

    private function makeKode(string $nama): string
    {
        // contoh: "Bidang Pengendalian Air" -> "BIDANG_PENGENDALIAN_AIR"
        $base = strtoupper(Str::slug($nama, '_'));
        if ($base === '') $base = 'BIDANG';
        $kode = $base;
        $i = 1;
        while (Bidang::where('kode', $kode)->exists()) {
            $kode = $base . '_' . $i++;
        }
        return $kode;
    }

    public function destroy($id)
    {
        Bidang::findOrFail($id)->delete();
        return response()->noContent();
    }
}