import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Building2, 
  FileText, 
  FolderOpen, 
  Users, 
  Settings, 
  LogOut,
  Search,
  Plus,
  BookOpen
} from 'lucide-react';
import { Input } from './ui/input';

interface DashboardProps {
  role: string;
  username: string;
  onLogout: () => void;
  onSelectBidang: (bidang: any) => void;
}

const mockBidang = [
  {
    id: 1,
    name: 'Bidang Pengendalian Pencemaran Air',
    description: 'Pengelolaan dan pengawasan pencemaran air',
    totalRak: 12,
    totalDokumen: 145,
    icon: '💧',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: 'Bidang Pengendalian Pencemaran Udara',
    description: 'Monitoring kualitas udara dan pengendalian emisi',
    totalRak: 8,
    totalDokumen: 98,
    icon: '🌬️',
    color: 'bg-sky-500'
  },
  {
    id: 3,
    name: 'Bidang Pengelolaan Limbah B3',
    description: 'Pengelolaan limbah bahan berbahaya dan beracun',
    totalRak: 15,
    totalDokumen: 203,
    icon: '☢️',
    color: 'bg-orange-500'
  },
  {
    id: 4,
    name: 'Bidang Konservasi dan Keanekaragaman Hayati',
    description: 'Pelestarian flora dan fauna serta ekosistem',
    totalRak: 10,
    totalDokumen: 167,
    icon: '🌱',
    color: 'bg-green-500'
  },
  {
    id: 5,
    name: 'Bidang Penilaian Dampak Lingkungan',
    description: 'AMDAL dan dokumen lingkungan hidup',
    totalRak: 20,
    totalDokumen: 312,
    icon: '📊',
    color: 'bg-purple-500'
  },
  {
    id: 6,
    name: 'Bidang Pembinaan dan Penegakan Hukum',
    description: 'Pengawasan dan sanksi pelanggaran lingkungan',
    totalRak: 6,
    totalDokumen: 89,
    icon: '⚖️',
    color: 'bg-red-500'
  }
];

export default function Dashboard({ role, username, onLogout, onSelectBidang }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBidang = mockBidang.filter(bidang =>
    bidang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bidang.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRak = mockBidang.reduce((sum, bidang) => sum + bidang.totalRak, 0);
  const totalDokumen = mockBidang.reduce((sum, bidang) => sum + bidang.totalDokumen, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1>E-Library DLH Medan</h1>
                <p className="text-sm text-gray-600">Sistem Dokumen Lingkungan Hidup</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                {role === 'admin' ? 'Administrator' : 'Pegawai'}
              </Badge>
              <span className="text-sm text-gray-600">Halo, {username}</span>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockBidang.length}</p>
                  <p className="text-sm text-gray-600">Total Bidang</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalRak}</p>
                  <p className="text-sm text-gray-600">Total Rak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDokumen}</p>
                  <p className="text-sm text-gray-600">Total Dokumen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-gray-600">User Aktif</p>
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
              placeholder="Cari bidang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Bidang Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBidang.map((bidang) => (
            <Card key={bidang.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${bidang.color} rounded-lg text-white flex items-center justify-center`}>
                      <span className="text-xl">{bidang.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">{bidang.name}</CardTitle>
                      <CardDescription className="mt-1">{bidang.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{bidang.totalRak}</p>
                    <p className="text-xs text-gray-600">Rak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{bidang.totalDokumen}</p>
                    <p className="text-xs text-gray-600">Dokumen</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => onSelectBidang(bidang)}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Buka Bidang
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBidang.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada bidang yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}