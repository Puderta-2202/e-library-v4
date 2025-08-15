// BidangView.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
    ArrowLeft,
    FolderOpen,
    FileText,
    Plus,
    Search,
    Edit,
    Trash2,
    BookOpen,
    Calendar,
} from "lucide-react";

interface BidangViewProps {
    bidang: any;
    role: string;
    onBack: () => void;
    onSelectRak: (rak: any) => void;
}

export default function BidangView({
    bidang,
    role,
    onBack,
    onSelectRak,
}: BidangViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newRak, setNewRak] = useState({ name: "", description: "" });

    const [locations, setLocations] = useState<any[]>([]);
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/meta/locations").then((r) => r.json()),
            fetch(`/api/documents?bidang_id=${bidang.id}&per_page=100`).then(
                (r) => r.json()
            ),
        ])
            .then(([locs, docsPage]) => {
                setLocations(locs);
                setDocs(docsPage.data || []);
            })
            .finally(() => setLoading(false));
    }, [bidang.id]);

    const rakList = useMemo(() => {
        // group docs by location_id
        const byLoc: Record<string, any> = {};
        for (const d of docs) {
            const locName = d.location || null; // dari mapping API
            const loc = locations.find((l: any) => l.nama_rak === locName);
            const key = loc ? String(loc.id) : "unknown";
            if (!byLoc[key]) {
                byLoc[key] = {
                    id: key,
                    kode: loc ? loc.kode_rak : "N/A",
                    name: loc ? loc.nama_rak : "(Lokasi tidak diketahui)",
                    description: loc ? loc.deskripsi || "" : "",
                    totalDokumen: 0,
                    lastUpdated: null as Date | null,
                    status: "active" as const,
                    location: loc,
                };
            }
            byLoc[key].totalDokumen += 1;
            const createdAt = d.created_at ? new Date(d.created_at) : null;
            if (
                createdAt &&
                (!byLoc[key].lastUpdated || createdAt > byLoc[key].lastUpdated)
            ) {
                byLoc[key].lastUpdated = createdAt;
            }
        }
        return Object.values(byLoc);
    }, [docs, locations]);

    const filteredRak = rakList.filter(
        (rak: any) =>
            rak.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rak.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (rak.description || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    const handleAddRak = () => {
        // (Opsional) POST ke endpoint untuk menambah lokasi baru kalau kamu sediakan.
        // Untuk sekarang, kita skip (karena "rak" = locations di DB).
        setIsAddDialogOpen(false);
    };

    // ... UI render di bawah tetap, hanya ganti sumber data ...
    // - Saat menampilkan tanggal: rak.lastUpdated ? rak.lastUpdated.toLocaleDateString('id-ID') : '-'
    // - onSelectRak(rak) tetap dipakai ke halaman RakView
    return (
        <div className="min-h-screen bg-gray-50">
            {/* header & form search tetap */}
            {/* grid rak memakai filteredRak */}
            {/* tombol Tambah Rak biarkan tampil kalau memang admin, tapi implement POST nanti */}
        </div>
    );
}
