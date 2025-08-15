<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\Document;

class DocumentApiController extends Controller
{
    /** LIST */
    public function index(Request $request)
    {
        $perPage  = (int) $request->input('per_page', 10);
        $rakId    = $request->integer('rak_id');
        $bidangId = $request->integer('bidang_id');
        $q        = trim((string) $request->input('q', ''));

        $query = Document::query()
            ->with([
                'location:id,nama_rak',
                'bidang:id,nama',
                'categories:id,nama',
            ])
            ->when($rakId, fn($qq) => $qq->where('location_id', $rakId))
            ->when($bidangId, fn($qq) => $qq->where('bidang_id', $bidangId))
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('title', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->latest();

        $result = $query->paginate($perPage);

        // alias utk FE
        $result->getCollection()->transform(function ($doc) {
            $doc->judul     = $doc->title;
            $doc->ringkasan = $doc->description;
            return $doc;
        });

        return $result;
    }

    /** DETAIL */
    public function show($id)
    {
        $doc = Document::with([
            'location:id,nama_rak',
            'bidang:id,nama',
            'categories:id,nama',
        ])->findOrFail($id);

        // alias utk FE
        $doc->judul     = $doc->title;
        $doc->ringkasan = $doc->description;

        return $doc;
    }

    /** CREATE */
    public function store(Request $request)
    {
        $data = $request->validate([
            'judul'          => ['required', 'string', 'max:255'],
            'ringkasan'      => ['nullable', 'string'],
            'rak_id'         => ['required', 'integer', 'exists:locations,id'],
            'bidang_id'      => ['sometimes', 'integer', 'exists:bidang,id'],
            'file'           => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx', 'max:20480'],
            'category_ids'   => ['nullable', 'array'],
            'category_ids.*' => ['integer'],
            'kode_document'  => ['sometimes', 'nullable', 'string', 'max:50', 'unique:documents,kode_document'],
        ]);

        $storedPath = null;

        DB::beginTransaction();
        try {
            // resolve bidang jika tidak dikirim
            $resolvedBidangId = $data['bidang_id'] ?? null;
            if (!$resolvedBidangId) {
                $resolvedBidangId = $this->resolveBidangIdFromRak((int) $data['rak_id']);
                if (!$resolvedBidangId) {
                    return response()->json([
                        'message' => 'Rak tidak memiliki bidang yang valid.',
                        'errors'  => ['bidang_id' => ['Bidang tidak dapat ditentukan dari rak yang dipilih.']],
                    ], 422);
                }
            }

            $doc = new Document();
            $doc->kode_document = $data['kode_document'] ?? $this->makeKodeDoc($data['judul']);
            $doc->title         = $data['judul'];
            $doc->description   = $data['ringkasan'] ?? null;
            $doc->bidang_id     = (int) $resolvedBidangId;
            $doc->location_id   = (int) $data['rak_id'];

            if ($request->user() && Schema::hasColumn('documents', 'created_by')) {
                $doc->created_by = $request->user()->id;
            }
            if (Schema::hasColumn('documents', 'status')) {
                $doc->status = 1;
            }
            $doc->save();

            // upload file
            $storedPath = $request->file('file')->store('documents', 'public');

            // catat meta file (isi kolom yang tersedia saja)
            if (Schema::hasTable('document_files')) {
                $insert = ['document_id' => $doc->id];

                // path
                if (Schema::hasColumn('document_files', 'file_path'))      $insert['file_path'] = $storedPath;
                elseif (Schema::hasColumn('document_files', 'path'))        $insert['path'] = $storedPath;
                elseif (Schema::hasColumn('document_files', 'file'))        $insert['file'] = $storedPath;

                $orig = $request->file('file')->getClientOriginalName();
                $mime = $request->file('file')->getClientMimeType();
                $size = $request->file('file')->getSize();

                foreach (['original_name', 'origin_name', 'file_name', 'name', 'filename'] as $col) {
                    if (Schema::hasColumn('document_files', $col)) {
                        $insert[$col] = $orig;
                        break;
                    }
                }
                foreach (['mime_type', 'mime', 'file_mime', 'mimetype'] as $col) {
                    if (Schema::hasColumn('document_files', $col)) {
                        $insert[$col] = $mime;
                        break;
                    }
                }
                foreach (['file_size', 'size', 'filesize'] as $col) {
                    if (Schema::hasColumn('document_files', $col)) {
                        $insert[$col] = $size;
                        break;
                    }
                }
                foreach (['is_active', 'active', 'status'] as $col) {
                    if (Schema::hasColumn('document_files', $col)) {
                        $insert[$col] = 1;
                        break;
                    }
                }
                $userId = optional($request->user())->id;
                foreach (['uploaded_by', 'user_id', 'created_by'] as $col) {
                    if (Schema::hasColumn('document_files', $col)) {
                        $insert[$col] = $userId;
                        break;
                    }
                }

                DB::table('document_files')->insert($insert);
            }

            if (isset($data['category_ids']) && method_exists($doc, 'categories')) {
                $doc->categories()->sync($data['category_ids']);
            }

            DB::commit();
            return response()->json(
                $doc->fresh(['location:id,nama_rak', 'bidang:id,nama']),
                201
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            if ($storedPath && Storage::disk('public')->exists($storedPath)) {
                Storage::disk('public')->delete($storedPath);
            }
            return response()->json([
                'message' => 'Gagal menyimpan dokumen',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /** UPDATE */
    public function update(Request $request, $id)
    {
        $doc  = Document::findOrFail($id);

        $data = $request->validate([
            'judul'          => ['sometimes', 'string', 'max:255'],
            'ringkasan'      => ['sometimes', 'nullable', 'string'],
            'rak_id'         => ['sometimes', 'integer', 'exists:locations,id'],
            'bidang_id'      => ['sometimes', 'integer', 'exists:bidang,id'],
            'file'           => ['sometimes', 'file', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx', 'max:20480'],
            'category_ids'   => ['nullable', 'array'],
            'category_ids.*' => ['integer'],
            'kode_document'  => ['sometimes', 'nullable', 'string', 'max:50', 'unique:documents,kode_document,' . $doc->id],
        ]);

        $storedPath = null;

        DB::beginTransaction();
        try {
            if ($request->has('judul'))     $doc->title       = $data['judul'];
            if ($request->has('ringkasan')) $doc->description = $data['ringkasan'] ?? null;

            // jika rak diganti, ikut resolve bidang jika bidang tidak dikirim
            if ($request->has('rak_id')) {
                $doc->location_id = (int) $data['rak_id'];
                if (!$request->has('bidang_id')) {
                    $newBidang = $this->resolveBidangIdFromRak((int) $data['rak_id']);
                    if ($newBidang) {
                        $doc->bidang_id = (int) $newBidang;
                    }
                }
            }

            if ($request->has('bidang_id')) {
                $doc->bidang_id = (int) $data['bidang_id'];
            }

            if ($request->has('kode_document')) {
                $doc->kode_document = $data['kode_document'] ?: $this->makeKodeDoc($doc->title ?? 'DOC');
            }

            $doc->save();

            // replace file bila ada upload baru
            if ($request->hasFile('file')) {
                $storedPath = $request->file('file')->store('documents', 'public');

                if (Schema::hasTable('document_files')) {
                    // nonaktifkan file aktif lama
                    $activeCols = array_filter(['is_active', 'active', 'status'], fn($c) => Schema::hasColumn('document_files', $c));
                    if (!empty($activeCols)) {
                        DB::table('document_files')->where('document_id', $doc->id)->update([$activeCols[0] => 0]);
                    }

                    $insert = ['document_id' => $doc->id];

                    if (Schema::hasColumn('document_files', 'file_path'))      $insert['file_path'] = $storedPath;
                    elseif (Schema::hasColumn('document_files', 'path'))        $insert['path'] = $storedPath;
                    elseif (Schema::hasColumn('document_files', 'file'))        $insert['file'] = $storedPath;

                    $orig = $request->file('file')->getClientOriginalName();
                    $mime = $request->file('file')->getClientMimeType();
                    $size = $request->file('file')->getSize();

                    foreach (['original_name', 'origin_name', 'file_name', 'name', 'filename'] as $col) {
                        if (Schema::hasColumn('document_files', $col)) {
                            $insert[$col] = $orig;
                            break;
                        }
                    }
                    foreach (['mime_type', 'mime', 'file_mime', 'mimetype'] as $col) {
                        if (Schema::hasColumn('document_files', $col)) {
                            $insert[$col] = $mime;
                            break;
                        }
                    }
                    foreach (['file_size', 'size', 'filesize'] as $col) {
                        if (Schema::hasColumn('document_files', $col)) {
                            $insert[$col] = $size;
                            break;
                        }
                    }
                    foreach (['is_active', 'active', 'status'] as $col) {
                        if (Schema::hasColumn('document_files', $col)) {
                            $insert[$col] = 1;
                            break;
                        }
                    }
                    $userId = optional($request->user())->id;
                    foreach (['uploaded_by', 'user_id', 'created_by'] as $col) {
                        if (Schema::hasColumn('document_files', $col)) {
                            $insert[$col] = $userId;
                            break;
                        }
                    }

                    DB::table('document_files')->insert($insert);
                }
            }

            if ($request->has('category_ids') && method_exists($doc, 'categories')) {
                $doc->categories()->sync($request->input('category_ids', []));
            }

            DB::commit();
            return $doc->fresh(['location:id,nama_rak', 'bidang:id,nama']);
        } catch (\Throwable $e) {
            DB::rollBack();
            if (!empty($storedPath) && Storage::disk('public')->exists($storedPath)) {
                Storage::disk('public')->delete($storedPath);
            }
            return response()->json([
                'message' => 'Gagal memperbarui dokumen',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ambil bidang_id dari tabel locations (rak) dengan nama kolom fleksibel.
     */
    private function resolveBidangIdFromRak(int $rakId): ?int
    {
        $candidates = ['bidang_id', 'id_bidang', 'bidang'];

        $col = null;
        foreach ($candidates as $c) {
            if (Schema::hasColumn('locations', $c)) {
                $col = $c;
                break;
            }
        }
        if (!$col) return null;

        $val = DB::table('locations')->where('id', $rakId)->value($col);
        return is_null($val) ? null : (int) $val;
    }

    /** DELETE */
    public function destroy($id)
    {
        $doc = Document::findOrFail($id);

        if (Schema::hasTable('document_files')) {
            $paths = [];
            $rows = DB::table('document_files')->where('document_id', $doc->id)->get();

            foreach ($rows as $row) {
                $path = $row->file_path ?? $row->path ?? $row->file ?? null;
                if ($path && Storage::disk('public')->exists($path)) {
                    $paths[] = $path;
                }
            }
            foreach ($paths as $p) Storage::disk('public')->delete($p);

            DB::table('document_files')->where('document_id', $doc->id)->delete();
        }

        $doc->delete();
        return response()->noContent();
    }

    /** DOWNLOAD file aktif */
    public function downloadActive($id)
    {
        $file = $this->getActiveFileRow($id);
        abort_unless($file && $file['full'], 404);

        $downloadName = $file['name'] ?? ('document_' . $id . '.' . pathinfo($file['full'], PATHINFO_EXTENSION));
        return response()->download($file['full'], $downloadName);
    }

    /** PREVIEW/inline */
    public function preview($id)
    {
        $file = $this->getActiveFileRow($id);
        abort_unless($file && $file['full'], 404);

        $mime = File::mimeType($file['full']) ?: ($file['mime'] ?? 'application/octet-stream');
        return response()->file($file['full'], [
            'Content-Type'        => $mime,
            'Content-Disposition' => 'inline; filename="' . basename($file['full']) . '"',
        ]);
    }

    /** helper: pilih file aktif dari document_files (fallback terbaru) */
    private function getActiveFileRow(int $documentId): ?array
    {
        if (!Schema::hasTable('document_files')) return null;

        $q = DB::table('document_files')->where('document_id', $documentId);

        $pathCol = null;
        foreach (['file_path', 'path', 'file'] as $col) {
            if (Schema::hasColumn('document_files', $col)) {
                $pathCol = $col;
                break;
            }
        }
        if (!$pathCol) return null;

        foreach (['is_active', 'active', 'status'] as $col) {
            if (Schema::hasColumn('document_files', $col)) {
                $q->orderByDesc($col);
                break;
            }
        }

        $row = $q->latest('id')->first();
        if (!$row) return null;

        $path = $row->{$pathCol} ?? null;
        if (!$path) return null;

        $full = storage_path('app/public/' . $path);

        $name = null;
        foreach (['original_name', 'origin_name', 'file_name', 'name', 'filename'] as $col) {
            if (Schema::hasColumn('document_files', $col)) {
                $name = $row->{$col} ?? null;
                break;
            }
        }
        $mime = null;
        foreach (['mime_type', 'mime', 'file_mime', 'mimetype'] as $col) {
            if (Schema::hasColumn('document_files', $col)) {
                $mime = $row->{$col} ?? null;
                break;
            }
        }

        return ['full' => $full, 'name' => $name, 'mime' => $mime];
    }

    /** generator kode unik */
    private function makeKodeDoc(string $judul): string
    {
        $base = strtoupper(Str::slug($judul, '_'));
        if ($base === '') $base = 'DOC';
        $kode = $base;
        $i = 1;
        while (Document::where('kode_document', $kode)->exists()) {
            $kode = $base . '_' . $i++;
        }
        return $kode;
    }
}