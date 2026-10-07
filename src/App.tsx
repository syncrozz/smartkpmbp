/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search,
  Filter, 
  X, 
  RotateCcw, 
  UserCheck, 
  ShieldAlert, 
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Settings,
  Lock,
  Smartphone,
  Calendar,
  PhoneCall,
  BookOpen,
  FileText,
  Bell,
  Users,
  Compass,
  MessageCircle,
  CheckCircle2,
  Shield,
  Bookmark,
  School,
  ArrowRight,
  GraduationCap,
  Building2,
  Check
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
import { CampusLocationMap } from './components/CampusLocationMap';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminConsole } from './components/AdminConsole';
import { 
  fetchStaffListFromFirestore, 
  fetchCommitteesFromFirestore, 
  saveStaffListToFirestore, 
  saveCommitteesToFirestore 
} from './config/firebase';
import {
  QUICK_PORTAL_LINKS,
  CALENDAR_EVENTS,
  KEY_CAMPUS_CONTACTS,
  COLLEGE_RULES,
  CAMPUS_ANNOUNCEMENTS,
  ContactItem,
  LinkItem,
  CalendarEvent,
  RuleItem,
  AnnouncementItem
} from './data/campusReferenceData';

type MainTabType = 'hub' | 'directory' | 'kampus' | 'akademik' | 'dokumen' | 'makluman' | 'komuniti';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTabType>('hub');

  // Staff Directory State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Committee State
  const [committees, setCommittees] = useState<StaffCommittee[]>([]);
  const [committeeStaff, setCommitteeStaff] = useState<Staff | null>(null);
  const [selectedCommitteePeringkat, setSelectedCommitteePeringkat] = useState<string>('Semua');

  const fetchCommitteesFromGAS = async (currentStaffList: Staff[]) => {
    try {
      // Check persistent committee data first
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
    // Fallback default committee generator if unpopulated
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
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Semua');
  
  // Admin State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AuthorizedAdmin | null>(null);

  // Google Sheets Sync Configuration State
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    const saved = localStorage.getItem('kpmbp_smarthub_gas_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      apiUrl: GAS_CONFIG.webAppUrl,
      sheetId: GAS_CONFIG.spreadsheetId,
      scriptId: GAS_CONFIG.scriptId,
      sheetName: 'StaffList',
      isConnected: false,
      lastSyncTime: null
    };
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

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
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  // Restore Admin Session from SessionStorage on Mount
  useEffect(() => {
    try {
      const savedAdminSession = sessionStorage.getItem('kpmbp_smarthub_admin_session');
      if (savedAdminSession) {
        const parsedAdmin = JSON.parse(savedAdminSession);
        if (parsedAdmin && parsedAdmin.id) {
          setIsAdminMode(true);
          setCurrentAdmin(parsedAdmin);
        }
      }
    } catch {
      // Ignore session restore errors
    }
  }, []);

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      setCurrentAdmin(null);
      setIsAdminConsoleOpen(false);
      sessionStorage.removeItem('kpmbp_smarthub_admin_session');
    } else {
      setIsAdminPinOpen(true);
    }
  };

  const handleOpenAdmin = () => {
    if (isAdminMode) {
      setIsAdminConsoleOpen(true);
    } else {
      setIsAdminPinOpen(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setCurrentAdmin(null);
    setIsAdminConsoleOpen(false);
    sessionStorage.removeItem('kpmbp_smarthub_admin_session');
  };

  const handleGoHome = () => {
    setActiveTab('hub');
    setSearchQuery('');
    setSelectedDivision('Semua');
    setSelectedDepartment('Semua');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 180);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch staff records with remote synchronization
  const fetchStaffFromGAS = async (isManualSync = false) => {
    if (isManualSync) setIsSyncing(true);
    setSyncError(null);
    
    try {
      const data = await fetchStaffDataFromRemote();
      if (Array.isArray(data) && data.length > 0) {
        const enriched = data.map((s) => {
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
        saveStaffList(enriched);
        
        const now = new Date().toLocaleString('ms-MY', { 
          day: 'numeric', month: 'short', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        });
        const newConfig = { ...syncConfig, isConnected: true, lastSyncTime: now };
        setSyncConfig(newConfig);
        localStorage.setItem('kpmbp_smarthub_gas_config', JSON.stringify(newConfig));
      } else {
        throw new Error('Format respon tidak mengandungi senarai staf yang sah');
      }
    } catch (err: any) {
      setSyncError(err.message || 'Penyelarasan sedang dikemas kini.');
    } finally {
      if (isManualSync) setIsSyncing(false);
    }
  };

  // Save changes to storage and persistent store
  const saveStaffList = (updatedList: Staff[]) => {
    setStaffList(updatedList);
    try {
      localStorage.setItem('kpmbp_smarthub_staff', JSON.stringify(updatedList));
      saveStaffListToFirestore(updatedList).catch((err) => {
        console.warn('Penyimpanan luar talian aktif:', err);
      });
    } catch (e) {
      console.error('Ralat menyimpan maklumat staf:', e);
    }
  };

  // Save sync config
  const handleSaveConfig = (newConfig: SyncConfig) => {
    setSyncConfig(newConfig);
    localStorage.setItem('kpmbp_smarthub_gas_config', JSON.stringify(newConfig));
  };

  // Sync now
  const handleSyncNow = () => {
    fetchStaffFromGAS(true);
  };

  // Initial load: local storage or initial dataset, then verify with remote store
  useEffect(() => {
    const cachedStaff = localStorage.getItem('kpmbp_smarthub_staff');
    if (cachedStaff) {
      try {
        const parsed = JSON.parse(cachedStaff);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const enriched = parsed.map((s: Staff) => {
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
        }
      } catch (e) {
        setStaffList(INITIAL_STAFF_DATA);
      }
    } else {
      setStaffList(INITIAL_STAFF_DATA);
      localStorage.setItem('kpmbp_smarthub_staff', JSON.stringify(INITIAL_STAFF_DATA));
    }

    // Check stored records asynchronously
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
      } else if (!cachedStaff || fbStaff.length === 0) {
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

  const handleDeleteStaff = (staffId: string) => {
    const updated = staffList.filter((s) => s.ID !== staffId);
    saveStaffList(updated);
  };

  const handleAddNewStaff = () => {
    setEditingStaff(null);
    setIsAddEditOpen(true);
  };

  const handleImportCommitteeData = (importedCommittees: StaffCommittee[]) => {
    setCommittees(importedCommittees);
    localStorage.setItem('kpmbp_smarthub_committees', JSON.stringify(importedCommittees));
    saveCommitteesToFirestore(importedCommittees).catch((err) => {
      console.warn('Penyimpanan jawatankuasa luar talian:', err);
    });
  };

  const handleResetStaffData = () => {
    setStaffList(INITIAL_STAFF_DATA);
    localStorage.setItem('kpmbp_smarthub_staff', JSON.stringify(INITIAL_STAFF_DATA));
    saveStaffListToFirestore(INITIAL_STAFF_DATA).catch(() => {});
  };

  const handleResetCommitteeData = () => {
    const defaultComm = generateDefaultCommitteesForStaff(staffList);
    setCommittees(defaultComm);
    localStorage.setItem('kpmbp_smarthub_committees', JSON.stringify(defaultComm));
    saveCommitteesToFirestore(defaultComm).catch(() => {});
  };

  // Get unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    staffList.forEach((s) => {
      if (s.DepartmentID && s.DepartmentID.trim()) {
        depts.add(s.DepartmentID.trim());
      }
    });
    return ['Semua', ...Array.from(depts).sort()];
  }, [staffList]);

  // Precompute searchable terms for fast indexed search
  const indexedStaffList = useMemo(() => {
    return staffList.map((staff) => {
      const stateName = getDistrictState(staff.DaerahAsal || '');
      const searchableParts = [
        staff.Nama || '',
        staff.ID || '',
        staff.staff_id || '',
        staff.Jawatan || '',
        staff.Bahagian || '',
        staff.DepartmentID || '',
        staff.Unit || '',
        staff.Sambungan || '',
        staff.Gred || staff.grade || '',
        staff.Email || '',
        staff.NoBilik || '',
        staff.Kelulusan || '',
        staff.Pengkhususan || '',
        stateName
      ];

      const searchableText = searchableParts.join(' ').toLowerCase().replace(/\s+/g, '');
      const platesNoSpace = [
        (staff.NoPlat || '').toLowerCase().replace(/\s+/g, ''),
        (staff.PlatNo1 || '').toLowerCase().replace(/\s+/g, ''),
        (staff.PlatNo2 || '').toLowerCase().replace(/\s+/g, ''),
        (staff.PlatNo3 || '').toLowerCase().replace(/\s+/g, ''),
        (staff.PlatMotor1 || '').toLowerCase().replace(/\s+/g, ''),
        (staff.PlatMotor2 || '').toLowerCase().replace(/\s+/g, '')
      ].filter(Boolean);

      return {
        staff,
        searchableText,
        platesNoSpace
      };
    });
  }, [staffList]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return indexedStaffList
      .filter(({ staff, searchableText, platesNoSpace }) => {
        if (debouncedSearchQuery) {
          const qNoSpace = debouncedSearchQuery.toLowerCase().replace(/\s+/g, '');
          const matchesQuery =
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

  // Smart Search Multi-Category Matcher
  const smartSearchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return {
        hasQuery: false,
        staff: [],
        contacts: [],
        portals: [],
        calendar: [],
        rules: [],
        committees: []
      };
    }

    const q = debouncedSearchQuery.toLowerCase().trim();

    const matchedContacts = KEY_CAMPUS_CONTACTS.filter(c => 
      c.department.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.extension && c.extension.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );

    const matchedPortals = QUICK_PORTAL_LINKS.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      p.audience.toLowerCase().includes(q)
    );

    const matchedCalendar = CALENDAR_EVENTS.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.dateRange.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
    );

    const matchedRules = COLLEGE_RULES.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.desc.toLowerCase().includes(q) ||
      r.details.some(d => d.toLowerCase().includes(q))
    );

    const matchedCommittees = committees.filter(c =>
      c.jawatankuasa.toLowerCase().includes(q) ||
      c.peranan.toLowerCase().includes(q) ||
      (c.staff_nama && c.staff_nama.toLowerCase().includes(q)) ||
      (c.peringkat && c.peringkat.toLowerCase().includes(q))
    ).slice(0, 8);

    return {
      hasQuery: true,
      staff: filteredStaff,
      contacts: matchedContacts,
      portals: matchedPortals,
      calendar: matchedCalendar,
      rules: matchedRules,
      committees: matchedCommittees
    };
  }, [debouncedSearchQuery, filteredStaff, committees]);

  const totalResultsCount = 
    smartSearchResults.staff.length +
    smartSearchResults.contacts.length +
    smartSearchResults.portals.length +
    smartSearchResults.calendar.length +
    smartSearchResults.rules.length +
    smartSearchResults.committees.length;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDivision('Semua');
    setSelectedDepartment('Semua');
  };

  // Get count stats
  const totalStaff = staffList.length;
  const supportStaff = staffList.filter(s => s.Bahagian !== 'Akademik').length;
  const academicStaff = staffList.filter(s => s.Bahagian === 'Akademik').length;

  // Filtered committees by peringkat
  const filteredCommittees = useMemo(() => {
    if (selectedCommitteePeringkat === 'Semua') return committees;
    return committees.filter(c => c.peringkat === selectedCommitteePeringkat);
  }, [committees, selectedCommitteePeringkat]);

  // Unique committee peringkat
  const committeePeringkats = useMemo(() => {
    const set = new Set<string>();
    committees.forEach(c => {
      if (c.peringkat && c.peringkat.trim()) set.add(c.peringkat.trim());
    });
    return ['Semua', ...Array.from(set).sort()];
  }, [committees]);

  // Render Dedicated Admin Console when active
  if (isAdminConsoleOpen) {
    return (
      <>
        <AdminConsole
          currentAdmin={currentAdmin}
          onClose={() => setIsAdminConsoleOpen(false)}
          onLogout={handleAdminLogout}
          staffList={staffList}
          onAddNewStaff={handleAddNewStaff}
          onEditStaff={(stf) => {
            setEditingStaff(stf);
            setIsAddEditOpen(true);
          }}
          onDeleteStaff={handleDeleteStaff}
          committeeList={committees}
          config={syncConfig}
          onSaveConfig={handleSaveConfig}
          onSyncNow={handleSyncNow}
          isSyncing={isSyncing}
          onImportStaffData={(imported) => saveStaffList(imported)}
          onImportCommitteeData={handleImportCommitteeData}
          onResetStaffData={handleResetStaffData}
          onResetCommitteeData={handleResetCommitteeData}
          onInstallPWA={handleInstallPWA}
          canInstallPWA={!isPwaInstalled}
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
      </>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      
      {/* Ambient Visual Background Elements */}
      <div className="mesh-blob blob-1"></div>
      <div className="mesh-blob blob-2"></div>
      <div className="mesh-blob blob-3"></div>

      {/* Primary Glassmorphic Header */}
      <header className="glass-panel sticky top-0 z-40 px-4 md:px-6 py-3.5 border-b border-white/50 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          
          {/* Logo & Platform Info with Official KPMBP SmartHub Branding */}
          <button
            type="button"
            onClick={handleGoHome}
            title="Kembali ke Halaman Utama KPMBP SmartHub"
            aria-label="KPMBP SmartHub — Pusat Rujukan Maklumat Warga KPMBP"
            className="flex items-center gap-3.5 text-left cursor-pointer group focus:outline-hidden transition-opacity hover:opacity-95 active:scale-[0.99]"
          >
            <img
              src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/KPMBPSmartHub/favicon.svg"
              alt="Logo KPMBP SmartHub"
              className="w-11 h-11 object-contain drop-shadow-sm rounded-xl shrink-0 group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-black text-gray-950 text-lg md:text-xl tracking-tight leading-tight">
                  KPMBP <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent">SmartHub</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-bold tracking-wide">Pusat Rujukan Maklumat Warga KPMBP</p>
            </div>
          </button>

          {/* Public Navigation Items */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-2xs">
              <button
                onClick={() => setActiveTab('hub')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'hub'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Utama</span>
              </button>
              <button
                onClick={() => setActiveTab('directory')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'directory'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Direktori Staf</span>
              </button>
              <button
                onClick={() => setActiveTab('kampus')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'kampus'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Kampus</span>
              </button>
              <button
                onClick={() => setActiveTab('akademik')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'akademik'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Akademik</span>
              </button>
              <button
                onClick={() => setActiveTab('dokumen')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dokumen'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Dokumen</span>
              </button>
              <button
                onClick={() => setActiveTab('makluman')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'makluman'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-rose-500" />
                <span>Makluman</span>
              </button>
              <button
                onClick={() => setActiveTab('komuniti')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'komuniti'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Komuniti & JK</span>
              </button>
            </div>

            {/* PWA App Install Button */}
            {!isPwaInstalled && (
              <button
                onClick={handleInstallPWA}
                title="Pasang aplikasi KPMBP SmartHub"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold border border-slate-200/70 shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pasang App</span>
              </button>
            )}

            {/* Active Admin Pill */}
            {isAdminMode && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 shrink-0">
                <button
                  onClick={() => setIsAdminConsoleOpen(true)}
                  title="Buka Admin Console"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black border border-amber-300 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Admin Console</span>
                </button>
                <button
                  onClick={handleAdminLogout}
                  title="Tamat Mod Admin"
                  className="px-2 py-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 relative z-10">
        
        {/* Penyelarasan Maklumat Banner (Non-technical fallback notification) */}
        {syncError && (
          <div className="bg-amber-50/90 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs text-left">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-extrabold text-xs uppercase tracking-wide text-amber-950">Pusat Rujukan Maklumat KPMBP</p>
                <p className="text-xs text-amber-800 mt-0.5">Memaparkan maklumat daripada arkib rasmi kolej.</p>
              </div>
            </div>
            <button
              onClick={() => fetchStaffFromGAS(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Muat Semula
            </button>
          </div>
        )}

        {/* =========================================================================
            SECTION 1: SMART SEARCH BAR (Always present and most prominent interaction)
           ========================================================================= */}
        <section className="glass-panel rounded-3xl p-5 md:p-7 border border-white/60 shadow-xs relative overflow-hidden bg-gradient-to-br from-white/95 via-indigo-50/30 to-white/90 text-left">
          <div className="max-w-4xl mx-auto space-y-4">
            
            <div>
              <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Pusat Rujukan Maklumat Warga KPMBP
              </h2>
            </div>

            {/* Prominent Smart Search Input */}
            <div className="relative">
              <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-indigo-600 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔎 Cari maklumat KPMBP (nama staf, jawatan, no. sambungan, portal, warden, takwim, jadual, gred)..."
                className="w-full pl-12 pr-11 py-3.5 md:py-4 bg-white border-2 border-indigo-200/80 rounded-2xl text-xs md:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-600 focus:outline-hidden transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
                  title="Padam carian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Access Pills (Rujukan Pantas) */}
            <div className="pt-1">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-indigo-500" />
                  Rujukan Pantas:
                </span>
                
                <button
                  onClick={() => { setActiveTab('directory'); resetFilters(); }}
                  className="px-3 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl font-bold border border-slate-200/80 shadow-2xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-3 h-3 text-indigo-600" />
                  <span>Direktori Staf</span>
                </button>

                <button
                  onClick={() => { setActiveTab('akademik'); }}
                  className="px-3 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl font-bold border border-slate-200/80 shadow-2xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>Kalendar Akademik</span>
                </button>

                <button
                  onClick={() => { setActiveTab('directory'); setSearchQuery('jadual'); }}
                  className="px-3 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-xl font-bold border border-slate-200/80 shadow-2xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-purple-600" />
                  <span>Jadual Waktu</span>
                </button>

                <button
                  onClick={() => { setActiveTab('kampus'); }}
                  className="px-3 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl font-bold border border-slate-200/80 shadow-2xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3 h-3 text-rose-600" />
                  <span>Direktori Telefon</span>
                </button>

                <button
                  onClick={() => { setActiveTab('akademik'); }}
                  className="px-3 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-xl font-bold border border-slate-200/80 shadow-2xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3 text-amber-600" />
                  <span>Portal Akademik (SPMP)</span>
                </button>

                <button
                  onClick={() => { setActiveTab('kampus'); }}
                  className="px-3 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl font-bold border border-slate-200/80 shadow-2xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3 text-blue-600" />
                  <span>Warden Asrama</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            SEARCH RESULTS VIEW (When query is active, display aggregated matches)
           ========================================================================= */}
        {smartSearchResults.hasQuery ? (
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  Hasil Carian untuk "{debouncedSearchQuery}" ({totalResultsCount})
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Carian pintar merangkumi direktori staf, portal, takwim, kontak kampus, panduan dan jawatankuasa.
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Kosongkan Carian</span>
              </button>
            </div>

            {totalResultsCount === 0 ? (
              /* Global Empty State */
              <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 border border-slate-200 shadow-sm bg-white/70">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-base">Tiada maklumat tersedia buat masa ini.</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Tiada padanan ditemui untuk "{debouncedSearchQuery}". Sila cuba nama staf, jawatan, atau kata kunci lain.
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  Padam Saringan
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* 1. Staff Matches */}
                {smartSearchResults.staff.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        Kakitangan & Pensyarah ({smartSearchResults.staff.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                      {smartSearchResults.staff.map((staff) => (
                        <StaffCard
                          key={staff.ID}
                          staff={staff}
                          onClick={(stf) => setSelectedStaff(stf)}
                          isAdminMode={false}
                          onEdit={() => {}}
                          onOpenCommittee={(stf) => setCommitteeStaff(stf)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Campus Contacts & Warden Matches */}
                {smartSearchResults.contacts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4 text-rose-600" />
                      Talian Bantuan Kampus & Warden ({smartSearchResults.contacts.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {smartSearchResults.contacts.map((contact) => (
                        <div key={contact.id} className="p-4 glass-card rounded-2xl border border-white/60 shadow-2xs space-y-2">
                          <h5 className="font-black text-slate-900 text-xs">{contact.department}</h5>
                          <p className="text-[11px] text-slate-500 font-semibold">{contact.role}</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <span>{contact.phone}</span>
                            {contact.extension && (
                              <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                ({contact.extension})
                              </span>
                            )}
                          </div>
                          <div className="pt-2 flex gap-2">
                            <a
                              href={`tel:${contact.phone}`}
                              className="py-1 px-3 bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs"
                            >
                              <PhoneCall className="w-3 h-3 text-indigo-600" /> Hubungi
                            </a>
                            <a
                              href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1 shadow-2xs"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Portals Matches */}
                {smartSearchResults.portals.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-purple-600" />
                      Portal Akademik & Sistem Rasmi ({smartSearchResults.portals.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {smartSearchResults.portals.map((portal) => (
                        <div key={portal.id} className="p-4 glass-card rounded-2xl border border-white/60 shadow-2xs flex items-center justify-between gap-3">
                          <div>
                            <h5 className="font-black text-slate-900 text-xs">{portal.title}</h5>
                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{portal.desc}</p>
                          </div>
                          <a
                            href={portal.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs"
                          >
                            <span>Buka</span> <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Calendar Matches */}
                {smartSearchResults.calendar.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Takwim Akademik & Tarikh Penting ({smartSearchResults.calendar.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {smartSearchResults.calendar.map((event) => (
                        <div key={event.id} className="p-3.5 glass-card rounded-2xl border border-white/60 shadow-2xs flex items-center justify-between gap-3">
                          <div>
                            <h5 className="font-black text-slate-900 text-xs">{event.title}</h5>
                            <p className="text-[11px] text-slate-500 font-bold mt-0.5">{event.dateRange}</p>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {event.type.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Committee Matches */}
                {smartSearchResults.committees.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600" />
                      Jawatankuasa Kolej ({smartSearchResults.committees.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {smartSearchResults.committees.map((c, i) => (
                        <div key={c.id || i} className="p-3.5 glass-card rounded-2xl border border-white/60 shadow-2xs">
                          <h5 className="font-black text-slate-900 text-xs">{c.jawatankuasa}</h5>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600 font-semibold">
                            <span>Peranan: <strong className="text-indigo-700">{c.peranan}</strong></span>
                            {c.staff_nama && <span>{c.staff_nama}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
              PRIMARY TAB VIEW SWITCHER
             ========================================================================= */
          <>
            {/* VIEW A: UTAMA (SMARTHUB HOMEPAGE) */}
            {activeTab === 'hub' && (
              <div className="space-y-8">
                
                {/* 1. MAKLUMAT UTAMA (6 Core Categories Grid) */}
                <section className="space-y-4 text-left">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Maklumat Utama KPMBP SmartHub
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                    
                    {/* Card 1: DIREKTORI STAF */}
                    <div 
                      onClick={() => setActiveTab('directory')}
                      className="glass-card p-5.5 rounded-3xl border border-white/60 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            Direktori Staf
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                            Cari pensyarah dan kakitangan KPMBP
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>Buka Direktori</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 2: KAMPUS & FASILITI */}
                    <div 
                      onClick={() => setActiveTab('kampus')}
                      className="glass-card p-5.5 rounded-3xl border border-white/60 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            Kampus & Fasiliti
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                            Cari lokasi, jabatan dan nombor untuk dihubungi
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                        <span>Lihat Kampus</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 3: AKADEMIK & TAKWIM */}
                    <div 
                      onClick={() => setActiveTab('akademik')}
                      className="glass-card p-5.5 rounded-3xl border border-white/60 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                            Akademik & Takwim
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                            Takwim, jadual dan portal akademik
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                        <span>Rujuk Akademik</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 4: PANDUAN & DOKUMEN */}
                    <div 
                      onClick={() => setActiveTab('dokumen')}
                      className="glass-card p-5.5 rounded-3xl border border-white/60 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                            Panduan & Dokumen
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                            Panduan, peraturan dan dokumen rujukan
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
                        <span>Lihat Panduan</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 5: MAKLUMAN & HEBAHAN */}
                    <div 
                      onClick={() => setActiveTab('makluman')}
                      className="glass-card p-5.5 rounded-3xl border border-white/60 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                            Makluman & Hebahan
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                            Hebahan dan maklumat terkini KPMBP
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
                        <span>Lihat Hebahan</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 6: KOMUNITI & JAWATANKUASA */}
                    <div 
                      onClick={() => setActiveTab('komuniti')}
                      className="glass-card p-5.5 rounded-3xl border border-white/60 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                            Komuniti & Jawatankuasa
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                            Kelab, persatuan dan jawatankuasa KPMBP
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                        <span>Lihat Komuniti</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                  </div>
                </section>

                {/* 2. DIREKTORI STAF DISCOVERY PREVIEW */}
                <section className="space-y-4 text-left pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        Direktori Staf & Tenaga Pengajar ({filteredStaff.length})
                      </h3>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {(['Semua', 'Pengurusan', 'Akademik', 'Sokongan Akademik', 'Pentadbiran'] as DivisionType[]).map((div) => {
                        const isActive = selectedDivision === div;
                        return (
                          <button
                            key={div}
                            onClick={() => setSelectedDivision(div)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {div}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Staff Grid */}
                  {filteredStaff.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                      {filteredStaff.slice(0, 12).map((staff) => (
                        <StaffCard
                          key={staff.ID}
                          staff={staff}
                          onClick={(stf) => setSelectedStaff(stf)}
                          isAdminMode={false}
                          onEdit={() => {}}
                          onOpenCommittee={(stf) => setCommitteeStaff(stf)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                      <p className="text-xs text-slate-500 font-semibold">Tiada maklumat tersedia buat masa ini.</p>
                    </div>
                  )}

                  {filteredStaff.length > 12 && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setActiveTab('directory')}
                        className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-700 rounded-2xl text-xs font-black border border-indigo-200 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <span>Lihat Semua {filteredStaff.length} Kakitangan & Pensyarah</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </section>

              </div>
            )}

            {/* VIEW B: DIREKTORI STAF (Full Directory View) */}
            {activeTab === 'directory' && (
              <div className="space-y-6 text-left">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-indigo-600" />
                      Direktori Rasmi Kakitangan & Pensyarah
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Cari mengikut nama, jawatan, bahagian, unit, nombor sambungan atau gred.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                      {filteredStaff.length} Rekod Ditemui
                    </span>
                  </div>
                </div>

                {/* Filter and selector row */}
                <div className="glass-panel p-4 rounded-2xl border border-white/60 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  {/* Division tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {(['Semua', 'Pengurusan', 'Akademik', 'Sokongan Akademik', 'Pentadbiran'] as DivisionType[]).map((div) => {
                      const isActive = selectedDivision === div;
                      const count = div === 'Semua' ? staffList.length : staffList.filter(s => s.Bahagian === div).length;
                      return (
                        <button
                          key={div}
                          onClick={() => setSelectedDivision(div)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span>{div}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Department selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      <option value="Semua">Semua Jabatan</option>
                      {uniqueDepartments.filter(d => d !== 'Semua').map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>

                    {(selectedDivision !== 'Semua' || selectedDepartment !== 'Semua') && (
                      <button
                        onClick={resetFilters}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                        title="Set Semula Saringan"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Staff grid */}
                {filteredStaff.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                    {filteredStaff.map((staff) => (
                      <StaffCard
                        key={staff.ID}
                        staff={staff}
                        onClick={(stf) => setSelectedStaff(stf)}
                        isAdminMode={false}
                        onEdit={() => {}}
                        onOpenCommittee={(stf) => setCommitteeStaff(stf)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                    <p className="text-sm font-bold text-slate-700">Tiada maklumat tersedia buat masa ini.</p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Set Semula Saringan
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW C: KAMPUS */}
            {activeTab === 'kampus' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Kampus, Peta Lokasi & Direktori Telefon
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Panduan fasiliti fizikal, nombor talian bantuan, kaunter pentadbiran dan warden bertugas kolej.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/60 shadow-xs">
                  <CampusReferenceHub initialTab="peta" />
                </div>
              </div>
            )}

            {/* VIEW D: AKADEMIK */}
            {activeTab === 'akademik' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Akademik, Takwim & Portal Pembelajaran
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Takwim semester I sesi 2026/2027, jadual peperiksaan, cuti semester, dan pautan sistem SPMP/SISPEN/Teams.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/60 shadow-xs">
                  <CampusReferenceHub initialTab="takwim" />
                </div>
              </div>
            )}

            {/* VIEW E: DOKUMEN & PANDUAN */}
            {activeTab === 'dokumen' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    Panduan Rasmi, Polisi & Peraturan Kolej
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Ketetapan etika pemakaian staf & pelajar, peraturan keluar masuk kampus/homeleave dan tatatertib perpustakaan.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/60 shadow-xs">
                  <CampusReferenceHub initialTab="panduan" />
                </div>
              </div>
            )}

            {/* VIEW F: MAKLUMAN */}
            {activeTab === 'makluman' && (
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Bell className="w-5 h-5 text-rose-600" />
                    Makluman & Hebahan Semasa
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Pengumuman terkini berkaitan sesi akademik, pentadbiran, kebajikan asrama dan aktiviti kolej.
                  </p>
                </div>

                {CAMPUS_ANNOUNCEMENTS.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {CAMPUS_ANNOUNCEMENTS.map((ann) => (
                      <div 
                        key={ann.id}
                        className="glass-card p-5.5 rounded-3xl border border-white/60 shadow-xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${
                              ann.urgent 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              {ann.badge || ann.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{ann.date}</span>
                          </div>
                          <h4 className="font-black text-slate-900 text-sm leading-snug">{ann.title}</h4>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{ann.summary}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>{ann.category}</span>
                          <span className="text-indigo-600 font-black flex items-center gap-0.5">KPMBP Rasmi</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel p-12 text-center rounded-3xl border border-slate-200 bg-white/70">
                    <p className="text-xs text-slate-500 font-semibold">Tiada maklumat tersedia buat masa ini.</p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW G: KOMUNITI & JAWATANKUASA */}
            {activeTab === 'komuniti' && (
              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Jawatankuasa, Kelab & Komuniti Kolej
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Struktur jawatankuasa rasmi, persatuan mahasiswa, kelab minat, dan pengurusan komuniti kolej.
                    </p>
                  </div>
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                    {filteredCommittees.length} Jawatankuasa
                  </span>
                </div>

                {/* Peringkat Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {committeePeringkats.map((per) => {
                    const isActive = selectedCommitteePeringkat === per;
                    return (
                      <button
                        key={per}
                        onClick={() => setSelectedCommitteePeringkat(per)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-purple-600 text-white font-black shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {per}
                      </button>
                    );
                  })}
                </div>

                {/* Committees List */}
                {filteredCommittees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCommittees.slice(0, 30).map((comm, idx) => (
                      <div 
                        key={comm.id || idx}
                        className="glass-card p-4.5 rounded-2xl border border-white/60 shadow-2xs space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                              {comm.peringkat || 'Kolej'}
                            </span>
                            {comm.tahun && (
                              <span className="text-[10px] text-slate-400 font-bold">{comm.tahun}</span>
                            )}
                          </div>
                          <h4 className="font-black text-slate-900 text-xs leading-snug">{comm.jawatankuasa}</h4>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Peranan:</span>
                          <span className="font-extrabold text-indigo-700">{comm.peranan}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel p-12 text-center rounded-3xl border border-slate-200 bg-white/70">
                    <p className="text-xs text-slate-500 font-semibold">Tiada maklumat tersedia buat masa ini.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/40 py-8 mt-16 text-center text-xs text-slate-500 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          
          {/* Ringkasan Statistik Direktori Kolej */}
          <div className="bg-white/60 border border-slate-200/60 rounded-3xl p-5 shadow-2xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-left">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Statistik Warga KPMBP SmartHub
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Ringkasan data kakitangan dan kepakaran Kolej Profesional MARA Bandar Penawar
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

            {/* Non-intrusive internal admin entry point */}
            {!isAdminMode ? (
              <button
                type="button"
                onClick={handleOpenAdmin}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100/70 text-[11px] font-medium"
                title="Akses Pentadbir"
              >
                <Lock className="w-3 h-3" />
                <span>Akses Pentadbir</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminConsoleOpen(true)}
                  className="inline-flex items-center gap-1.5 text-amber-800 hover:text-amber-950 transition-colors cursor-pointer py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold"
                  title="Buka Admin Console"
                >
                  <Settings className="w-3 h-3 text-amber-600" />
                  <span>Admin Console</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="text-slate-400 hover:text-rose-600 text-[11px] font-medium cursor-pointer"
                  title="Log Keluar"
                >
                  Log Keluar
                </button>
              </div>
            )}
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
          setIsAdminConsoleOpen(true);
        }}
      />

    </div>
  );
}
