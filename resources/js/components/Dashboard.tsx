import React, { useEffect, useMemo, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
    BookOpen,
    Building2,
    FolderOpen,
    FileText,
    Users,
    LogOut,
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    Download,
    Eye,
    Landmark,
    Grid3X3,
} from "lucide-react";

/* =========================
   Props & Types
   ========================= */
interface DashboardProps {
    role: string;
    username: string;
    onLogout: () => void;
    onSelectBidang: (bidang: any) => void;
}

type Overview = {
    total_bidang: number;
    total_rak: number;
    total_dokumen: number;
    total_user: number;
};

type BidangRow = {
    id: number;
    nama: string;
    deskripsi: string | null;
    total_rak: number;
    total_dokumen: number;
    last_updated: string | null;
};

type Doc = {
    id: number;
    judul?: string | null;
    title?: string | null; // fallback kalau API mengembalikan title
    ringkasan?: string | null;
    description?: string | null; // fallback
    bidang?: { id: number; nama: string };
    location?: { id: number; nama_rak: string; bidang_id?: number };
};

type MetaBidang = { id: number; nama: string };
type MetaRak = { id: number; nama_rak: string; bidang_id?: number };

/* =========================
   Utils (ikon/warna/aksen)
   ========================= */
const ICONS = ["💧", "🌬️", "☢️", "🌱", "📊", "⚖️", "🗺️", "📚", "🏞️", "🌊"];

/** warna untuk stat cards */
const STAT = [
    {
        bg: "from-sky-500 to-indigo-500",
        iconWrap: "bg-white/10",
        text: "text-white",
    },
    {
        bg: "from-emerald-500 to-teal-500",
        iconWrap: "bg-white/10",
        text: "text-white",
    },
    {
        bg: "from-violet-500 to-fuchsia-500",
        iconWrap: "bg-white/10",
        text: "text-white",
    },
    {
        bg: "from-cyan-500 to-sky-500",
        iconWrap: "bg-white/10",
        text: "text-white",
    },
];

/** aksen pastel untuk kartu grid (dokumen/bidang) */
const ACCENTS = [
    {
        from: "from-sky-50",
        to: "to-blue-100/70",
        ring: "ring-sky-200",
        dot: "bg-sky-400",
    },
    {
        from: "from-emerald-50",
        to: "to-green-100/70",
        ring: "ring-emerald-200",
        dot: "bg-emerald-400",
    },
    {
        from: "from-violet-50",
        to: "to-purple-100/70",
        ring: "ring-violet-200",
        dot: "bg-violet-400",
    },
    {
        from: "from-cyan-50",
        to: "to-teal-100/70",
        ring: "ring-cyan-200",
        dot: "bg-cyan-400",
    },
    {
        from: "from-indigo-50",
        to: "to-sky-100/70",
        ring: "ring-indigo-200",
        dot: "bg-indigo-400",
    },
    {
        from: "from-lime-50",
        to: "to-emerald-100/70",
        ring: "ring-lime-200",
        dot: "bg-lime-400",
    },
];

const accent = (i: number) => ACCENTS[i % ACCENTS.length];

/** -------------------------------
 *  fetch helper + CSRF (Sanctum)
 *  ------------------------------- */
function readCookie(name: string): string | null {
    const m = document.cookie.match(
        new RegExp(
            "(^|; )" +
                name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") +
                "=([^;]*)"
        )
    );
    return m ? decodeURIComponent(m[2]) : null;
}

let csrfReady = false;
async function ensureCsrf() {
    if (csrfReady) return;
    // set XSRF-TOKEN cookie
    await fetch("/sanctum/csrf-cookie", { credentials: "include" });
    csrfReady = true;
}

export const api = async (url: string, init: RequestInit = {}) => {
    const method = (init.method || "GET").toUpperCase();

    // headers dasar
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    // biarkan browser set Content-Type utk FormData
    const isFD =
        typeof FormData !== "undefined" && init.body instanceof FormData;
    if (!isFD && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    // Ajax hint
    headers.set("X-Requested-With", "XMLHttpRequest");

    // Non-GET perlu CSRF (Sanctum stateful)
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        await ensureCsrf();
        const xsrf = readCookie("XSRF-TOKEN");
        if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
    }

    // kirim
    const doFetch = async () =>
        fetch(url, { credentials: "include", ...init, headers });

    let res = await doFetch();

    // Jika token kadaluarsa (419), refresh CSRF lalu ulang sekali
    if (res.status === 419) {
        csrfReady = false;
        await ensureCsrf();
        const xsrf = readCookie("XSRF-TOKEN");
        if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
        res = await doFetch();
    }

    if (!res.ok) {
        // coba ambil pesan error dari JSON
        let msg = `${res.status} ${res.statusText}`;
        try {
            const j = await res.json();
            msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
    }
    return res;
};

/* =========================
   Modal shell & sub-forms
   ========================= */
function ModalShell({
    title,
    children,
    onClose,
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="absolute inset-0 grid place-items-center p-4">
                <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
                    <div className="px-5 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800">
                                {title}
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-slate-100"
                                onClick={onClose}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                    <div className="p-5">{children}</div>
                </div>
            </div>
        </div>
    );
}

/* ----------------- Doc Form (Tambah/Edit) ----------------- */
function DocForm({
    initial,
    isAdmin,
    onSaved,
    onClose,
}: {
    initial?: Doc | null;
    isAdmin: boolean;
    onSaved: () => void;
    onClose: () => void;
}) {
    const [judul, setJudul] = useState(initial?.judul || initial?.title || "");
    const [ringkasan, setRingkasan] = useState(
        initial?.ringkasan || initial?.description || ""
    );
    const [bidangId, setBidangId] = useState<number | "">(
        initial?.bidang?.id || ""
    );
    const [rakId, setRakId] = useState<number | "">(
        initial?.location?.id || ""
    );
    const [file, setFile] = useState<File | null>(null);
    const [bidangs, setBidangs] = useState<MetaBidang[]>([]);
    const [raks, setRaks] = useState<MetaRak[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            api("/api/meta/bidang").then((r) => r.json()),
            api("/api/meta/locations").then((r) => r.json()),
        ])
            .then(([b, l]) => {
                setBidangs(b || []);
                setRaks(l || []);
            })
            .catch(() => {});
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("judul", judul);
            if (ringkasan) fd.append("ringkasan", ringkasan);
            if (rakId) fd.append("rak_id", String(rakId));
            if (bidangId) fd.append("bidang_id", String(bidangId));
            if (file) fd.append("file", file);

            const base = isAdmin ? "/api/admin/documents" : "/api/documents";
            if (initial?.id) {
                await api(`${base}/${initial.id}`, {
                    method: "POST",
                    headers: { "X-HTTP-Method-Override": "PUT" },
                    body: fd,
                });
            } else {
                await api(base, { method: "POST", body: fd });
            }
            onSaved();
            onClose();
        } catch (err: any) {
            alert(`Gagal menyimpan: ${err?.message || err}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-sky-50">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                        {initial ? "Edit Dokumen" : "Tambah Dokumen"}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>
            <form className="p-5 space-y-4" onSubmit={submit}>
                <div>
                    <label className="text-sm text-slate-600">Judul</label>
                    <Input
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-600">Ringkasan</label>
                    <textarea
                        className="w-full rounded-md border border-slate-200 p-2 text-sm"
                        rows={4}
                        value={ringkasan}
                        onChange={(e) => setRingkasan(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-slate-600">Bidang</label>
                        <select
                            value={bidangId as any}
                            onChange={(e) =>
                                setBidangId(
                                    e.target.value ? Number(e.target.value) : ""
                                )
                            }
                            className="w-full border rounded-md h-10 px-2"
                        >
                            <option value="">Pilih Bidang…</option>
                            {bidangs.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.nama}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-slate-600">Rak</label>
                        <select
                            value={rakId as any}
                            onChange={(e) =>
                                setRakId(
                                    e.target.value ? Number(e.target.value) : ""
                                )
                            }
                            className="w-full border rounded-md h-10 px-2"
                            required
                        >
                            <option value="">Pilih Rak…</option>
                            {raks
                                .filter((r) =>
                                    bidangId ? r.bidang_id === bidangId : true
                                )
                                .map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.nama_rak}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-sm text-slate-600">
                        File (PDF/Office)
                    </label>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Batal
                    </Button>
                    <Button
                        disabled={saving}
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                    >
                        {saving ? "Menyimpan…" : "Simpan"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

/* ----------------- Document Manager (modal grid berwarna) ----------------- */
function DocumentManager({
    isOpen,
    onClose,
    isAdmin,
}: {
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
}) {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Doc | null>(null);

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            const r = await api("/api/documents");
            const j = await r.json();
            const items: Doc[] = Array.isArray(j?.data)
                ? j.data
                : Array.isArray(j)
                ? j
                : [];
            setDocs(items);
        } catch (e: any) {
            setErr(e?.message || "Gagal memuat dokumen");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (isOpen) load();
    }, [isOpen]);

    const openNew = () => {
        setEditing(null);
        setShowForm(true);
    };
    const openEdit = (d: Doc) => {
        setEditing(d);
        setShowForm(true);
    };
    const removeDoc = async (id: number) => {
        if (!confirm("Hapus dokumen ini?")) return;
        try {
            const base = isAdmin ? "/api/admin/documents" : "/api/documents";
            await api(`${base}/${id}`, { method: "DELETE" });
            await load();
        } catch (e: any) {
            alert(`Gagal menghapus: ${e?.message || e}`);
        }
    };
    const previewUrl = (id: number) => `/api/documents/${id}/preview`;
    const downloadUrl = (id: number) => `/api/documents/${id}/download`;

    if (!isOpen) return null;

    return (
        <ModalShell title="Kelola Dokumen" onClose={onClose}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">{docs.length} item</p>
                <Button
                    onClick={openNew}
                    className="bg-slate-900 text-white hover:bg-slate-800"
                >
                    <Plus className="w-4 h-4 mr-2" /> Tambah
                </Button>
            </div>
            {loading && <p className="text-sm text-slate-500">Memuat…</p>}
            {err && <p className="text-sm text-rose-600">{err}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((d, i) => {
                    const a = accent(i);
                    const title = d.judul || d.title || "-";
                    const desc = d.ringkasan || d.description || "—";
                    return (
                        <div
                            key={d.id}
                            className={`rounded-xl p-4 transition-all bg-gradient-to-br ${a.from} ${a.to} ring-1 ${a.ring}
                          hover:shadow-xl hover:-translate-y-[1px] hover:ring-2`}
                        >
                            <div className="flex justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`w-2 h-2 rounded-full ${a.dot}`}
                                        />
                                        <p className="font-medium text-slate-800">
                                            {title}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                        <span className="px-2 py-0.5 rounded-full bg-white/70 text-slate-700 ring-1 ring-white/60">
                                            Bidang: {d.bidang?.nama || "-"}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-white/70 text-slate-700 ring-1 ring-white/60">
                                            Rak: {d.location?.nama_rak || "-"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <a
                                        href={previewUrl(d.id)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/60"
                                        title="Preview"
                                    >
                                        <Eye className="w-4 h-4 text-slate-700" />
                                    </a>
                                    <a
                                        href={downloadUrl(d.id)}
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/60"
                                        title="Unduh"
                                    >
                                        <Download className="w-4 h-4 text-slate-700" />
                                    </a>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="hover:bg-white/60"
                                        onClick={() => openEdit(d)}
                                        title="Edit"
                                    >
                                        <Pencil className="w-4 h-4 text-slate-700" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="hover:bg-white/60"
                                        onClick={() => removeDoc(d.id)}
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4 text-rose-600" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700/80 mt-3 line-clamp-2">
                                {desc}
                            </p>
                        </div>
                    );
                })}
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[60]">
                    <div
                        className="absolute inset-0 bg-slate-900/50"
                        onClick={() => setShowForm(false)}
                    />
                    <div className="absolute inset-0 grid place-items-center p-4">
                        <DocForm
                            initial={editing}
                            isAdmin={isAdmin}
                            onSaved={load}
                            onClose={() => setShowForm(false)}
                        />
                    </div>
                </div>
            )}
        </ModalShell>
    );
}

/* =========================
   RAK – Form (Tambah/Edit)
   ========================= */
function RakForm({
    initial,
    onSaved,
    onClose,
}: {
    initial?: {
        id?: number;
        nama_rak?: string;
        bidang_id?: number | null;
    } | null;
    onSaved: () => void;
    onClose: () => void;
}) {
    const [nama, setNama] = React.useState(initial?.nama_rak ?? "");
    const [bidangId, setBidangId] = React.useState<number | "">(
        initial?.bidang_id ?? ""
    );
    const [saving, setSaving] = React.useState(false);
    const [bidangs, setBidangs] = React.useState<
        Array<{ id: number; nama: string }>
    >([]);

    React.useEffect(() => {
        api("/api/meta/bidang")
            .then((r) => r.json())
            .then((j) => setBidangs(Array.isArray(j) ? j : j?.data ?? []))
            .catch(() => {});
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                nama_rak: nama,
                ...(bidangId ? { bidang_id: Number(bidangId) } : {}),
            };
            if (initial?.id) {
                await api(`/api/admin/raks/${initial.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
            } else {
                await api("/api/admin/raks", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }
            onSaved();
            onClose();
        } catch (e: any) {
            alert(e?.message || "Gagal menyimpan rak");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={submit}>
            <div>
                <label className="text-sm text-slate-600">Nama Rak</label>
                <Input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="text-sm text-slate-600">Bidang</label>
                <select
                    className="w-full border rounded-md h-10 px-2"
                    value={bidangId as any}
                    onChange={(e) =>
                        setBidangId(
                            e.target.value ? Number(e.target.value) : ""
                        )
                    }
                >
                    <option value="">— Pilih Bidang —</option>
                    {bidangs.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.nama}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Batal
                </Button>
                <Button disabled={saving} className="bg-slate-900 text-white">
                    {saving ? "Menyimpan…" : "Simpan"}
                </Button>
            </div>
        </form>
    );
}

/* =========================
   RAK – Manager (CRUD)
   ========================= */
/* ====== Tambahkan sekali dekat helper api() ====== */
// Panggil sebelum POST/PUT/DELETE agar tidak CSRF mismatch (Sanctum)
let __didFetchCsrf = false;
// async function ensureCsrf() {
//     if (__didFetchCsrf) return;
//     try {
//         await fetch("/sanctum/csrf-cookie", { credentials: "include" });
//         __didFetchCsrf = true;
//     } catch {
//         // biarkan silent; jika gagal, request berikutnya akan error jelas
//     }
// }

/* ====== RakManager lengkap ====== */
function RakManager({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    type RakRow = {
        id: number;
        nama_rak: string;
        bidang_id?: number | null;
        bidang_nama?: string | null;
    };
    type BidangMeta = { id: number; nama: string };

    const [raks, setRaks] = React.useState<RakRow[]>([]);
    const [bidangs, setBidangs] = React.useState<BidangMeta[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    const [showForm, setShowForm] = React.useState(false);
    const [editing, setEditing] = React.useState<{
        id?: number;
        nama_rak: string;
        bidang_id: number | ""; // "" = tidak dipilih
    }>({ nama_rak: "", bidang_id: "" });
    const [saving, setSaving] = React.useState(false);

    // ---- helper lokal (aman bila kamu sudah punya ensureCsrf global) ----
    const ensureCsrf = React.useCallback(async () => {
        try {
            await fetch("/sanctum/csrf-cookie", { credentials: "include" });
        } catch {}
    }, []);

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            // Admin list rak + meta bidang
            const [lokRes, bidRes] = await Promise.all([
                api("/api/admin/locations").then((r) => r.json()),
                api("/api/meta/bidang").then((r) => r.json()),
            ]);

            // Normalisasi list rak dari /api/admin/locations
            const rakList: RakRow[] = (
                Array.isArray(lokRes) ? lokRes : lokRes?.data || []
            ).map((x: any) => ({
                id: Number(x.id),
                nama_rak: String(x.nama_rak ?? x.nama ?? x.name ?? "-"),
                bidang_id:
                    x.bidang_id != null
                        ? Number(x.bidang_id)
                        : x.id_bidang != null
                        ? Number(x.id_bidang)
                        : x.bidang != null
                        ? Number(x.bidang)
                        : null,
                bidang_nama: x.bidang_nama ?? null, // kalau BE ikut kirim nama bidang
            }));

            // Normalisasi list bidang
            const bidangList: BidangMeta[] = (
                Array.isArray(bidRes) ? bidRes : bidRes?.data || []
            ).map((b: any) => ({
                id: Number(b.id),
                nama: String(b.nama ?? b.name ?? "-"),
            }));

            setRaks(rakList);
            setBidangs(bidangList);
        } catch (e: any) {
            setErr(e?.message || "Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (isOpen) load();
    }, [isOpen]);

    const bidangNameById = React.useMemo(() => {
        const m = new Map<number, string>();
        for (const b of bidangs) m.set(b.id, b.nama);
        return m;
    }, [bidangs]);

    // --- actions ---
    const openAdd = () => {
        setEditing({ id: undefined, nama_rak: "", bidang_id: "" });
        setShowForm(true);
    };

    const openEdit = (row: RakRow) => {
        setEditing({
            id: row.id,
            nama_rak: row.nama_rak,
            bidang_id: row.bidang_id ?? "",
        });
        setShowForm(true);
    };

    const closeForm = () => setShowForm(false);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await ensureCsrf();

            // gunakan urlencoded agar Laravel gampang parsing (jangan JSON)
            const body = new URLSearchParams();
            body.set("nama_rak", editing.nama_rak);
            if (editing.bidang_id !== "")
                body.set("bidang_id", String(editing.bidang_id));

            if (editing.id) {
                // UPDATE
                await api(`/api/admin/locations/${editing.id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8",
                        "X-HTTP-Method-Override": "PUT",
                    },
                    body,
                });
            } else {
                // CREATE
                await api("/api/admin/locations", {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                    body,
                });
            }

            await load();
            setShowForm(false);
        } catch (e: any) {
            alert(e?.message || "Gagal menyimpan rak");
        } finally {
            setSaving(false);
        }
    };

    // const removeRak = async (id: number) => {
    //     if (!confirm("Hapus rak ini?")) return;
    //     try {
    //         await ensureCsrf();
    //         await api(`/api/admin/locations/${id}`, { method: "DELETE" });
    //         await load();
    //     } catch (e: any) {
    //         alert(e?.message || "Gagal menghapus rak");
    //     }
    // };

    if (!isOpen) return null;

    return (
        <ModalShell title="Kelola Rak" onClose={onClose}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">
                    {loading ? "Memuat…" : `${raks.length} item`}
                    {err ? ` · ${err}` : ""}
                </p>
                <div className="flex gap-2">
                    <Button
                        className="bg-slate-900 text-white hover:bg-slate-800"
                        onClick={openAdd}
                    >
                        + Tambah
                    </Button>
                </div>
            </div>

            {/* list rak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {raks.map((r) => (
                    <div
                        key={r.id}
                        className="rounded-xl p-4 bg-gradient-to-br from-rose-50 to-pink-100/60 ring-1 ring-rose-200"
                    >
                        <div className="flex items-start justify-between">
                            <p className="font-medium text-slate-800">
                                {r.nama_rak}
                            </p>
                            <span className="w-2 h-2 rounded-full bg-rose-400 mt-1" />
                        </div>

                        <p className="mt-2 text-sm text-slate-700">
                            Bidang:{" "}
                            <span className="font-semibold">
                                {r.bidang_nama ??
                                    (r.bidang_id &&
                                    bidangNameById.get(r.bidang_id)
                                        ? bidangNameById.get(r.bidang_id)
                                        : "—")}
                            </span>
                        </p>

                        <div className="mt-3 flex gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                title="Edit"
                                onClick={() => openEdit(r)}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4 text-slate-700"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                            </Button>
                            {/* <Button
                                size="icon"
                                variant="ghost"
                                title="Hapus"
                                onClick={() => removeRak(r.id)}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4 text-rose-600"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </Button> */}
                        </div>
                    </div>
                ))}
            </div>

            {/* modal form tambah/edit */}
            {showForm && (
                <div className="fixed inset-0 z-[60]">
                    <div
                        className="absolute inset-0 bg-slate-900/50"
                        onClick={closeForm}
                    />
                    <div className="absolute inset-0 grid place-items-center p-4">
                        <div className="w-full max-w-md bg-white rounded-xl shadow-xl ring-1 ring-slate-200 overflow-hidden">
                            <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-sky-50">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        {editing.id ? "Edit Rak" : "Tambah Rak"}
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={closeForm}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            <form
                                className="p-5 space-y-4"
                                onSubmit={submitForm}
                            >
                                <div>
                                    <label className="text-sm text-slate-600">
                                        Nama Rak
                                    </label>
                                    <input
                                        className="w-full border rounded-md h-10 px-3"
                                        value={editing.nama_rak}
                                        onChange={(e) =>
                                            setEditing((s) => ({
                                                ...s,
                                                nama_rak: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-slate-600">
                                        Bidang
                                    </label>
                                    <select
                                        className="w-full border rounded-md h-10 px-2"
                                        value={editing.bidang_id as any}
                                        onChange={(e) =>
                                            setEditing((s) => ({
                                                ...s,
                                                bidang_id: e.target.value
                                                    ? Number(e.target.value)
                                                    : "",
                                            }))
                                        }
                                    >
                                        <option value="">
                                            — Pilih Bidang —
                                        </option>
                                        {bidangs.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={closeForm}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        disabled={saving}
                                        className="bg-slate-900 text-white hover:bg-slate-800"
                                    >
                                        {saving ? "Menyimpan…" : "Simpan"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </ModalShell>
    );
}

/* =========================
   BIDANG – Form (Tambah/Edit)
   ========================= */
function BidangForm({
    initial,
    onSaved,
    onClose,
}: {
    initial?: { id?: number; nama?: string; deskripsi?: string | null } | null;
    onSaved: () => void;
    onClose: () => void;
}) {
    const [nama, setNama] = React.useState(initial?.nama ?? "");
    const [deskripsi, setDeskripsi] = React.useState(initial?.deskripsi ?? "");
    const [saving, setSaving] = React.useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { nama, ...(deskripsi ? { deskripsi } : {}) };
            if (initial?.id) {
                await api(`/api/admin/bidang/${initial.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
            } else {
                await api("/api/admin/bidang", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }
            onSaved();
            onClose();
        } catch (e: any) {
            alert(e?.message || "Gagal menyimpan bidang");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={submit}>
            <div>
                <label className="text-sm text-slate-600">Nama Bidang</label>
                <Input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="text-sm text-slate-600">Deskripsi</label>
                <textarea
                    className="w-full rounded-md border border-slate-200 p-2 text-sm"
                    rows={3}
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Batal
                </Button>
                <Button disabled={saving} className="bg-slate-900 text-white">
                    {saving ? "Menyimpan…" : "Simpan"}
                </Button>
            </div>
        </form>
    );
}

/* =========================
   BIDANG – Manager (CRUD)
   ========================= */
function BidangManager({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [items, setItems] = React.useState<
        {
            id: number;
            nama: string;
            deskripsi?: string | null;
            total_rak: number;
            total_dokumen: number;
        }[]
    >([]);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            // Ambil ringkasan per-bidang (sudah dipakai di Dashboard)
            const res = await api("/api/analytics/bidang-summary");
            const json = await res.json();

            // Normalisasi bentuk data → pastikan ada total_rak & total_dokumen
            const list = (Array.isArray(json) ? json : json?.data || []).map(
                (b: any) => ({
                    id: b.id,
                    nama: b.nama,
                    deskripsi: b.deskripsi ?? null,
                    total_rak: Number(b.total_rak ?? 0),
                    total_dokumen: Number(b.total_dokumen ?? 0),
                })
            );
            setItems(list);
        } catch (e: any) {
            setErr(e?.message || "Gagal memuat bidang");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (isOpen) load();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <ModalShell title="Kelola Bidang" onClose={onClose}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">
                    {loading ? "Memuat…" : `${items.length} item`}
                    {err ? ` · ${err}` : ""}
                </p>
                <div className="flex gap-2">
                    {/* <Button variant="outline" onClick={load}>
                        Muat Ulang
                    </Button> */}
                    {/* tombol Tambah / Edit / Hapus tetap seperti punyamu */}
                    <Button className="bg-slate-900 text-white hover:bg-slate-800">
                        Tambah
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((b, i) => (
                    <div
                        key={b.id}
                        className="rounded-xl p-4 bg-gradient-to-br from-rose-50 to-pink-100/60 ring-1 ring-rose-200"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-medium text-slate-800">
                                    {b.nama}
                                </p>
                                {b.deskripsi && (
                                    <p className="text-sm text-slate-700 mt-1">
                                        {b.deskripsi}
                                    </p>
                                )}
                            </div>
                            <span className="w-2 h-2 rounded-full bg-rose-400 mt-1" />
                        </div>

                        <div className="mt-3 flex gap-6 text-sm text-slate-700">
                            <span>
                                <span className="font-semibold">
                                    {b.total_rak}
                                </span>{" "}
                                Rak
                            </span>
                            <span>
                                <span className="font-semibold">
                                    {b.total_dokumen}
                                </span>{" "}
                                Dokumen
                            </span>
                        </div>

                        {/* aksi (edit/hapus) punyamu bisa tetap */}
                        <div className="mt-4 flex gap-2">
                            {/* contoh ikon saja */}
                            {/* <Button size="icon" variant="ghost"><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-rose-600" /></Button> */}
                        </div>
                    </div>
                ))}
            </div>
        </ModalShell>
    );
}

/* =========================
   USER – Form (Tambah/Edit)
   ========================= */
function UserForm({
    initial,
    onSaved,
    onClose,
}: {
    initial?: any | null;
    onSaved: () => void;
    onClose: () => void;
}) {
    const [name, setName] = React.useState(initial?.name ?? "");
    const [email, setEmail] = React.useState(initial?.email ?? "");
    const [password, setPassword] = React.useState(""); // kosong saat edit = tidak ganti
    const [roleId, setRoleId] = React.useState<number | "">(
        initial?.role_id ?? initial?.role?.id ?? ""
    );
    const [bidangId, setBidangId] = React.useState<number | "">(
        initial?.bidang_id ?? initial?.bidang?.id ?? ""
    );
    const [saving, setSaving] = React.useState(false);
    const [roles, setRoles] = React.useState<
        Array<{ id: number; name: string }>
    >([]);
    const [bidangs, setBidangs] = React.useState<
        Array<{ id: number; nama: string }>
    >([]);

    React.useEffect(() => {
        Promise.all([
            api("/api/meta/roles")
                .then((r) => r.json())
                .catch(() => null),
            api("/api/meta/bidang")
                .then((r) => r.json())
                .catch(() => null),
        ]).then(([rs, bs]) => {
            const roleRows = Array.isArray(rs) ? rs : rs?.data ?? null;
            setRoles(
                roleRows && roleRows.length
                    ? roleRows
                    : [
                          { id: 1, name: "admin" },
                          { id: 2, name: "pegawai" },
                      ]
            );
            const bidangRows = Array.isArray(bs) ? bs : bs?.data ?? [];
            setBidangs(bidangRows);
        });
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = { name, email };
            if (password) payload.password = password;
            if (roleId) payload.role_id = Number(roleId);
            if (bidangId) payload.bidang_id = Number(bidangId);

            if (initial?.id) {
                await api(`/api/admin/users/${initial.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
            } else {
                // saat buat baru, password biasanya wajib
                if (!password) {
                    alert("Password wajib diisi saat membuat user baru.");
                    setSaving(false);
                    return;
                }
                await api("/api/admin/users", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            }
            onSaved();
            onClose();
        } catch (e: any) {
            alert(e?.message || "Gagal menyimpan user");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={submit}>
            <div>
                <label className="text-sm text-slate-600">Nama</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="text-sm text-slate-600">Email</label>
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="text-sm text-slate-600">
                    Password {initial ? "(opsional)" : "(wajib)"}
                </label>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={initial ? "Kosongkan jika tidak diubah" : ""}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-slate-600">Role</label>
                    <select
                        className="w-full border rounded-md h-10 px-2"
                        value={roleId as any}
                        onChange={(e) =>
                            setRoleId(
                                e.target.value ? Number(e.target.value) : ""
                            )
                        }
                    >
                        <option value="">— Pilih Role —</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-slate-600">Bidang</label>
                    <select
                        className="w-full border rounded-md h-10 px-2"
                        value={bidangId as any}
                        onChange={(e) =>
                            setBidangId(
                                e.target.value ? Number(e.target.value) : ""
                            )
                        }
                    >
                        <option value="">— Pilih Bidang —</option>
                        {bidangs.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.nama}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Batal
                </Button>
                <Button disabled={saving} className="bg-slate-900 text-white">
                    {saving ? "Menyimpan…" : "Simpan"}
                </Button>
            </div>
        </form>
    );
}

/* =========================
   USER – Manager (CRUD)
   ========================= */
function UserManager({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [items, setItems] = React.useState<Array<any>>([]);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);
    const [showForm, setShowForm] = React.useState(false);
    const [editing, setEditing] = React.useState<any | null>(null);

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            const r = await api("/api/admin/users");
            const j = await r.json();
            const rows = Array.isArray(j?.data)
                ? j.data
                : Array.isArray(j)
                ? j
                : [];
            setItems(rows);
        } catch (e: any) {
            setErr(e?.message || "Gagal memuat user");
        } finally {
            setLoading(false);
        }
    };
    React.useEffect(() => {
        if (isOpen) load();
    }, [isOpen]);

    const openNew = () => {
        setEditing(null);
        setShowForm(true);
    };
    const openEdit = (row: any) => {
        setEditing(row);
        setShowForm(true);
    };
    const removeRow = async (id: number) => {
        if (!confirm("Hapus user ini?")) return;
        try {
            await api(`/api/admin/users/${id}`, { method: "DELETE" });
            await load();
        } catch (e: any) {
            alert(e?.message || "Gagal menghapus user");
        }
    };

    if (!isOpen) return null;
    return (
        <ModalShell title="Kelola User" onClose={onClose}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">{items.length} item</p>
                <div className="flex gap-2">
                    {/* <Button
                        variant="outline"
                        onClick={load}
                        className="hover:bg-slate-50"
                    >
                        Muat Ulang
                    </Button> */}
                    <Button
                        onClick={openNew}
                        className="bg-slate-900 text-white hover:bg-slate-800"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Tambah
                    </Button>
                </div>
            </div>

            {loading && <p className="text-sm text-slate-500">Memuat…</p>}
            {err && <p className="text-sm text-rose-600">{err}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((u, i) => {
                    const a = accent(i);
                    const roleLabel =
                        typeof u.role === "string"
                            ? u.role
                            : u?.role?.name ?? u?.role?.nama ?? "—";
                    const bidangLabel = u?.bidang?.nama ?? "—";
                    return (
                        <div
                            key={u.id}
                            className={`rounded-xl p-4 bg-gradient-to-br ${a.from} ${a.to} ring-1 ${a.ring}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {u.name}
                                    </p>
                                    <p className="text-xs text-slate-700">
                                        {u.email}
                                    </p>
                                    <div className="flex gap-6 mt-2 text-xs text-slate-700">
                                        <span>Role: {roleLabel}</span>
                                        <span>Bidang: {bidangLabel}</span>
                                    </div>
                                </div>
                                <span
                                    className={`w-2 h-2 rounded-full ${a.dot}`}
                                />
                            </div>
                            <div className="flex gap-1 mt-3">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="hover:bg-white/60"
                                    onClick={() => openEdit(u)}
                                    title="Edit"
                                >
                                    <Pencil className="w-4 h-4 text-slate-700" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="hover:bg-white/60"
                                    onClick={() => removeRow(u.id)}
                                    title="Hapus"
                                >
                                    <Trash2 className="w-4 h-4 text-rose-600" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!loading && items.length === 0 && (
                <p className="text-sm text-slate-600">Belum ada user.</p>
            )}

            {showForm && (
                <div className="fixed inset-0 z-[60]">
                    <div
                        className="absolute inset-0 bg-slate-900/50"
                        onClick={() => setShowForm(false)}
                    />
                    <div className="absolute inset-0 grid place-items-center p-4">
                        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-5">
                            <div className="mb-4 font-semibold">
                                {editing ? "Edit User" : "Tambah User"}
                            </div>
                            <UserForm
                                initial={editing}
                                onSaved={load}
                                onClose={() => setShowForm(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </ModalShell>
    );
}

/* =========================
   Dashboard – lebih berwarna 🎨
   ========================= */
export default function Dashboard({
    role,
    username,
    onLogout,
    onSelectBidang,
}: DashboardProps) {
    const isAdmin = role === "admin";

    const [searchTerm, setSearchTerm] = useState("");
    const [overview, setOverview] = useState<Overview | null>(null);
    const [bidangs, setBidangs] = useState<BidangRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [openDocMgr, setOpenDocMgr] = useState(false);
    const [openRakMgr, setOpenRakMgr] = useState(false);
    const [openBidangMgr, setOpenBidangMgr] = useState(false);
    const [openUserMgr, setOpenUserMgr] = useState(false);

    useEffect(() => {
        setLoading(true);
        setErr(null);
        Promise.all([
            api("/api/analytics/overview").then((r) => r.json()),
            api("/api/analytics/bidang-summary").then((r) => r.json()),
        ])
            .then(([ov, bs]) => {
                setOverview(ov as Overview);
                setBidangs((bs as BidangRow[]) || []);
            })
            .catch((e: any) => setErr(e?.message || "Gagal memuat data"))
            .finally(() => setLoading(false));
    }, []);

    const filteredBidang = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return bidangs
            .filter(
                (b) =>
                    (b.nama || "").toLowerCase().includes(q) ||
                    (b.deskripsi || "").toLowerCase().includes(q)
            )
            .map((b, i) => ({
                id: b.id,
                name: b.nama,
                description: b.deskripsi || "",
                totalRak: b.total_rak,
                totalDokumen: b.total_dokumen,
                icon: ICONS[i % ICONS.length],
            }));
    }, [bidangs, searchTerm]);

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background dekoratif */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-sky-50" />
            <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

            {/* Header */}
            <header className="bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-emerald-500 to-sky-500 rounded-lg shadow-sm">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-slate-900">
                                    E-Library DLH Medan
                                </h1>
                                <p className="text-xs text-slate-600">
                                    Sistem Dokumen Lingkungan Hidup
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Badge dibuat terang agar teks terbaca */}
                            <Badge
                                className={
                                    isAdmin
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-sky-100 text-sky-800"
                                }
                            >
                                {isAdmin ? "Administrator" : "Pegawai"}
                            </Badge>
                            <span className="text-sm text-slate-700">
                                Halo, {username}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" /> Keluar
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-emerald-400 to-fuchsia-400" />
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Action tabs – hanya admin */}
                {isAdmin && (
                    <div className="flex flex-wrap gap-3 mb-8">
                        <Button
                            variant="outline"
                            onClick={() => setOpenDocMgr(true)}
                            className="border-sky-200 text-sky-700 hover:bg-sky-50"
                        >
                            <FileText className="w-4 h-4 mr-2" /> Kelola Dokumen
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setOpenRakMgr(true)}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                            <Grid3X3 className="w-4 h-4 mr-2" /> Kelola Rak
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setOpenBidangMgr(true)}
                            className="border-violet-200 text-violet-700 hover:bg-violet-50"
                        >
                            <Landmark className="w-4 h-4 mr-2" /> Kelola Bidang
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setOpenUserMgr(true)}
                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                        >
                            <Users className="w-4 h-4 mr-2" /> Kelola User
                        </Button>
                    </div>
                )}

                {/* Stat cards warna-warni */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Total Bidang"
                        value={overview?.total_bidang ?? (loading ? "…" : 0)}
                        icon={<Building2 className="w-6 h-6 text-white" />}
                        theme={STAT[0]}
                    />
                    <StatCard
                        title="Total Rak"
                        value={overview?.total_rak ?? (loading ? "…" : "-")}
                        icon={<FolderOpen className="w-6 h-6 text-white" />}
                        theme={STAT[1]}
                    />
                    <StatCard
                        title="Total Dokumen"
                        value={overview?.total_dokumen ?? (loading ? "…" : "-")}
                        icon={<FileText className="w-6 h-6 text-white" />}
                        theme={STAT[2]}
                    />
                    <StatCard
                        title="User Aktif"
                        value={overview?.total_user ?? (loading ? "…" : "-")}
                        icon={<Users className="w-6 h-6 text-white" />}
                        theme={STAT[3]}
                    />
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Cari bidang…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white/70 backdrop-blur border-slate-200"
                        />
                    </div>
                </div>

                {/* Bidang Cards – gradient pastel */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBidang.map((b, idx) => {
                        const a = accent(idx);
                        return (
                            <Card
                                key={b.id}
                                className={`hover:shadow-xl transition-all bg-gradient-to-br ${a.from} ${a.to} ring-1 ${a.ring} cursor-pointer`}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl text-white grid place-items-center shadow bg-slate-900/80">
                                                <span className="text-xl">
                                                    {b.icon}
                                                </span>
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg leading-tight text-slate-900">
                                                    {b.name}
                                                </CardTitle>
                                                <CardDescription className="mt-1 text-slate-700">
                                                    {b.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mb-4">
                                        <MiniStat
                                            label="Rak"
                                            value={b.totalRak}
                                            color="text-sky-700"
                                        />
                                        <MiniStat
                                            label="Dokumen"
                                            value={b.totalDokumen}
                                            color="text-emerald-700"
                                        />
                                    </div>
                                    <Button
                                        className="rounded-xl p-4 bg-gradient-to-br from-sky-50 to-blue-100/60 ring-1 ring-sky-200"
                                        onClick={() => {
                                            // tetap panggil props yg lama
                                            onSelectBidang({
                                                id: b.id,
                                                name: b.name,
                                                description: b.description,
                                            });

                                            // pastikan pindah ke halaman bidang
                                            try {
                                                window.history.pushState(
                                                    null,
                                                    "",
                                                    `/bidang/${b.id}`
                                                );
                                                // kalau App kamu pakai router client-side, event ini biar router re-evaluate
                                                window.dispatchEvent(
                                                    new PopStateEvent(
                                                        "popstate"
                                                    )
                                                );
                                            } catch {
                                                window.location.href = `/bidang/${b.id}`;
                                            }
                                        }}
                                    >
                                        <FolderOpen className="w-4 h-4 mr-2" />
                                        Buka Bidang
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {!loading && filteredBidang.length === 0 && (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600">
                            Tidak ada bidang yang ditemukan
                        </p>
                    </div>
                )}

                {err && (
                    <div className="text-center text-sm text-red-600 mt-6">
                        {err}
                    </div>
                )}
            </main>

            {/* Modals: admin only */}
            {isAdmin && (
                <>
                    <DocumentManager
                        isOpen={openDocMgr}
                        onClose={() => setOpenDocMgr(false)}
                        isAdmin={isAdmin}
                    />
                    <RakManager
                        isOpen={openRakMgr}
                        onClose={() => setOpenRakMgr(false)}
                    />
                    <BidangManager
                        isOpen={openBidangMgr}
                        onClose={() => setOpenBidangMgr(false)}
                    />
                    <UserManager
                        isOpen={openUserMgr}
                        onClose={() => setOpenUserMgr(false)}
                    />
                </>
            )}
        </div>
    );
}

/* ===== sub-components kecil ===== */
function StatCard({
    title,
    value,
    icon,
    theme,
}: {
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    theme: { bg: string; iconWrap: string; text: string };
}) {
    return (
        <div
            className={`rounded-2xl shadow-sm ring-1 ring-black/5 bg-gradient-to-br ${theme.bg} ${theme.text}`}
        >
            <div className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-3xl font-bold leading-tight">{value}</p>
                    <p className="text-sm/6 opacity-90">{title}</p>
                </div>
                <div className={`p-3 rounded-xl ${theme.iconWrap}`}>{icon}</div>
            </div>
        </div>
    );
}

function MiniStat({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-700">{label}</p>
        </div>
    );
}
