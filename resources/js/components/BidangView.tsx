import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  ArrowLeft, 
  FolderOpen, 
  FileText, 
  Plus, 
  Search,
  Edit,
  Trash2,
  BookOpen,
  Calendar
} from 'lucide-react';

interface BidangViewProps {
  bidang: any;
  role: string;
  onBack: () => void;
  onSelectRak: (rak: any) => void;
}

const generateMockRak = (bidangId: number, totalRak: number) => {
  const rakTypes = [
    'Peraturan dan Kebijakan',
    'Laporan Monitoring',
    'Data Penelitian',
    'Dokumen Perizinan',
    'Hasil Inspeksi',
    'Studi Kelayakan',
    'Dokumen AMDAL',
    'Data Kualitas Air',
    'Data Kualitas Udara',
    'Profil Pencemaran'
  ];

  return Array.from({ length: totalRak }, (_, i) => ({
    id: `${bidangId}-${i + 1}`,
    kode: `R${bidangId}${String(i + 1).padStart(2, '0')}`,
    name: `Rak ${rakTypes[i % rakTypes.length]}`,
    description: `Penyimpanan dokumen terkait ${rakTypes[i % rakTypes.length].toLowerCase()}`,
    totalDokumen: Math.floor(Math.random() * 50) + 5,
    lastUpdated: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    status: Math.random() > 0.1 ? 'active' : 'maintenance'
  }));
};

export default function BidangView({ bidang, role, onBack, onSelectRak }: BidangViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRak, setNewRak] = useState({ name: '', description: '' });
  const [rakList, setRakList] = useState(() => generateMockRak(bidang.id, bidang.totalRak));

  const filteredRak = rakList.filter(rak =>
    rak.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rak.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rak.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRak = () => {
    if (newRak.name && newRak.description) {
      const newRakItem = {
        id: `${bidang.id}-${rakList.length + 1}`,
        kode: `R${bidang.id}${String(rakList.length + 1).padStart(2, '0')}`,
        name: newRak.name,
        description: newRak.description,
        totalDokumen: 0,
        lastUpdated: new Date(),
        status: 'active' as const
      };
      
      setRakList([...rakList, newRakItem]);
      setNewRak({ name: '', description: '' });
      setIsAddDialogOpen(false);
    }
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
              <div className="flex items-center gap-3">
                <div className={`p-2 ${bidang.color} rounded-lg text-white flex items-center justify-center`}>
                  <span className="text-xl">{bidang.icon}</span>
                </div>
                <div>
                  <h1>{bidang.name}</h1>
                  <p className="text-sm text-gray-600">{bidang.description}</p>
                </div>
              </div>
            </div>
            {role === 'admin' && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Rak
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Rak Baru</DialogTitle>
                    <DialogDescription>
                      Buat rak baru untuk menyimpan dokumen
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rack-name">Nama Rak</Label>
                      <Input
                        id="rack-name"
                        value={newRak.name}
                        onChange={(e) => setNewRak({ ...newRak, name: e.target.value })}
                        placeholder="Masukkan nama rak"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rack-description">Deskripsi</Label>
                      <Textarea
                        id="rack-description"
                        value={newRak.description}
                        onChange={(e) => setNewRak({ ...newRak, description: e.target.value })}
                        placeholder="Masukkan deskripsi rak"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddRak} className="flex-1">
                        Tambah Rak
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rakList.length}</p>
                  <p className="text-sm text-gray-600">Total Rak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rakList.reduce((sum, rak) => sum + rak.totalDokumen, 0)}</p>
                  <p className="text-sm text-gray-600">Total Dokumen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rakList.filter(rak => rak.status === 'active').length}</p>
                  <p className="text-sm text-gray-600">Rak Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Cari rak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Rak Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRak.map((rak) => (
            <Card key={rak.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{rak.name}</CardTitle>
                      <Badge variant={rak.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {rak.status === 'active' ? 'Aktif' : 'Maintenance'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Kode: {rak.kode}</p>
                    <CardDescription>{rak.description}</CardDescription>
                  </div>
                  {role === 'admin' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Dokumen</span>
                    </div>
                    <span className="font-semibold text-blue-600">{rak.totalDokumen}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Diperbarui</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {rak.lastUpdated.toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    variant={rak.status === 'active' ? 'default' : 'secondary'}
                    onClick={() => onSelectRak(rak)}
                    disabled={rak.status !== 'active'}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {rak.status === 'active' ? 'Buka Rak' : 'Maintenance'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRak.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada rak yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}