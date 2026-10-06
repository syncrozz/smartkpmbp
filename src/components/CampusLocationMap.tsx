/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  Home, 
  Utensils, 
  Trophy, 
  ShieldCheck, 
  MapPin, 
  Compass, 
  Search, 
  CheckCircle2, 
  Layers, 
  Navigation, 
  Info, 
  Sparkles,
  Landmark,
  Maximize2,
  Clock,
  PhoneCall
} from 'lucide-react';

export interface BuildingDetail {
  id: string;
  code: string;
  name: string;
  category: 'Pentadbiran' | 'Akademik' | 'Kediaman' | 'Kemudahan';
  iconType: 'admin' | 'academic' | 'tech' | 'library' | 'hall' | 'hostel' | 'food' | 'surau' | 'sports' | 'guard';
  gridPos: {
    row: number;
    col: number;
    span?: string;
  };
  description: string;
  departments: string[];
  facilities: string[];
  floors: string;
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    iconBg: string;
  };
}

export const CampusLocationMap: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('BLK-A');

  const buildings: BuildingDetail[] = [
    {
      id: 'GUARD',
      code: 'POS-01',
      name: 'Pos Keselamatan & Pintu Gerbang',
      category: 'Pentadbiran',
      iconType: 'guard',
      gridPos: { row: 1, col: 1 },
      description: 'Pusat kawalan keselamatan 24 jam dan kaunter pendaftaran pelawat rasmi KPMBP.',
      departments: ['Unit Keselamatan Kampus'],
      facilities: ['Pendaftaran Pelawat & Pas Masuk', 'Kawalan Palang Keselamatan Automatik', 'Bilik Kawalan CCTV'],
      floors: 'Aras Bawah',
      colorTheme: {
        bg: 'bg-slate-50 hover:bg-slate-100/80',
        border: 'border-slate-200',
        text: 'text-slate-800',
        badge: 'bg-slate-100 text-slate-800 border-slate-200',
        iconBg: 'bg-slate-700 text-white',
      }
    },
    {
      id: 'BLK-A',
      code: 'BLOK A',
      name: 'Bangunan Pentadbiran Utama',
      category: 'Pentadbiran',
      iconType: 'admin',
      gridPos: { row: 1, col: 2 },
      description: 'Pusat pentadbiran am kolej yang menempatkan Pejabat Pengarah, Hal Ehwal Akademik & Pelajar.',
      departments: ['Pejabat Pengarah', 'Hal Ehwal Akademik (HEA)', 'Hal Ehwal Pelajar (HEP)', 'Unit Kewangan & Akaun', 'Unit Sumber Manusia'],
      facilities: ['Bilik Mesyuarat Utama', 'Kaunter Pertanyaan Pentadbiran', 'Lobi Utama Pelawat'],
      floors: '3 Tingkat',
      colorTheme: {
        bg: 'bg-indigo-50/70 hover:bg-indigo-100/80',
        border: 'border-indigo-200',
        text: 'text-indigo-950',
        badge: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        iconBg: 'bg-indigo-600 text-white',
      }
    },
    {
      id: 'DEWAN',
      code: 'DEWAN',
      name: 'Dewan Besar Al-Khawarizmi',
      category: 'Kemudahan',
      iconType: 'hall',
      gridPos: { row: 1, col: 3 },
      description: 'Dewan serbaguna utama untuk majlis rasmi, perhimpunan kolej, dan peperiksaan akhir.',
      departments: ['Unit Pengurusan Event HEP'],
      facilities: ['Pentas Utama & Bilik VVIP', 'Sistem PA & Audio Bersepadu', 'Gelanggang Badminton Dalaman'],
      floors: 'Aras Utama',
      colorTheme: {
        bg: 'bg-purple-50/70 hover:bg-purple-100/80',
        border: 'border-purple-200',
        text: 'text-purple-950',
        badge: 'bg-purple-100 text-purple-900 border-purple-200',
        iconBg: 'bg-purple-600 text-white',
      }
    },
    {
      id: 'BLK-BC',
      code: 'BLOK B/C',
      name: 'Kompleks Akademik & Bilik Kuliah',
      category: 'Akademik',
      iconType: 'academic',
      gridPos: { row: 2, col: 1 },
      description: 'Kompleks bilik kuliah, dewan kuliah sederhana, dan pejabat pensyarah pelbagai jabatan.',
      departments: ['Jabatan Pengajian Perniagaan', 'Jabatan Sains Komputer', 'Jabatan Pengajian Am'],
      facilities: ['Dewan Kuliah 1 - 4', 'Bilik Seminar Akademik', 'Pejabat Bilik Pensyarah'],
      floors: '4 Tingkat',
      colorTheme: {
        bg: 'bg-blue-50/70 hover:bg-blue-100/80',
        border: 'border-blue-200',
        text: 'text-blue-950',
        badge: 'bg-blue-100 text-blue-900 border-blue-200',
        iconBg: 'bg-blue-600 text-white',
      }
    },
    {
      id: 'BLK-D',
      code: 'BLOK D',
      name: 'Pusat Makmal IT & Digital',
      category: 'Akademik',
      iconType: 'tech',
      gridPos: { row: 2, col: 2 },
      description: 'Pusat teknologi maklumat kolej berfasiliti tinggi dengan makmal pengaturcaraan dan rangkaian.',
      departments: ['Unit Teknologi Maklumat (IT)', 'Jabatan Sains Komputer'],
      facilities: ['Makmal Komputer 1-6', 'Bilik Server Kampus', 'Studio Inovasi Media'],
      floors: '2 Tingkat',
      colorTheme: {
        bg: 'bg-cyan-50/70 hover:bg-cyan-100/80',
        border: 'border-cyan-200',
        text: 'text-cyan-950',
        badge: 'bg-cyan-100 text-cyan-900 border-cyan-200',
        iconBg: 'bg-cyan-600 text-white',
      }
    },
    {
      id: 'LIB',
      code: 'PERPUSTAKAAN',
      name: 'Perpustakaan Al-Ghazali',
      category: 'Kemudahan',
      iconType: 'library',
      gridPos: { row: 2, col: 3 },
      description: 'Pusat sumber maklumat, koleksi buku rujukan, zon senyap, dan pangkalan data e-jurnal.',
      departments: ['Unit Perpustakaan & Maklumat'],
      facilities: ['Bilik Perbincangan Kumpulan', 'Zon Pembacaan Senyap', 'Kaunter Pinjaman & Terminal OPAC'],
      floors: '2 Tingkat',
      colorTheme: {
        bg: 'bg-emerald-50/70 hover:bg-emerald-100/80',
        border: 'border-emerald-200',
        text: 'text-emerald-950',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        iconBg: 'bg-emerald-600 text-white',
      }
    },
    {
      id: 'SURAU',
      code: 'SURAU',
      name: 'Surau Utama Al-Falah',
      category: 'Kemudahan',
      iconType: 'surau',
      gridPos: { row: 3, col: 1 },
      description: 'Pusat ibadah solat berjemaah, aktiviti kerohanian, dan usrah warga KPMBP.',
      departments: ['Unit Pengajian Islam & Kerohanian'],
      facilities: ['Ruang Solat Utama Lelaki & Wanita', 'Tempat Wuduk Selesa', 'Perpustakaan Mini Islam'],
      floors: '1 Tingkat',
      colorTheme: {
        bg: 'bg-teal-50/70 hover:bg-teal-100/80',
        border: 'border-teal-200',
        text: 'text-teal-950',
        badge: 'bg-teal-100 text-teal-900 border-teal-200',
        iconBg: 'bg-teal-600 text-white',
      }
    },
    {
      id: 'KAFE',
      code: 'KAFETERIA',
      name: 'Kafeteria Utama & Koperasi',
      category: 'Kemudahan',
      iconType: 'food',
      gridPos: { row: 3, col: 2 },
      description: 'Pusat hidangan makanan tempatan, kedai runcit Koperasi KPMBP, dan perkhidmatan cetakan.',
      departments: ['Koperasi KPMBP Berhad', 'Pengurusan Kafeteria'],
      facilities: ['Stall Makanan & Minuman', 'Kedai Buku & Alat Tulis', 'Perkhidmatan Fotostat & Printing'],
      floors: 'Aras Bawah',
      colorTheme: {
        bg: 'bg-rose-50/70 hover:bg-rose-100/80',
        border: 'border-rose-200',
        text: 'text-rose-950',
        badge: 'bg-rose-100 text-rose-900 border-rose-200',
        iconBg: 'bg-rose-600 text-white',
      }
    },
    {
      id: 'HOSTEL',
      code: 'KEDIAMAN',
      name: 'Kolej Kediaman Siswa & Siswi',
      category: 'Kediaman',
      iconType: 'hostel',
      gridPos: { row: 3, col: 3 },
      description: 'Kompleks kediaman pelajar berpusat dilengkapi pejabat warden 24 jam dan kemudahan asas.',
      departments: ['Pejabat Warden Kediaman', 'Unit Perumahan Pelajar'],
      facilities: ['Pejabat Warden Kediaman 24 Jam', 'Bilik Dobi Self-Service', 'Bilik Rehat Pelajar'],
      floors: '5 Blok Kediaman',
      colorTheme: {
        bg: 'bg-amber-50/70 hover:bg-amber-100/80',
        border: 'border-amber-200',
        text: 'text-amber-950',
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        iconBg: 'bg-amber-600 text-white',
      }
    },
    {
      id: 'SPORTS',
      code: 'SUKAN',
      name: 'Kompleks Sukan & Padang',
      category: 'Kemudahan',
      iconType: 'sports',
      gridPos: { row: 4, col: 1 },
      description: 'Padang bola sepak utama, gelanggang futsal sintetik, bola tampar, dan bola jaring.',
      departments: ['Unit Sukan & Rekreasi HEP'],
      facilities: ['Padang Bola Sepak Utama', 'Gelanggang Futsal & Bola Tampar', 'Pentas Rekreasi Sukan'],
      floors: 'Kawasan Terbuka',
      colorTheme: {
        bg: 'bg-lime-50/70 hover:bg-lime-100/80',
        border: 'border-lime-200',
        text: 'text-lime-950',
        badge: 'bg-lime-100 text-lime-900 border-lime-200',
        iconBg: 'bg-lime-600 text-white',
      }
    }
  ];

  const categories = ['Semua', 'Pentadbiran', 'Akademik', 'Kediaman', 'Kemudahan'];

  const renderIcon = (type: string, className: string = 'w-5 h-5') => {
    switch (type) {
      case 'admin':
        return <Building2 className={className} />;
      case 'academic':
        return <GraduationCap className={className} />;
      case 'tech':
        return <Layers className={className} />;
      case 'library':
        return <BookOpen className={className} />;
      case 'hall':
        return <Landmark className={className} />;
      case 'hostel':
        return <Home className={className} />;
      case 'food':
        return <Utensils className={className} />;
      case 'surau':
        return <Sparkles className={className} />;
      case 'sports':
        return <Trophy className={className} />;
      case 'guard':
        return <ShieldCheck className={className} />;
      default:
        return <MapPin className={className} />;
    }
  };

  const filteredBuildings = buildings.filter((b) => {
    const matchesCat = selectedCategory === 'Semua' || b.category === selectedCategory;
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.departments.some(d => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.facilities.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || buildings[0];

  return (
    <div className="space-y-6 text-left">
      {/* Title & Filter Header */}
      <div className="glass-panel rounded-3xl p-5 border border-white/55 shadow-sm bg-gradient-to-r from-white/80 via-indigo-50/30 to-white/60 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100/80 pb-3.5">
          {/* Quick Search */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bangunan, bilik, pejabat..."
              className="w-full pl-9 pr-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Category Pills with soft pastel colors */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">
            Kategori:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            
            // Map category to soft pastel styles
            let pastelStyle = 'bg-slate-50 text-slate-800 border-slate-200';
            if (cat === 'Semua') {
              pastelStyle = isSelected 
                ? 'bg-indigo-100 text-indigo-950 border-2 border-indigo-500 shadow-xs' 
                : 'bg-indigo-50/70 text-indigo-800 hover:bg-indigo-100/70 border border-indigo-200/60';
            } else if (cat === 'Pentadbiran') {
              pastelStyle = isSelected 
                ? 'bg-purple-100 text-purple-950 border-2 border-purple-500 shadow-xs' 
                : 'bg-purple-50/70 text-purple-800 hover:bg-purple-100/70 border border-purple-200/60';
            } else if (cat === 'Akademik') {
              pastelStyle = isSelected 
                ? 'bg-cyan-100 text-cyan-950 border-2 border-cyan-500 shadow-xs' 
                : 'bg-cyan-50/70 text-cyan-800 hover:bg-cyan-100/70 border border-cyan-200/60';
            } else if (cat === 'Kediaman') {
              pastelStyle = isSelected 
                ? 'bg-amber-100 text-amber-950 border-2 border-amber-500 shadow-xs' 
                : 'bg-amber-50/70 text-amber-800 hover:bg-amber-100/70 border border-amber-200/60';
            } else if (cat === 'Kemudahan') {
              pastelStyle = isSelected 
                ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-500 shadow-xs' 
                : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/60';
            }

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${pastelStyle}`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid Visual Layout + Detail Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Visual Icon Grid Map */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 border border-white/55 shadow-sm bg-white/50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Grid Lokasi Bangunan (Klik pada ikon untuk butiran)
            </h4>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              {filteredBuildings.length} Bangunan Ditemui
            </span>
          </div>

          {/* Grid Layout Representing Campus Geography */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredBuildings.map((building) => {
              const isSelected = building.id === selectedBuildingId;

              return (
                <div
                  key={building.id}
                  onClick={() => setSelectedBuildingId(building.id)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    building.colorTheme.bg
                  } ${
                    isSelected 
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md scale-[1.02] bg-white' 
                      : `${building.colorTheme.border} hover:shadow-xs`
                  }`}
                >
                  {/* Top Bar: Code & Icon */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-md border ${building.colorTheme.badge}`}>
                      {building.code}
                    </span>
                    <div className={`p-2 rounded-xl shadow-2xs ${building.colorTheme.iconBg}`}>
                      {renderIcon(building.iconType, 'w-4 h-4')}
                    </div>
                  </div>

                  {/* Building Title & Category */}
                  <div>
                    <h5 className="font-sans font-extrabold text-slate-900 text-xs tracking-tight leading-snug line-clamp-1">
                      {building.name}
                    </h5>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                      {building.category} • {building.floors}
                    </p>
                  </div>

                  {/* Active Indicator Pin */}
                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 pt-1 border-t border-indigo-100">
                      <MapPin className="w-3 h-3 text-indigo-600 animate-bounce" />
                      <span>Dipilih</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredBuildings.length === 0 && (
            <div className="p-8 text-center bg-white/40 rounded-2xl border border-slate-100 space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Tiada bangunan padan dengan carian.</p>
            </div>
          )}
        </div>

        {/* Right 1 Column: Selected Building Inspection Panel */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-5 border border-white/55 shadow-sm bg-gradient-to-b from-white/90 to-indigo-50/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Maklumat Bangunan
            </h4>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
              {selectedBuilding.code}
            </span>
          </div>

          {/* Building Header Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-2xl shadow-sm ${selectedBuilding.colorTheme.iconBg} shrink-0`}>
                {renderIcon(selectedBuilding.iconType, 'w-6 h-6')}
              </div>
              <div>
                <h3 className="font-sans font-extrabold text-slate-900 text-sm leading-snug">
                  {selectedBuilding.name}
                </h3>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" /> {selectedBuilding.floors}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
              {selectedBuilding.description}
            </p>
          </div>

          {/* Departments inside */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              Jabatan & Unit Bertempat:
            </h5>
            <div className="space-y-1.5">
              {selectedBuilding.departments.map((dept, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-white/80 border border-slate-100 rounded-xl text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{dept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities List */}
          <div className="space-y-2 pt-2">
            <h5 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Kemudahan Utama:
            </h5>
            <div className="space-y-1.5">
              {selectedBuilding.facilities.map((fac, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-white/80 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direction Hint */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-950 font-semibold leading-relaxed flex items-center gap-2">
            <Navigation className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Sila rujuk Papan Tanda Arah di Lobi Utama untuk kedudukan bilik pensyarah & kaunter.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
