import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowLeft, Eye, Download, Trash2, Plus } from "lucide-react";

function xsrfHeader() {
    const raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith("XSRF-TOKEN="));
    const token = raw ? decodeURIComponent(raw.split("=")[1]) : "";
    return token ? { "X-XSRF-TOKEN": token } : {};
}

export default function DocumentList({
    bidang,
    rak,
    onBack,
}: {
    bidang: any;
    rak: any;
    onBack: () => void;
}) {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // upload modal
    const [openUpload, setOpenUpload] = useState(false);
    const [judul, setJudul] = useState("");
    const [file, setFile] = useState<File | null>(null);

    async function fetchDocs() {
        setLoading(true);
        setErr(null);
        try {
            const r = await fetch(`/api/raks/${rak.id}/documents`, {
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const j = await r.json();
            setRows(j.data || j);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDocs();
    }, [rak?.id]);

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!file || !judul) return;

        // Sanctum cookie dulu
        await fetch("/sanctum/csrf-cookie", { credentials: "include" });

        const form = new FormData();
        form.append("judul", judul);
        form.append("rak_id", String(rak.id));
        form.append("bidang_id", String(bidang.id));
        form.append("file", file);

        const r = await fetch("/api/documents", {
            method: "POST",
            credentials: "include",
            headers: { ...xsrfHeader() },
            body: form,
        });
        if (!r.ok) {
            const t = await r.text();
            alert(`Gagal upload: ${r.status}\n${t.slice(0, 200)}…`);
            return;
        }
        setOpenUpload(false);
        setJudul("");
        setFile(null);
        fetchDocs();
    }

    async function handleDelete(id: number) {
        if (!confirm("Hapus dokumen ini?")) return;
        await fetch("/sanctum/csrf-cookie", { credentials: "include" });
        const r = await fetch(`/api/documents/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: { Accept: "application/json", ...xsrfHeader() },
        });
        if (!r.ok) {
            const t = await r.text();
            alert(`Gagal hapus: ${r.status}\n${t.slice(0, 200)}…`);
            return;
        }
        fetchDocs();
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </Button>
                    <h2 className="text-lg font-semibold">
                        Dokumen • {bidang?.name} / {rak?.nama_rak || rak?.nama}
                    </h2>
                </div>
                <Button onClick={() => setOpenUpload(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Tambah Dokumen
                </Button>
            </div>

            {loading && <div className="p-4">Memuat…</div>}
            {err && <div className="p-4 text-red-600">{err}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rows.map((d) => (
                    <Card
                        key={d.id}
                        className="p-4 flex items-center justify-between"
                    >
                        <div>
                            <div className="font-medium">
                                {d.judul || d.nama}
                            </div>
                            <div className="text-xs text-gray-500">
                                #{d.id} • {d.ringkasan || d.deskripsi || "—"}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                className="inline-flex items-center px-3 py-2 rounded border hover:bg-gray-50"
                                href={`/api/documents/${d.id}/preview`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Eye className="w-4 h-4 mr-1" /> Preview
                            </a>
                            <a
                                className="inline-flex items-center px-3 py-2 rounded border hover:bg-gray-50"
                                href={`/api/documents/${d.id}/download`}
                            >
                                <Download className="w-4 h-4 mr-1" /> Unduh
                            </a>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(d.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-1" /> Hapus
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {!loading && rows.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                    Belum ada dokumen.
                </div>
            )}

            {/* Modal upload */}
            {openUpload && (
                <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow w-full max-w-md">
                        <div className="p-4 border-b font-semibold">
                            Tambah Dokumen
                        </div>
                        <form onSubmit={handleUpload} className="p-4 space-y-3">
                            <input
                                className="w-full border rounded px-3 py-2"
                                placeholder="Judul dokumen"
                                value={judul}
                                onChange={(e) => setJudul(e.target.value)}
                                required
                            />
                            <input
                                type="file"
                                className="w-full"
                                onChange={(e) =>
                                    setFile(e.target.files?.[0] || null)
                                }
                                required
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpenUpload(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit">Simpan</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
