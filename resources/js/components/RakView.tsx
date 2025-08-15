import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FolderOpen, ArrowLeft } from "lucide-react";

export default function RakView({
    bidang,
    onBack,
    onOpenRak,
}: {
    bidang: any;
    onBack: () => void;
    onOpenRak: (rak: any) => void;
}) {
    const [raks, setRaks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/bidang/${bidang.id}/raks`, {
            credentials: "include",
            headers: { Accept: "application/json" },
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const j = await r.json();
                setRaks(j.data || j); // dukung paginate/non-paginate
            })
            .catch((e) => setErr(e.message))
            .finally(() => setLoading(false));
    }, [bidang?.id]);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </Button>
                    <h2 className="text-lg font-semibold">
                        Rak • {bidang?.name}
                    </h2>
                </div>
            </div>

            {loading && <div className="p-4">Memuat…</div>}
            {err && <div className="p-4 text-red-600">{err}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {raks.map((rak) => (
                    <Card
                        key={rak.id}
                        className="hover:shadow transition cursor-pointer"
                        onClick={() => onOpenRak(rak)}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                {rak.nama_rak || rak.nama}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                {rak.deskripsi || "—"}
                            </div>
                            <div className="flex items-center text-emerald-600 font-semibold">
                                <FolderOpen className="w-4 h-4 mr-2" /> Buka
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!loading && raks.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                    Belum ada rak.
                </div>
            )}
        </div>
    );
}
