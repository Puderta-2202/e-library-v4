import React, { useState } from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import {
    ArrowLeft,
    FileText,
    Plus,
    Search,
    Edit,
    Trash2,
    Download,
    Eye,
    Calendar,
    User,
    Tag,
    Upload,
} from "lucide-react";

interface RakViewProps {
    rak: any;
    bidang: any;
    role: string;
    onBack: () => void;
}

const documentTypes = [
    "PDF",
    "Word",
    "Excel",
    "PowerPoint",
    "Image",
    "Video",
    "Other",
];

const categories = [
    "Peraturan",
    "Laporan",
    "Penelitian",
    "Perizinan",
    "Monitoring",
    "AMDAL",
    "Inspeksi",
    "Evaluasi",
];

const generateMockDocuments = (rakId: string, totalDokumen: number) => {
    const documentNames = [
        "Peraturan Daerah No. 15 Tahun 2023",
        "Laporan Monitoring Kualitas Air Sungai Deli",
        "Hasil Inspeksi PT. Industri Kimia Medan",
        "Dokumen AMDAL Pembangunan Pabrik Kelapa Sawit",
        "Studi Kelayakan Pengelolaan Limbah B3",
        "Data Kualitas Udara Kota Medan 2023",
        "Laporan Pengawasan Izin Lingkungan",
        "Evaluasi Program Pengendalian Pencemaran",
        "Panduan Teknis Pengelolaan Limbah",
        "Hasil Uji Lab Sampel Air Limbah",
    ];

    return Array.from({ length: totalDokumen }, (_, i) => ({
        id: `doc-${rakId}-${i + 1}`,
        kode: `DOC-${rakId}-${String(i + 1).padStart(3, "0")}`,
        name: documentNames[i % documentNames.length],
        description: `Deskripsi dokumen ${documentNames[
            i % documentNames.length
        ].toLowerCase()}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        type: documentTypes[Math.floor(Math.random() * documentTypes.length)],
        size: Math.floor(Math.random() * 5000) + 100, // KB
        uploadDate: new Date(
            2023,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ),
        lastModified: new Date(
            2024,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ),
        uploadedBy: Math.random() > 0.5 ? "admin" : "pegawai",
        status: Math.random() > 0.05 ? "active" : "archived",
        views: Math.floor(Math.random() * 100),
        downloads: Math.floor(Math.random() * 50),
    }));
};

export default function RakView({ rak, bidang, role, onBack }: RakViewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newDocument, setNewDocument] = useState({
        name: "",
        description: "",
        category: "",
        type: "",
    });
    const [documents, setDocuments] = useState(() =>
        generateMockDocuments(rak.id, rak.totalDokumen)
    );

    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch =
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
            selectedCategory === "all" || doc.category === selectedCategory;
        const matchesType = selectedType === "all" || doc.type === selectedType;

        return matchesSearch && matchesCategory && matchesType;
    });

    const handleAddDocument = () => {
        if (
            newDocument.name &&
            newDocument.description &&
            newDocument.category &&
            newDocument.type
        ) {
            const newDoc = {
                id: `doc-${rak.id}-${documents.length + 1}`,
                kode: `DOC-${rak.id}-${String(documents.length + 1).padStart(
                    3,
                    "0"
                )}`,
                name: newDocument.name,
                description: newDocument.description,
                category: newDocument.category,
                type: newDocument.type,
                size: Math.floor(Math.random() * 1000) + 100,
                uploadDate: new Date(),
                lastModified: new Date(),
                uploadedBy: role,
                status: "active" as const,
                views: 0,
                downloads: 0,
            };

            setDocuments([...documents, newDoc]);
            setNewDocument({
                name: "",
                description: "",
                category: "",
                type: "",
            });
            setIsAddDialogOpen(false);
        }
    };

    const formatFileSize = (sizeInKB: number) => {
        if (sizeInKB < 1024) return `${sizeInKB} KB`;
        return `${(sizeInKB / 1024).toFixed(1)} MB`;
    };

    const getTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            PDF: "bg-red-100 text-red-700",
            Word: "bg-blue-100 text-blue-700",
            Excel: "bg-green-100 text-green-700",
            PowerPoint: "bg-orange-100 text-orange-700",
            Image: "bg-purple-100 text-purple-700",
            Video: "bg-pink-100 text-pink-700",
            Other: "bg-gray-100 text-gray-700",
        };
        return colors[type] || colors.Other;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={onBack}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali
                            </Button>
                            <div>
                                <h1>{rak.name}</h1>
                                <p className="text-sm text-gray-600">
                                    {bidang.name} • Kode: {rak.kode}
                                </p>
                            </div>
                        </div>
                        {role === "admin" && (
                            <Dialog
                                open={isAddDialogOpen}
                                onOpenChange={setIsAddDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Upload Dokumen
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Upload Dokumen Baru
                                        </DialogTitle>
                                        <DialogDescription>
                                            Tambahkan dokumen ke rak ini
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="doc-name">
                                                Nama Dokumen
                                            </Label>
                                            <Input
                                                id="doc-name"
                                                value={newDocument.name}
                                                onChange={(e) =>
                                                    setNewDocument({
                                                        ...newDocument,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="Masukkan nama dokumen"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="doc-description">
                                                Deskripsi
                                            </Label>
                                            <Textarea
                                                id="doc-description"
                                                value={newDocument.description}
                                                onChange={(e) =>
                                                    setNewDocument({
                                                        ...newDocument,
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="Masukkan deskripsi dokumen"
                                                rows={2}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="doc-category">
                                                Kategori
                                            </Label>
                                            <Select
                                                value={newDocument.category}
                                                onValueChange={(value) =>
                                                    setNewDocument({
                                                        ...newDocument,
                                                        category: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih kategori" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(
                                                        (category) => (
                                                            <SelectItem
                                                                key={category}
                                                                value={category}
                                                            >
                                                                {category}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="doc-type">
                                                Tipe File
                                            </Label>
                                            <Select
                                                value={newDocument.type}
                                                onValueChange={(value) =>
                                                    setNewDocument({
                                                        ...newDocument,
                                                        type: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih tipe file" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {documentTypes.map(
                                                        (type) => (
                                                            <SelectItem
                                                                key={type}
                                                                value={type}
                                                            >
                                                                {type}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleAddDocument}
                                                className="flex-1"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setIsAddDialogOpen(false)
                                                }
                                            >
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {documents.length}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Total Dokumen
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Eye className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {documents.reduce(
                                            (sum, doc) => sum + doc.views,
                                            0
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Total Views
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Download className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {documents.reduce(
                                            (sum, doc) => sum + doc.downloads,
                                            0
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Total Downloads
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Tag className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {
                                            new Set(
                                                documents.map(
                                                    (doc) => doc.category
                                                )
                                            ).size
                                        }
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Kategori
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Cari dokumen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedType}
                        onValueChange={setSelectedType}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Semua Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            {documentTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            Menampilkan {filteredDocuments.length} dari{" "}
                            {documents.length} dokumen
                        </span>
                    </div>
                </div>

                {/* Documents Grid */}
                <div className="space-y-4">
                    {filteredDocuments.map((doc) => (
                        <Card
                            key={doc.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-blue-600" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                                            {doc.name}
                                                        </h3>
                                                        <p className="text-gray-600 text-sm mb-2">
                                                            Kode: {doc.kode}
                                                        </p>
                                                        <p className="text-gray-600 text-sm mb-3">
                                                            {doc.description}
                                                        </p>

                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            <Badge variant="secondary">
                                                                {doc.category}
                                                            </Badge>
                                                            <Badge
                                                                className={getTypeColor(
                                                                    doc.type
                                                                )}
                                                            >
                                                                {doc.type}
                                                            </Badge>
                                                            <Badge
                                                                variant={
                                                                    doc.status ===
                                                                    "active"
                                                                        ? "default"
                                                                        : "secondary"
                                                                }
                                                            >
                                                                {doc.status ===
                                                                "active"
                                                                    ? "Aktif"
                                                                    : "Diarsipkan"}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                Upload:{" "}
                                                                {doc.uploadDate.toLocaleDateString(
                                                                    "id-ID"
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-4 h-4" />
                                                                {doc.uploadedBy}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="w-4 h-4" />
                                                                {formatFileSize(
                                                                    doc.size
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Eye className="w-4 h-4" />
                                                                {doc.views}{" "}
                                                                views
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Download className="w-4 h-4" />
                                                                {doc.downloads}{" "}
                                                                downloads
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <Button variant="outline" size="sm">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        {role === "admin" && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredDocuments.length === 0 && (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                            Tidak ada dokumen yang ditemukan
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
