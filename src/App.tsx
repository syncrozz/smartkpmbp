/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search,
  Database, 
  UserPlus, 
  Filter, 
  X, 
  RotateCcw, 
  Briefcase, 
  UserCheck, 
  ShieldAlert, 
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Settings,
  Lock,
  Pencil,
  Smartphone,
  Download
} from 'lucide-react';
import { Staff, DivisionType, SyncConfig, StaffCommittee, AuthorizedAdmin } from './types';
import { INITIAL_STAFF_DATA } from './data/initialStaff';
import { STAFF_GRADE_MAP, determineBahagian } from './utils/staffGrade';
import { getDistrictState } from './utils/stateMapping';
import { parseCommitteeRows, generateDefaultCommitteesForStaff } from './utils/committeeService';
import { fetchStaffDataFromRemote, fetchCommitteeDataFromRemote } from './utils/gasFetcher';
import { GAS_CONFIG } from './config/gasConfig';
import { StaffCard } from './components/StaffCard';
import { ProfileModal } from './components/ProfileModal';
import { CommitteeModal } from './components/CommitteeModal';
import { SyncSettings } from './components/SyncSettings';
import { AddEditStaffModal } from './components/AddEditStaffModal';
import { CampusReferenceHub } from './components/CampusReferenceHub';
import { AdminPinModal } from './components/AdminPinModal';
import { 
  fetchStaffListFromFirestore, 
  fetchCommitteesFromFirestore, 
  saveStaffListToFirestore, 
  saveCommitteesToFirestore 
} from './config/firebase';

export default function App() {
  // Navigation State
  const [activeHub, setActiveHub] = useState<'directory' | 'rujukan'>('directory');

  // Staff Directory State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Committee State
  const [committees, setCommittees] = useState<StaffCommittee[]>([]);
  const [committeeStaff, setCommitteeStaff] = useState<Staff | null>(null);

  const fetchCommitteesFromGAS = async (currentStaffList: Staff[]) => {
    try {
      // Check Firebase Firestore first for persistent committee data
      const firestoreCommittees = await fetchCommitteesFromFirestore();
      if (firestoreCommittees && firestoreCommittees.length > 0) {
        setCommittees(firestoreCommittees);
        localStorage.setItem('kpmbp_smarthub_committees', JSON.stringify(firestoreCommittees));
        return;
      }

      const remoteCommittees = await fetchCommitteeDataFromRemote();
      if (remoteCommittees && remoteCommittees.length > 0) {
        setCommittees(remoteCommittees);
        saveCommitteesToFirestore(remoteCommittees).catch(console.warn);
        localStorage.setItem('kpmbp_smarthub_committees', JSON.stringify(remoteCommittees));
        return;
      }
    } catch (err) {
      console.warn('Committee fetch error:', err);
    }
    // Fallback default committee generator if empty or unpopulated
    const defaultComm = generateDefaultCommitteesForStaff(currentStaffList);
    setCommittees(defaultComm);
  };

  useEffect(() => {
    if (staffList.length > 0) {
      fetchCommitteesFromGAS(staffList);
    }
  }, [staffList]);
  
  // Modals & Panel States
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<DivisionType>('Semua');
  const [selectedDepartment, setSelectedDepartment] = useState('Semua');

  // Debounce search input by 250ms for high performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  // Admin & Sync States
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AuthorizedAdmin | null>(null);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsPwaInstalled(true);
      }
    } else {
      setIsPwaGuideOpen(true);
    }
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setCurrentAdmin(null);
    } else {
      setIsAdminPinOpen(true);
    }
  };

  // Home Trigger: Reset navigation, close modals/drawers/overlays, and reset filters to default
  const handleGoHome = () => {
    setActiveHub('directory');
    setSelectedStaff(null);
    setCommitteeStaff(null);
    setIsAddEditOpen(false);
    setEditingStaff(null);
    setIsSettingsOpen(false);
    setIsAdminPinOpen(false);
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedDivision('Semua');
    setSelectedDepartment('Semua');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const DEFAULT_SYNC_CONFIG: SyncConfig = {
    apiUrl: GAS_CONFIG.webAppUrl,
    sheetId: GAS_CONFIG.spreadsheetId,
    scriptId: GAS_CONFIG.scriptId,
    sheetName: 'Staff',
    isConnected: true,
    lastSyncTime: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
  };

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(DEFAULT_SYNC_CONFIG);

  // Save changes to localstorage and Firebase Firestore
  const saveStaffList = (updatedList: Staff[]) => {
    setStaffList(updatedList);
    localStorage.setItem('kpmbp_smarthub_staff', JSON.stringify(updatedList));
    saveStaffListToFirestore(updatedList).catch((err) => {
      console.warn('Sync staff to Firebase notice:', err);
    });
  };

  const handleSaveConfig = (newConfig: Partial<SyncConfig>) => {
    const updated = { ...syncConfig, ...newConfig };
    setSyncConfig(updated);
    localStorage.setItem('kpmbp_smarthub_config', JSON.stringify(updated));
  };

  // Sync Action: fetch data from Google Apps Script Web App API or fallbacks
  const fetchStaffFromGAS = async (isManual = false) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const rawArray = await fetchStaffDataFromRemote();

      if (!rawArray || rawArray.length === 0) {
        throw new Error('Tiada rekod staf ditemui daripada Google Apps Script / Google Sheets.');
      }

      const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

      const validatedList: Staff[] = rawArray.map((item: any, idx: number) => {
        const rawId = String(item.staff_id || item.ID || `ST${String(idx + 1).padStart(3, '0')}`).trim();
        const cleanId = rawId.toUpperCase().replace(/^STF-/i, 'ST').replace(/^STF/i, 'ST');
        const gradeVal = String(item.grade || item.Gred || STAFF_GRADE_MAP[cleanId] || STAFF_GRADE_MAP[rawId] || '');
        const jawatanVal = String(item.Jawatan || item.position || 'Pensyarah');
        const rawBahagian = item.Bahagian || item.division;
        const bahagianVal = determineBahagian(jawatanVal, rawBahagian);

        return {
          ID: cleanId,
          staff_id: cleanId,
          Bahagian: bahagianVal,
          DepartmentID: String(item.DepartmentID || item.department || item.Jabatan || 'JTM'),
          Nama: String(item.Nama || item.name || 'Tiada Nama'),
          NamaPendek: String(item.NamaPendek || item.short_name || ''),
          DaerahAsal: String(item.DaerahAsal || item.home_town || ''),
          TahunLahir: item.TahunLahir ? String(item.TahunLahir) : '',
          NoPlat: String(item.NoPlat || item.plate_no || ''),
          Gred: gradeVal,
          grade: gradeVal,
          Jawatan: jawatanVal,
          Kelulusan: String(item.Kelulusan || item.qualification || ''),
          Pengkhususan: String(item.Pengkhususan || item.specialisation || ''),
          Telefon: item.Telefon ? String(item.Telefon) : '',
          WhatsApp: item.WhatsApp ? String(item.WhatsApp) : '',
          Sambungan: item.Sambungan ? String(item.Sambungan) : '',
          Email: String(item.Email || item.email || ''),
          'URL Profil': String(item['URL Profil'] || item.profile_url || ''),
          Sumber: 'Google Apps Script / Sheets',
          Status: String(item.Status || item.status || 'Aktif'),
          LastSync: nowTimestamp,
        };
      });

      // Replace current local staff dataset and sync to Firebase
      saveStaffList(validatedList);

      // Update active profile modal if open
      if (selectedStaff) {
        const updatedSelected = validatedList.find((s) => s.ID === selectedStaff.ID || s.staff_id === selectedStaff.staff_id);
        if (updatedSelected) {
          setSelectedStaff(updatedSelected);
        }
      }

      const syncTime = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
      handleSaveConfig({
        isConnected: true,
        lastSyncTime: syncTime,
        apiUrl: GAS_CONFIG.webAppUrl,
        sheetId: GAS_CONFIG.spreadsheetId,
        scriptId: GAS_CONFIG.scriptId,
      });

      console.log(`Data Source:\nGoogle Apps Script / Sheets\n\nRecords Loaded:\n${validatedList.length}\n\nLast Sync:\n${nowTimestamp}`);

      if (isManual) {
        alert(`Penyamaan Berjaya!\nDikemaskini ${validatedList.length} rekod staf.`);
      }
    } catch (err: any) {
      console.error('GAS Fetch Error:', err);
      const errMsg = err.message || 'Ralat menyambung ke Google Apps Script / Google Sheets';
      setSyncError(errMsg);
      if (isManual) {
        alert(`Penyamaan Gagal: ${errMsg}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    await fetchStaffFromGAS(true);
  };

  // Load staff & config on mount directly from Google Apps Script
  useEffect(() => {
    const cachedConfig = localStorage.getItem('kpmbp_smarthub_config');
    if (cachedConfig) {
      try {
        const parsed = JSON.parse(cachedConfig);
        setSyncConfig({
          ...DEFAULT_SYNC_CONFIG,
          ...parsed,
          sheetId: GAS_CONFIG.spreadsheetId,
          scriptId: GAS_CONFIG.scriptId,
          apiUrl: GAS_CONFIG.webAppUrl,
        });
      } catch (e) {
        setSyncConfig(DEFAULT_SYNC_CONFIG);
      }
    } else {
      localStorage.setItem('kpmbp_smarthub_config', JSON.stringify(DEFAULT_SYNC_CONFIG));
    }

    const cachedStaff = localStorage.getItem('kpmbp_smarthub_staff');
    if (cachedStaff) {
      try {
        const parsedList: Staff[] = JSON.parse(cachedStaff);
        if (parsedList && parsedList.length >= 70) {
          const enriched = parsedList.map((s) => {
            const g = s.grade || s.Gred || STAFF_GRADE_MAP[s.staff_id || s.ID] || '';
            const b = s.Bahagian || determineBahagian(s.Jawatan, s.Bahagian);
            return {
              ...s,
              Bahagian: b,
              Gred: g,
              grade: g,
            };
          });
          setStaffList(enriched);
        } else {
          setStaffList(INITIAL_STAFF_DATA);
          localStorage.setItem('kpmbp_smarthub_staff', JSON.stringify(INITIAL_STAFF_DATA));
          saveStaffListToFirestore(INITIAL_STAFF_DATA).catch(() => {});
        }
      } catch (e) {
        setStaffList(INITIAL_STAFF_DATA);
      }
    } else {
      setStaffList(INITIAL_STAFF_DATA);
      localStorage.setItem('kpmbp_smarthub_staff', JSON.stringify(INITIAL_STAFF_DATA));
      saveStaffListToFirestore(INITIAL_STAFF_DATA).catch(() => {});
    }

    // Prioritize loading stored records from Firebase Firestore
    fetchStaffListFromFirestore().then((fbStaff) => {
      if (fbStaff && fbStaff.length >= 70) {
        const enriched = fbStaff.map((s) => {
          const g = s.grade || s.Gred || STAFF_GRADE_MAP[s.staff_id || s.ID] || '';
          const b = s.Bahagian || determineBahagian(s.Jawatan, s.Bahagian);
          return {
            ...s,
            Bahagian: b,
            Gred: g,
            grade: g,
          };
        });
        setStaffList(enriched);
        localStorage.setItem('kpmbp_smarthub_staff', JSON.stringify(enriched));
      } else {
        saveStaffListToFirestore(INITIAL_STAFF_DATA).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  // CRUD handlers
  const handleSaveStaff = (staff: Staff) => {
    const finalStaff = {
      ...staff,
      Bahagian: determineBahagian(staff.Jawatan, staff.Bahagian),
    };
    const exists = staffList.some((s) => s.ID === finalStaff.ID);
    let updated: Staff[];
    if (exists) {
      updated = staffList.map((s) => (s.ID === finalStaff.ID ? finalStaff : s));
    } else {
      updated = [finalStaff, ...staffList];
    }
    saveStaffList(updated);
  };

  const handleDeleteStaff = (id: string) => {
    const updated = staffList.filter((s) => s.ID !== id);
    saveStaffList(updated);
    if (selectedStaff?.ID === id) {
      setSelectedStaff(null);
    }
  };

  const handleAddNewStaff = () => {
    setEditingStaff(null);
    setIsAddEditOpen(true);
  };

  const handleResetStaffData = () => {
    saveStaffList(INITIAL_STAFF_DATA);
  };

  const handleImportCommitteeData = (importedCommittees: StaffCommittee[]) => {
    setCommittees(importedCommittees);
    localStorage.setItem('kpmbp_smarthub_committees', JSON.stringify(importedCommittees));
    saveCommitteesToFirestore(importedCommittees).catch((err) => {
      console.warn('Sync committees to Firebase notice:', err);
    });
  };

  const handleResetCommitteeData = () => {
    localStorage.removeItem('kpmbp_smarthub_committees');
    fetchCommitteesFromGAS(staffList);
  };

  // Build pre-computed searchable index on staff dataset load/change
  const indexedStaffList = useMemo(() => {
    return staffList.map((staff) => {
      const district = String(staff.DaerahAsal || '');
      const state = getDistrictState(district);

      // Collect all vehicle plates: PlatNo1, PlatNo2, PlatNo3, PlatMotor1, PlatMotor2, NoPlat
      const allPlates = [
        staff.PlatNo1,
        staff.PlatNo2,
        staff.PlatNo3,
        staff.PlatMotor1,
        staff.PlatMotor2,
        staff.NoPlat,
      ].filter(Boolean) as string[];

      const platesNormalized = allPlates.map((p) => String(p).toLowerCase().trim());
      const platesNoSpace = allPlates.map((p) => String(p).toLowerCase().replace(/\s+/g, ''));

      // Combine all searchable staff fields into a single normalized index text
      const searchableText = [
        staff.Nama,
        staff.NamaPendek,
        staff.ID,
        staff.staff_id,
        staff.Jawatan,
        staff.Gred,
        staff.grade,
        staff.DepartmentID,
        staff.Bahagian,
        staff.Email,
        staff.Telefon,
        staff.Sambungan,
        staff.WhatsApp,
        ...platesNormalized,
        ...platesNoSpace,
        staff.TahunLahir,
        staff['Tahun Lahir'],
        district,
        state,
        staff.Kelulusan,
        staff.Pengkhususan,
        staff.Sumber,
      ]
        .filter(Boolean)
        .map((val) => String(val).toLowerCase().trim())
        .join(' ');

      return {
        staff,
        searchableText,
        platesNoSpace,
      };
    });
  }, [staffList]);

  // Filters calculation using pre-computed index & debounced search query
  const uniqueDepartments = ['Semua', ...Array.from(new Set(staffList.map((s) => s.DepartmentID)))];

  const filteredStaff = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase().trim();
    const qNoSpace = q.replace(/\s+/g, '');

    return indexedStaffList
      .filter(({ staff, searchableText, platesNoSpace }) => {
        if (q) {
          const matchesQuery =
            searchableText.includes(q) ||
            searchableText.includes(qNoSpace) ||
            platesNoSpace.some((plate) => plate.includes(qNoSpace));
          if (!matchesQuery) return false;
        }

        if (selectedDivision !== 'Semua' && staff.Bahagian !== selectedDivision) {
          return false;
        }

        if (selectedDepartment !== 'Semua' && staff.DepartmentID !== selectedDepartment) {
          return false;
        }

        return true;
      })
      .map((item) => item.staff);
  }, [indexedStaffList, debouncedSearchQuery, selectedDivision, selectedDepartment]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDivision('Semua');
    setSelectedDepartment('Semua');
  };

  // Get count stats
  const totalStaff = staffList.length;
  const supportStaff = staffList.filter(s => s.Bahagian !== 'Akademik').length;
  const academicStaff = staffList.filter(s => s.Bahagian === 'Akademik').length;

  return (
    <div className="min-h-screen text-gray-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      
      {/* Dynamic Ambient Background Blobs */}
      <div className="mesh-blob blob-1"></div>
      <div className="mesh-blob blob-2"></div>
      <div className="mesh-blob blob-3"></div>

      {/* Primary Glassmorphic Header */}
      <header className="glass-panel sticky top-0 z-40 px-6 py-4 border-b border-white/40 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Platform Info with Official KPMBP SmartHub Logo (Home Trigger) */}
          <button
            type="button"
            onClick={handleGoHome}
            title="Kembali ke Halaman Utama (Home)"
            aria-label="Kembali ke Halaman Utama DIRECTORY KPMBP"
            className="flex items-center gap-3.5 text-left cursor-pointer group focus:outline-hidden transition-opacity hover:opacity-90 active:scale-[0.99]"
          >
            <img
              src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/KPMBPSmartHub/favicon.svg"
              alt="Logo DIRECTORY KPMBP"
              className="w-11 h-11 object-contain drop-shadow-sm rounded-xl shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-extrabold text-gray-950 text-lg md:text-xl tracking-tight leading-tight">
                  DIRECTORY <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent">KPMBP</span>
                </h1>
              </div>
              <p className="text-[11px] text-gray-500 font-medium tracking-wide">Kolej Profesional MARA Bandar Penawar</p>
            </div>
          </button>

          {/* Dynamic Campus Center Control Deck */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Admin Mode Toggle Button */}
            <button
              onClick={handleToggleAdminMode}
              title={isAdminMode ? 'Matikan Admin Mode' : 'Aktifkan Admin Mode (Emel MARA / Master PIN)'}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all border cursor-pointer ${
                isAdminMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-200'
                  : 'bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 border-slate-200/80 shadow-2xs'
              }`}
            >
              {isAdminMode ? (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="max-w-[140px] truncate">{currentAdmin?.name ? `Admin: ${currentAdmin.name}` : 'Admin Mode Aktif'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin Mode</span>
                </>
              )}
            </button>

            {/* Single Consolidated Database Settings Button - Icon Only */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Pengurusan Admin & Database"
              aria-label="Pengurusan Admin & Database"
              className={`relative p-2 rounded-2xl transition-all border cursor-pointer flex items-center justify-center ${
                isSettingsOpen 
                  ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white border-transparent shadow-md shadow-indigo-200' 
                  : 'bg-white/80 text-slate-700 hover:text-indigo-600 border-slate-200/80 hover:bg-white shadow-2xs'
              }`}
            >
              <Settings className={`w-5 h-5 transition-transform duration-300 hover:rotate-90 ${isSettingsOpen ? 'text-white' : 'text-indigo-600'}`} />
            </button>
          </div>

        </div>
      </header>

      {/* Sub-Header Tab Switcher */}
      <div className="border-b border-slate-100/80 bg-white/40 backdrop-blur-md relative z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-start gap-2">
          <button
            onClick={() => setActiveHub('directory')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeHub === 'directory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white/60 text-slate-700 hover:bg-white/80 border border-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Rujukan Staff
          </button>
          <button
            onClick={() => setActiveHub('rujukan')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeHub === 'rujukan'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white/60 text-slate-700 hover:bg-white/80 border border-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            Rujukan Pelajar
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 relative z-10">
        {syncError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs text-left">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="font-extrabold text-xs uppercase tracking-wide text-red-900">Ralat Sambungan Google Apps Script</p>
                <p className="text-xs text-red-700 mt-0.5">{syncError}</p>
              </div>
            </div>
            <button
              onClick={() => fetchStaffFromGAS(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Cuba Lagi
            </button>
          </div>
        )}

        {activeHub === 'directory' ? (
          <div className="space-y-6">
            
            {/* Unified Search & Directory Control Bar */}
            <div className="glass-panel rounded-3xl p-4 md:p-5 border border-white/55 shadow-sm space-y-4 text-left">
              
              {/* Row 1: Search Box & Jabatan Selector */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* Prominent Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, no. plat (cth: SYM2539), gred, jabatan..."
                    className="w-full pl-11 pr-10 py-3 bg-white/90 border border-indigo-200/80 rounded-2xl text-xs md:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
                      title="Padam carian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Jabatan Selector */}
                <div className="relative min-w-[200px]">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white/90 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer shadow-2xs"
                  >
                    <option value="Semua">Semua Bahagian</option>
                    {uniqueDepartments.filter(d => d !== 'Semua').map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500">
                    <Filter className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Reset Filters button */}
                {(searchQuery || selectedDivision !== 'Semua' || selectedDepartment !== 'Semua') && (
                  <button
                    onClick={resetFilters}
                    className="px-3.5 py-3 text-xs text-indigo-700 hover:text-indigo-950 font-bold flex items-center justify-center gap-1.5 bg-indigo-50/80 hover:bg-indigo-100/80 rounded-2xl border border-indigo-200/80 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Set Semula</span>
                  </button>
                )}
              </div>

              {/* Row 2: Horizonal Division (Bahagian) Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100/80 pt-3">
                {(['Semua', 'Pengurusan', 'Akademik', 'Sokongan Akademik', 'Pentadbiran'] as DivisionType[]).map((div) => {
                  const isActive = selectedDivision === div;
                  const count = div === 'Semua' 
                    ? staffList.length 
                    : staffList.filter(s => s.Bahagian === div).length;

                  let pastelStyle = '';
                  let badgeStyle = '';

                  if (div === 'Semua') {
                    pastelStyle = isActive
                      ? 'bg-rose-100/95 text-rose-950 border-2 border-rose-400 shadow-xs font-black'
                      : 'bg-rose-50/80 text-rose-900 hover:bg-rose-100/70 border border-rose-200/70 font-extrabold';
                    badgeStyle = isActive ? 'bg-rose-200 text-rose-950' : 'bg-rose-100 text-rose-900';
                  } else if (div === 'Pengurusan') {
                    pastelStyle = isActive
                      ? 'bg-purple-100/95 text-purple-950 border-2 border-purple-400 shadow-xs font-black'
                      : 'bg-purple-50/80 text-purple-900 hover:bg-purple-100/70 border border-purple-200/70 font-extrabold';
                    badgeStyle = isActive ? 'bg-purple-200 text-purple-950' : 'bg-purple-100 text-purple-900';
                  } else if (div === 'Akademik') {
                    pastelStyle = isActive
                      ? 'bg-amber-100/95 text-amber-950 border-2 border-amber-400 shadow-xs font-black'
                      : 'bg-amber-50/80 text-amber-900 hover:bg-amber-100/70 border border-amber-200/70 font-extrabold';
                    badgeStyle = isActive ? 'bg-amber-200 text-amber-950' : 'bg-amber-100 text-amber-900';
                  } else if (div === 'Sokongan Akademik') {
                    pastelStyle = isActive
                      ? 'bg-sky-100/95 text-sky-950 border-2 border-sky-400 shadow-xs font-black'
                      : 'bg-sky-50/80 text-sky-900 hover:bg-sky-100/70 border border-sky-200/70 font-extrabold';
                    badgeStyle = isActive ? 'bg-sky-200 text-sky-950' : 'bg-sky-100 text-sky-900';
                  } else if (div === 'Pentadbiran') {
                    pastelStyle = isActive
                      ? 'bg-emerald-100/95 text-emerald-950 border-2 border-emerald-400 shadow-xs font-black'
                      : 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/70 border border-emerald-200/70 font-extrabold';
                    badgeStyle = isActive ? 'bg-emerald-200 text-emerald-950' : 'bg-emerald-100 text-emerald-900';
                  }

                  return (
                    <button
                      key={div}
                      onClick={() => setSelectedDivision(div)}
                      className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${pastelStyle}`}
                    >
                      <span>{div}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${badgeStyle}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Active Admin Mode Notification Banner */}
            {isAdminMode && (
              <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-950 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950">Mod Suntingan Admin Aktif</h4>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Klik ikon pensel/padam pada mana-mana kad staf untuk kemaskini atau hapus rekod secara terus.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNewStaff}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Daftarkan Staf</span>
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-3 py-1.5 bg-white border border-amber-200 text-amber-900 hover:bg-amber-100/60 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Tetapan Admin
                  </button>
                </div>
              </div>
            )}

          {/* Staff Grid Header with Add Staff button */}
          <div className="flex items-center justify-between px-2 pt-2 text-left">
            <div>
              <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Senarai Kakitangan & Pensyarah ({filteredStaff.length})
              </h2>
            </div>
            {isAdminMode && (
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setIsAddEditOpen(true);
                }}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-indigo-200 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Daftarkan Staf Baru
              </button>
            )}
          </div>

          {/* Staff Cards Grid */}
          {filteredStaff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {filteredStaff.map((staff) => (
                <div key={staff.ID} className="relative">
                  <StaffCard
                    staff={staff}
                    onClick={(stf) => setSelectedStaff(stf)}
                    isAdminMode={isAdminMode}
                    onEdit={(stf) => {
                      setEditingStaff(stf);
                      setIsAddEditOpen(true);
                    }}
                    onOpenCommittee={(stf) => setCommitteeStaff(stf)}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 border border-slate-100 shadow-sm bg-white/50">
              <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-base">No matching staff found.</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Sila cuba lagi dengan kata kunci yang berbeza.
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-indigo-200 transition-all cursor-pointer"
              >
                Kosongkan Saringan
              </button>
            </div>
          )}

          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/55 shadow-sm">
            <CampusReferenceHub />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/40 py-8 mt-16 text-center text-xs text-slate-500 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          
          {/* Statistik Direktori Section in Footer */}
          <div className="bg-white/60 border border-slate-200/60 rounded-3xl p-5 shadow-2xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-left">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Statistik Direktori KPMBP
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Ringkasan data bilangan kakitangan dan kepakaran Kolej Profesional MARA Batu Pahat
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                <div className="bg-white/90 border border-slate-100 px-4 py-2.5 rounded-2xl text-center shadow-2xs">
                  <span className="text-xl font-extrabold text-slate-800 block leading-tight">{totalStaff}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Jumlah Staf</span>
                </div>
                <div className="bg-white/90 border border-slate-100 px-4 py-2.5 rounded-2xl text-center shadow-2xs">
                  <span className="text-xl font-extrabold text-emerald-600 block leading-tight">{supportStaff}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pentadbiran & Sokongan</span>
                </div>
                <div className="bg-white/90 border border-slate-100 px-4 py-2.5 rounded-2xl text-center shadow-2xs">
                  <span className="text-xl font-extrabold text-indigo-600 block leading-tight">{academicStaff}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pakar / Akademik</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center pt-2">
            <p className="font-semibold text-slate-500 text-center leading-relaxed">
              © 2026 KPMBP SmartHub. by{' '}
              <a
                href="https://wasap.my/60145313756"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
              >
                Syncrozz
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProfileModal
        staff={selectedStaff}
        committees={committees}
        onClose={() => setSelectedStaff(null)}
        isAdminMode={isAdminMode}
        onEditStaff={(stf) => {
          setSelectedStaff(null);
          setEditingStaff(stf);
          setIsAddEditOpen(true);
        }}
        onOpenCommittee={(stf) => setCommitteeStaff(stf)}
        onOpenAdminPin={() => setIsAdminPinOpen(true)}
      />

      <CommitteeModal
        staff={committeeStaff}
        committees={committees}
        onClose={() => setCommitteeStaff(null)}
      />

      <AddEditStaffModal
        staff={editingStaff}
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingStaff(null);
        }}
        onSave={handleSaveStaff}
        onDelete={handleDeleteStaff}
      />

      <SyncSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
        onOpenAddStaffModal={() => {
          setEditingStaff(null);
          setIsAddEditOpen(true);
        }}
        config={syncConfig}
        onSaveConfig={handleSaveConfig}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
        onImportStaffData={(imported) => saveStaffList(imported)}
        onImportCommitteeData={handleImportCommitteeData}
        totalStaffCount={staffList.length}
        totalCommitteeCount={committees.length}
        staffList={staffList}
        committeeList={committees}
        onResetStaffData={handleResetStaffData}
        onResetCommitteeData={handleResetCommitteeData}
        onInstallPWA={handleInstallPWA}
        canInstallPWA={!isPwaInstalled}
      />

      <AdminPinModal
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onSuccess={(admin) => {
          setIsAdminMode(true);
          setCurrentAdmin(admin || null);
          setIsAdminPinOpen(false);
        }}
      />

    </div>
  );
}
