/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UploadCloud, 
  Download, 
  Link2, 
  Settings, 
  ArrowLeft, 
  LogOut, 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink, 
  Filter, 
  X, 
  FileSpreadsheet, 
  RotateCcw,
  Key,
  Database,
  Smartphone
} from 'lucide-react';
import { Staff, StaffCommittee, SyncConfig, AuthorizedAdmin, DivisionType } from '../types';
import { GAS_CONFIG } from '../config/gasConfig';
import { saveStaffListToFirestore, saveCommitteesToFirestore } from '../config/firebase';
import { getAuthorizedAdmins, addAuthorizedAdmin, removeAuthorizedAdmin } from '../utils/adminAuthService';

interface AdminConsoleProps {
  currentAdmin: AuthorizedAdmin | null;
  onClose: () => void; // Kembali ke SmartHub
  onLogout: () => void; // Log Keluar Admin
  // Staff CRUD
  staffList: Staff[];
  onAddNewStaff: () => void;
  onEditStaff: (staff: Staff) => void;
  onDeleteStaff: (id: string) => void;
  // Committee
  committeeList: StaffCommittee[];
  // Sync & GAS Config
  config: SyncConfig;
  onSaveConfig: (newConfig: Partial<SyncConfig>) => void;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
  // CSV Import / Export
  onImportStaffData: (importedList: Staff[]) => void;
  onImportCommitteeData: (importedList: StaffCommittee[]) => void;
  onResetStaffData: () => void;
  onResetCommitteeData: () => void;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

// CSV escaping helper for quotes and special characters
function escapeCSVCell(cell: any): string {
  if (cell === null || cell === undefined) return '';
  const str = String(cell).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Trigger CSV download in browser with UTF-8 BOM
function downloadCSVFile(csvContent: string, fileName: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to parse CSV/TSV text respecting quotes
function parseCSVToRows(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === '\t') {
        row.push(field.trim());
        field = '';
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        row.push(field.trim());
        lines.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field.trim());
    lines.push(row);
  }
  return lines.filter((r) => r.some((cell) => cell.length > 0));
}

type AdminTab = 'overview' | 'staff' | 'committee' | 'import_csv' | 'export_csv' | 'google_sheets' | 'settings';

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentAdmin,
  onClose,
  onLogout,
  staffList,
  onAddNewStaff,
  onEditStaff,
  onDeleteStaff,
  committeeList,
  config,
  onSaveConfig,
  onSyncNow,
  isSyncing,
  onImportStaffData,
  onImportCommitteeData,
  onResetStaffData,
  onResetCommitteeData,
  onInstallPWA,
  canInstallPWA = false,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Staff Search & Filter State
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffDivisionFilter, setStaffDivisionFilter] = useState<DivisionType>('Semua');

  // Committee Search State
  const [committeeSearchQuery, setCommitteeSearchQuery] = useState('');

  // Google Sheets Config Form State
  const [apiUrl, setApiUrl] = useState(config.apiUrl || GAS_CONFIG.webAppUrl);
  const [sheetId, setSheetId] = useState(config.sheetId || GAS_CONFIG.spreadsheetId);
  const [scriptId, setScriptId] = useState(config.scriptId || GAS_CONFIG.scriptId);
  const [sheetName, setSheetName] = useState(config.sheetName || 'Staff');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // CSV Import State
  const [importType, setImportType] = useState<'staff' | 'committee'>('staff');
  const [rawCsvText, setRawCsvText] = useState('');
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Authorized Admin State
  const [authorizedAdmins, setAuthorizedAdmins] = useState<AuthorizedAdmin[]>(() => getAuthorizedAdmins());
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminIc, setNewAdminIc] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminMgmtStatus, setAdminMgmtStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Filtered Staff for Management Table
  const filteredStaffList = useMemo(() => {
    const q = staffSearchQuery.toLowerCase().trim();
    return staffList.filter((s) => {
      if (staffDivisionFilter !== 'Semua' && s.Bahagian !== staffDivisionFilter) {
        return false;
      }
      if (!q) return true;
      const searchable = [
        s.Nama,
        s.ID,
        s.staff_id,
        s.Jawatan,
        s.Bahagian,
        s.DepartmentID,
        s.Gred,
        s.Telefon,
        s.Email,
        s.NoPlat,
        s.PlatNo1,
        s.PlatNo2,
      ]
        .filter(Boolean)
        .map(v => String(v).toLowerCase())
        .join(' ');
      return searchable.includes(q);
    });
  }, [staffList, staffSearchQuery, staffDivisionFilter]);

  // Filtered Committee for Table
  const filteredCommitteeList = useMemo(() => {
    const q = committeeSearchQuery.toLowerCase().trim();
    if (!q) return committeeList;
    return committeeList.filter((c) => {
      const text = [c.staff_id, c.staff_nama, c.jawatankuasa, c.peranan, c.peringkat, c.tahun, c.catatan]
        .filter(Boolean)
        .map(v => String(v).toLowerCase())
        .join(' ');
      return text.includes(q);
    });
  }, [committeeList, committeeSearchQuery]);

  // Test Google Sheets Connection
  const handleTestConnection = async () => {
    const urlToTest = apiUrl || GAS_CONFIG.webAppUrl;
    if (!urlToTest) {
      setTestStatus('failed');
      setTestMessage('Sila masukkan URL Web App Google Apps Script.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Menghubungi endpoint Google Apps Script...');
    try {
      let res: Response;
      try {
        const proxyUrl = `/api/gas-proxy?url=${encodeURIComponent(urlToTest)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        res = await fetch(proxyUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timer);
      } catch {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        res = await fetch(urlToTest, { method: 'GET', signal: controller.signal });
        clearTimeout(timer);
      }

      if (res.ok || res.status === 200 || res.type === 'opaque') {
        setTestStatus('success');
        setTestMessage('✓ Sambungan ke Google Apps Script / Google Sheets berjaya disahkan.');
        onSaveConfig({ isConnected: true, apiUrl: urlToTest });
      } else {
        throw new Error('Respons tidak sah daripada endpoint.');
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(`⚠ Ralat menyambung ke Google Apps Script: ${err.message || 'Sila pastikan Web App disebar dengan kebenaran "Anyone"}'}`);
    }
  };

  // Save Google Sheets Config
  const handleSaveSheetsConfig = () => {
    onSaveConfig({
      apiUrl,
      sheetId,
      scriptId,
      sheetName,
    });
    alert('Konfigurasi Google Sheets berjaya disimpan.');
  };

  // CSV Import Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text || '');
      setImportStatusMessage({ type: 'info', text: `Fail "${file.name}" sedia untuk diimport.` });
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    if (!rawCsvText.trim()) {
      setImportStatusMessage({ type: 'error', text: 'Sila muat naik fail atau tampal teks CSV/TSV terlebih dahulu.' });
      return;
    }

    try {
      if (importType === 'staff') {
        const rows = parseCSVToRows(rawCsvText);
        if (rows.length < 2) {
          setImportStatusMessage({ type: 'error', text: 'Teks CSV mestilah mengandungi sekurang-kurangnya baris tajuk dan 1 rekod data.' });
          return;
        }

        const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const findCol = (keys: string[], fallback: number): number => {
          for (const k of keys) {
            const idx = headers.findIndex(h => h === k.toLowerCase());
            if (idx !== -1) return idx;
          }
          return fallback;
        };

        const idIdx = findCol(['staffid', 'id', 'staff_id', 'no staf'], 1);
        const nameIdx = findCol(['nama', 'name', 'nama penuh'], 2);
        const katIdx = findCol(['kategori', 'bahagian'], 3);
        const jawatanIdx = findCol(['jawatan', 'position'], 4);
        const unitIdx = findCol(['unit', 'departmentid', 'jabatan'], 5);
        const kelulusanIdx = findCol(['kelulusan', 'qualification'], 8);
        const pengkhususanIdx = findCol(['pengkhususan', 'specialisation'], 9);
        const daerahIdx = findCol(['daerahasal', 'daerah asal', 'asal'], 10);
        const telIdx = findCol(['telefon', 'phone'], 11);
        const sambIdx = findCol(['sambungan', 'ext'], 12);
        const waIdx = findCol(['whatsapp'], 13);
        const emailIdx = findCol(['email', 'emel'], 14);
        const gredIdx = findCol(['gred', 'grade'], 19);
        const lahirIdx = findCol(['tahun lahir', 'tahunlahir'], 20);
        const plat1Idx = findCol(['platno1', 'noplat', 'plat 1'], 21);
        const plat2Idx = findCol(['platno2', 'plat 2'], 22);

        const newStaffList: Staff[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          const getVal = (idx: number): string => (idx >= 0 && row[idx] !== undefined ? row[idx].trim() : '');
          
          const nama = getVal(nameIdx);
          if (!nama) continue;

          const staffId = getVal(idIdx) || `ST${String(i).padStart(3, '0')}`;
          const p1 = getVal(plat1Idx);
          const p2 = getVal(plat2Idx);
          const allP = [p1, p2].filter(Boolean);

          newStaffList.push({
            ID: staffId.toUpperCase(),
            staff_id: staffId.toUpperCase(),
            Nama: nama,
            Bahagian: getVal(katIdx) || 'Akademik',
            Jawatan: getVal(jawatanIdx) || 'Pensyarah',
            DepartmentID: getVal(unitIdx) || 'JTM',
            Kelulusan: getVal(kelulusanIdx),
            Pengkhususan: getVal(pengkhususanIdx),
            DaerahAsal: getVal(daerahIdx),
            Telefon: getVal(telIdx),
            Sambungan: getVal(sambIdx),
            WhatsApp: getVal(waIdx),
            Email: getVal(emailIdx),
            Gred: getVal(gredIdx),
            grade: getVal(gredIdx),
            TahunLahir: getVal(lahirIdx),
            PlatNo1: p1,
            PlatNo2: p2,
            NoPlat: allP.join(', '),
            Sumber: 'CSV Import',
            Status: 'Aktif',
            LastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
            'URL Profil': '',
          });
        }

        if (newStaffList.length === 0) {
          setImportStatusMessage({ type: 'error', text: 'Tiada rekod sah dijumpai. Sila semak tajuk lajur CSV anda.' });
          return;
        }

        onImportStaffData(newStaffList);
        saveStaffListToFirestore(newStaffList).catch(console.warn);
        setImportStatusMessage({
          type: 'success',
          text: `✓ Berjaya mengimport ${newStaffList.length} rekod kakitangan & diselaraskan ke Firebase Firestore.`,
        });
        setRawCsvText('');
      } else {
        // Committee Import
        const rows = parseCSVToRows(rawCsvText);
        if (rows.length < 2) {
          setImportStatusMessage({ type: 'error', text: 'Teks CSV Jawatankuasa mestilah mengandungi tajuk lajur dan sekurang-kurangnya 1 rekod.' });
          return;
        }

        const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const findCol = (keys: string[], fallback: number): number => {
          for (const k of keys) {
            const idx = headers.findIndex(h => h === k.toLowerCase());
            if (idx !== -1) return idx;
          }
          return fallback;
        };

        const staffIdIdx = findCol(['staffid', 'staff_id', 'id'], 1);
        const nameIdx = findCol(['nama', 'name', 'staff_nama'], 2);
        const katIdx = findCol(['kategori', 'peringkat'], 3);
        const jawatanIdx = findCol(['jawatan', 'peranan'], 4);
        const unitIdx = findCol(['unit', 'jawatankuasa'], 5);
        const tahunIdx = findCol(['tahun', 'year'], 6);

        const newCommittees: StaffCommittee[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          const getVal = (idx: number): string => (idx >= 0 && row[idx] !== undefined ? row[idx].trim() : '');

          const staffId = getVal(staffIdIdx);
          const jk = getVal(unitIdx);
          if (!staffId && !jk) continue;

          newCommittees.push({
            id: `c-${staffId}-${i}`,
            staff_id: staffId.toUpperCase(),
            staff_nama: getVal(nameIdx),
            jawatankuasa: jk || 'Jawatankuasa Kolej',
            peranan: getVal(jawatanIdx) || 'Ahli',
            peringkat: getVal(katIdx) || 'Kolej',
            tahun: getVal(tahunIdx) || '2026',
          });
        }

        if (newCommittees.length === 0) {
          setImportStatusMessage({ type: 'error', text: 'Tiada rekod jawatankuasa sah dijumpai.' });
          return;
        }

        onImportCommitteeData(newCommittees);
        saveCommitteesToFirestore(newCommittees).catch(console.warn);
        setImportStatusMessage({
          type: 'success',
          text: `✓ Berjaya mengimport ${newCommittees.length} rekod jawatankuasa & disimpan ke Firestore.`,
        });
        setRawCsvText('');
      }
    } catch (err: any) {
      setImportStatusMessage({ type: 'error', text: `Ralat memproses CSV: ${err.message}` });
    }
  };

  // CSV Export Handlers
  const handleExportStaffCSV = () => {
    if (staffList.length === 0) {
      alert('Tiada data kakitangan untuk dieksport.');
      return;
    }

    const headers = [
      'Bil', 'StaffID', 'Nama', 'Kategori', 'Jawatan', 'Unit', 'Tahun',
      'Kelulusan', 'Pengkhususan', 'DaerahAsal', 'Telefon', 'Sambungan', 'WhatsApp',
      'Email', 'URL Profil', 'Sumber', 'LastSync', 'Gred', 'Tahun Lahir',
      'PlatNo1', 'PlatNo2', 'NoPlat'
    ];

    const rows = staffList.map((s, idx) => [
      s.Bil || String(idx + 1),
      s.ID || s.staff_id || '',
      s.Nama || '',
      s.Kategori || s.Bahagian || 'Akademik',
      s.Jawatan || '',
      s.Unit || s.DepartmentID || '',
      s.Tahun || '2026',
      s.Kelulusan || '',
      s.Pengkhususan || '',
      s.DaerahAsal || '',
      s.Telefon || '',
      s.Sambungan || '',
      s.WhatsApp || '',
      s.Email || '',
      s['URL Profil'] || '',
      s.Sumber || 'Sistem KPMBP',
      s.LastSync || '',
      s.Gred || s.grade || '',
      s.TahunLahir || s['Tahun Lahir'] || '',
      s.PlatNo1 || '',
      s.PlatNo2 || '',
      s.NoPlat || ''
    ]);

    const csvContent = [
      headers.map(escapeCSVCell).join(','),
      ...rows.map(r => r.map(escapeCSVCell).join(','))
    ].join('\r\n');

    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csvContent, `kpmbp_staf_data_${dateStr}.csv`);
  };

  const handleExportCommitteeCSV = () => {
    if (committeeList.length === 0) {
      alert('Tiada data jawatankuasa untuk dieksport.');
      return;
    }

    const headers = ['Bil', 'StaffID', 'Nama', 'Kategori', 'Jawatan', 'Unit', 'Tahun', 'Catatan'];
    const rows = committeeList.map((c, idx) => [
      String(idx + 1),
      c.staff_id || '',
      c.staff_nama || '',
      c.peringkat || 'Kolej',
      c.peranan || 'Ahli',
      c.jawatankuasa || '',
      c.tahun || '',
      c.catatan || ''
    ]);

    const csvContent = [
      headers.map(escapeCSVCell).join(','),
      ...rows.map(r => r.map(escapeCSVCell).join(','))
    ].join('\r\n');

    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csvContent, `kpmbp_jawatankuasa_data_${dateStr}.csv`);
  };

  const handleDownloadStaffTemplate = () => {
    const headers = [
      'Bil', 'StaffID', 'Nama', 'Kategori', 'Jawatan', 'Unit', 'Tahun',
      'Kelulusan', 'Pengkhususan', 'DaerahAsal', 'Telefon', 'Sambungan', 'WhatsApp',
      'Email', 'URL Profil', 'Sumber', 'LastSync', 'Gred', 'Tahun Lahir',
      'PlatNo1', 'PlatNo2'
    ];
    const sample = [
      [
        '1', 'ST001', 'Muhammad Fazly Bin Jamaluddin', 'Pengurusan', 'Pengarah', 'Pengurusan', '2026',
        '', '', 'Kuantan, Pahang', '013-9500149', '201', '60139500149',
        'fazly.jamaluddin@mara.gov.my', '', 'Sistem KPMBP', '2026-10-01 08:00', 'DG13', '',
        'WUL3110', 'WB1782D'
      ],
      [
        '2', 'ST002', 'Mohd Hakim Bin Hafiz', 'Pengurusan', 'Timb. Pengarah HEP', 'Pentadbiran', '2026',
        '', '', '', '018-3854235', '208', '60183854235',
        'hakim.hafiz@mara.gov.my', '', 'Sistem KPMBP', '2026-10-01 08:00', 'DG12', '1986',
        'SJ8684', ''
      ]
    ];
    const csvContent = [
      headers.map(escapeCSVCell).join(','),
      ...sample.map(r => r.map(escapeCSVCell).join(','))
    ].join('\r\n');
    downloadCSVFile(csvContent, 'templat_kakitangan_kpmbp.csv');
  };

  const handleDownloadCommitteeTemplate = () => {
    const headers = ['Bil', 'StaffID', 'Nama', 'Kategori', 'Jawatan', 'Unit', 'Tahun'];
    const sample = [
      ['1', 'ST001', 'Ts. Dr. Ahmad bin Abdullah', 'Pengurusan', 'Pengerusi', 'JK Pengurusan Kolej (JPK)', '2026'],
      ['2', 'ST002', 'Siti Aminah binti Kassim', 'Akademik', 'Setiausaha', 'JK Peperiksaan & Penilaian', '2026']
    ];
    const csvContent = [
      headers.map(escapeCSVCell).join(','),
      ...sample.map(r => r.map(escapeCSVCell).join(','))
    ].join('\r\n');
    downloadCSVFile(csvContent, 'templat_jawatankuasa_kpmbp.csv');
  };

  // Authorized Admin Handlers
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminIc.trim()) {
      setAdminMgmtStatus({ success: false, message: 'Sila masukkan emel MARA dan 4 digit terakhir nombor IC.' });
      return;
    }
    const res = addAuthorizedAdmin(newAdminEmail, newAdminIc, newAdminName);
    setAdminMgmtStatus(res);
    if (res.success) {
      setAuthorizedAdmins(getAuthorizedAdmins());
      setNewAdminEmail('');
      setNewAdminIc('');
      setNewAdminName('');
      setTimeout(() => setAdminMgmtStatus(null), 4000);
    }
  };

  const handleRemoveAdmin = (id: string) => {
    if (!confirm('Adakah anda pasti mahu membatalkan kebenaran admin ini?')) return;
    const res = removeAuthorizedAdmin(id);
    setAdminMgmtStatus(res);
    setAuthorizedAdmins(getAuthorizedAdmins());
    setTimeout(() => setAdminMgmtStatus(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Brand & Console Title */}
          <div className="flex items-center gap-3">
            <img
              src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/KPMBPSmartHub/favicon.svg"
              alt="Logo KPMBP SmartHub"
              className="w-9 h-9 object-contain drop-shadow-md rounded-xl shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">KPMBP SmartHub</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Sesi: <span className="text-slate-200 font-bold">{currentAdmin?.name || 'Master Administrator'}</span> {currentAdmin?.email ? `(${currentAdmin.email})` : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons: Kembali ke SmartHub & Log Keluar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Kembali ke paparan awam KPMBP SmartHub"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke SmartHub</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-bold border border-rose-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Tamatkan sesi admin dan log keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Console Body: Responsive Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-1.5">
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview (Ringkasan)</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all text-left cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>👥 Pengurusan Staf</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                {staffList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('committee')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all text-left cursor-pointer ${
                activeTab === 'committee'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>🏢 Jawatankuasa</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                {committeeList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('import_csv')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'import_csv'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span>📥 Import CSV</span>
            </button>

            <button
              onClick={() => setActiveTab('export_csv')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'export_csv'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>📤 Export CSV</span>
            </button>

            <button
              onClick={() => setActiveTab('google_sheets')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'google_sheets'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Link2 className="w-4 h-4 shrink-0" />
              <span>🔗 Google Sheets</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>⚙️ Tetapan Sistem</span>
            </button>
          </div>

          {/* Quick Sync Card in Sidebar */}
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Sync</span>
              <span className={`w-2 h-2 rounded-full ${config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            </div>
            <p className="text-xs text-slate-300 font-semibold truncate">
              {config.isConnected ? 'Tersambung (Google Sheets)' : 'Luar Talian'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Terakhir: {config.lastSyncTime || 'Belum pasti'}
            </p>
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyegerakkan...' : 'Penyamaan Segera'}</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 bg-slate-950/60 rounded-3xl border border-slate-800 p-5 md:p-7 shadow-xl space-y-6 text-left">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Ringkasan Sistem (Overview)</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Status data semasa pangkalan data kakitangan dan jawatankuasa KPMBP SmartHub.
                </p>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rekod Staf</span>
                  <p className="text-2xl font-black text-white">{staffList.length}</p>
                  <span className="text-[10px] text-indigo-400 font-medium">Kakitangan & Pensyarah</span>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Jawatankuasa</span>
                  <p className="text-2xl font-black text-emerald-400">{committeeList.length}</p>
                  <span className="text-[10px] text-emerald-400 font-medium">Keahlian Aktif</span>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Google Sheets</span>
                  <p className="text-lg font-black text-amber-400 truncate">{config.isConnected ? 'Tersambung' : 'Terkendala'}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Sync: {config.lastSyncTime || '-'}</span>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pangkalan Data</span>
                  <p className="text-lg font-black text-cyan-400">Firebase Firestore</p>
                  <span className="text-[10px] text-cyan-400 font-medium">Penyimpanan Kekal</span>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Tindakan Pantas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    onClick={onAddNewStaff}
                    className="p-4 bg-slate-900/80 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all text-left cursor-pointer group"
                  >
                    <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-white">Daftar Staf Baharu</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Buka borang pendaftaran staf baharu ke dalam direktori.</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('import_csv')}
                    className="p-4 bg-slate-900/80 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all text-left cursor-pointer group"
                  >
                    <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-white">Import Fail CSV</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Muat naik atau tampal data pukal CSV Kakitangan & Jawatankuasa.</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('export_csv')}
                    className="p-4 bg-slate-900/80 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all text-left cursor-pointer group"
                  >
                    <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl w-fit mb-2 group-hover:scale-105 transition-transform">
                      <Download className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-white">Eksport Salinan CSV</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Muat turun sandaran penuh pangkalan data dalam format CSV.</p>
                  </button>
                </div>
              </div>

              {/* Latest Staff Preview Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Pratonton Rekod Kakitangan Terkini</h3>
                  <button
                    onClick={() => setActiveTab('staff')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    Lihat Semua ({staffList.length}) →
                  </button>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3">ID Staf</th>
                        <th className="p-3">Nama</th>
                        <th className="p-3">Jawatan</th>
                        <th className="p-3">Bahagian</th>
                        <th className="p-3">Gred</th>
                        <th className="p-3 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                      {staffList.slice(0, 5).map((s) => (
                        <tr key={s.ID} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-400">{s.ID}</td>
                          <td className="p-3 font-bold text-white">{s.Nama}</td>
                          <td className="p-3 text-slate-300">{s.Jawatan}</td>
                          <td className="p-3 text-slate-400">{s.Bahagian}</td>
                          <td className="p-3 font-mono text-amber-400">{s.Gred || '-'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onEditStaff(s)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Sunting
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STAFF MANAGEMENT */}
          {activeTab === 'staff' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Pengurusan Rekod Kakitangan</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Senarai semua staf, pensyarah, dan kakitangan Kolej Profesional MARA Bandar Penawar.
                  </p>
                </div>
                <button
                  onClick={onAddNewStaff}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Staf Baharu</span>
                </button>
              </div>

              {/* Controls: Search & Division Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    placeholder="Cari nama, ID staf (cth: ST001), jawatan, gred, no. plat..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {staffSearchQuery && (
                    <button
                      onClick={() => setStaffSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(['Semua', 'Pengurusan', 'Akademik', 'Sokongan Akademik', 'Pentadbiran'] as DivisionType[]).map((div) => (
                    <button
                      key={div}
                      onClick={() => setStaffDivisionFilter(div)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        staffDivisionFilter === div
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-3">ID Staf</th>
                      <th className="p-3">Nama Penuh</th>
                      <th className="p-3">Jawatan</th>
                      <th className="p-3">Bahagian / Unit</th>
                      <th className="p-3">Gred</th>
                      <th className="p-3">No. Plat Kenderaan</th>
                      <th className="p-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {filteredStaffList.map((s) => (
                      <tr key={s.ID} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-400">{s.ID}</td>
                        <td className="p-3 font-bold text-white">{s.Nama}</td>
                        <td className="p-3 text-slate-300">{s.Jawatan}</td>
                        <td className="p-3 text-slate-400">{s.Bahagian} ({s.DepartmentID})</td>
                        <td className="p-3 font-mono text-amber-400">{s.Gred || '-'}</td>
                        <td className="p-3 font-mono text-slate-400">{s.NoPlat || s.PlatNo1 || '-'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEditStaff(s)}
                              className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Sunting rekod staf"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Adakah anda pasti mahu memadam staf: ${s.Nama} (${s.ID})?`)) {
                                  onDeleteStaff(s.ID);
                                }
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Padam rekod staf"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStaffList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                          Tiada rekod kakitangan dijumpai yang sepadan dengan carian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COMMITTEE MANAGEMENT */}
          {activeTab === 'committee' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Pengurusan Jawatankuasa & Unit Kolej</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Senarai keahlian dan peranan jawatankuasa bagi setiap staf KPMBP.
                  </p>
                </div>
                <span className="text-xs font-mono px-3 py-1 bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl font-bold">
                  {filteredCommitteeList.length} Rekod
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={committeeSearchQuery}
                  onChange={(e) => setCommitteeSearchQuery(e.target.value)}
                  placeholder="Cari nama staf, nama jawatankuasa, peranan (Pengerusi/Setiausaha), tahun..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {committeeSearchQuery && (
                  <button
                    onClick={() => setCommitteeSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Committee Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-3">Staff ID</th>
                      <th className="p-3">Nama Pegawai</th>
                      <th className="p-3">Nama Jawatankuasa / Unit</th>
                      <th className="p-3">Peranan</th>
                      <th className="p-3">Peringkat</th>
                      <th className="p-3">Tahun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                    {filteredCommitteeList.map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-400">{c.staff_id}</td>
                        <td className="p-3 font-bold text-white">{c.staff_nama || '-'}</td>
                        <td className="p-3 text-slate-200">{c.jawatankuasa}</td>
                        <td className="p-3 font-bold text-amber-400">{c.peranan}</td>
                        <td className="p-3 text-slate-400">{c.peringkat || 'Kolej'}</td>
                        <td className="p-3 font-mono text-slate-400">{c.tahun || '2026'}</td>
                      </tr>
                    ))}
                    {filteredCommitteeList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                          Tiada rekod jawatankuasa dijumpai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: IMPORT CSV */}
          {activeTab === 'import_csv' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Import Data Pukal (CSV / TSV)</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Muat naik fail CSV atau tampal data terus daripada hamparan Google Sheets atau Excel.
                </p>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 w-fit">
                <button
                  onClick={() => setImportType('staff')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    importType === 'staff'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Import Staf (Kakitangan)
                </button>
                <button
                  onClick={() => setImportType('committee')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    importType === 'committee'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Import Jawatankuasa (Unit)
                </button>
              </div>

              {/* Template Download Prompts */}
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Muat Turun Templat CSV Rasmi</h4>
                  <p className="text-[11px] text-slate-400">Gunakan templat ini untuk memastikan susunan lajur dan tajuk adalah tepat.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadStaffTemplate}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Templat Staf</span>
                  </button>
                  <button
                    onClick={handleDownloadCommitteeTemplate}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Templat Jawatankuasa</span>
                  </button>
                </div>
              </div>

              {/* Upload or Paste */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Pilih Fail CSV atau Tampal Teks:</label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>

                <textarea
                  rows={8}
                  value={rawCsvText}
                  onChange={(e) => setRawCsvText(e.target.value)}
                  placeholder={`Tampal kandungan CSV di sini (termasuk baris tajuk lajur)...\nContoh:\nBil,StaffID,Nama,Kategori,Jawatan,Unit,Tahun\n1,ST001,Ahmad bin Abdullah,Pengurusan,Pengarah,Pengurusan,2026`}
                  className="w-full p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Message */}
              {importStatusMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                  importStatusMessage.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : importStatusMessage.type === 'error'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : 'bg-indigo-950/40 border-indigo-800 text-indigo-300'
                }`}>
                  {importStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{importStatusMessage.text}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleProcessImport}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Sahkan & Simpan Rekod ke Pangkalan Data</span>
              </button>
            </div>
          )}

          {/* TAB 5: EXPORT CSV */}
          {activeTab === 'export_csv' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Eksport Salinan Pangkalan Data (CSV)</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Muat turun data semasa ke komputer dalam format CSV standard dengan pengekodan UTF-8.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Staff */}
                <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl w-fit">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-white">Eksport Data Kakitangan (Staff)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Mengandungi semua {staffList.length} rekod kakitangan merangkumi ID, nama, jawatan, bahagian, gred, maklumat perhubungan, dan nombor plat kenderaan.
                    </p>
                  </div>
                  <button
                    onClick={handleExportStaffCSV}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Muat Turun CSV Staf ({staffList.length} Rekod)</span>
                  </button>
                </div>

                {/* Export Committee */}
                <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl w-fit">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-white">Eksport Data Jawatankuasa (Committee)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Mengandungi semua {committeeList.length} rekod keahlian jawatankuasa kolej, peranan jawatan, peringkat, dan tahun.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCommitteeCSV}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Muat Turun CSV Jawatankuasa ({committeeList.length} Rekod)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GOOGLE SHEETS */}
          {activeTab === 'google_sheets' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Integrasi Google Sheets & Apps Script</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Tetapan penyambung langsung pangkalan data Google Sheets rasmi KPMBP ke SmartHub.
                </p>
              </div>

              {/* Form fields */}
              <div className="space-y-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Google Apps Script Web App URL:
                  </label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    URL Web App yang disebarkan (deploy) dengan kebenaran "Who has access: Anyone".
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Spreadsheet ID:</label>
                    <input
                      type="text"
                      value={sheetId}
                      onChange={(e) => setSheetId(e.target.value)}
                      placeholder="1D5LCyHw3o6v6cGh_-IkYTzNL7tEEaPZvewE4iMFJL0c"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Nama Sheet Utama:</label>
                    <input
                      type="text"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      placeholder="Staff"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* External Sheet Links */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${sheetId || GAS_CONFIG.spreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Buka Google Sheets di Tab Baharu</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Feedback message */}
                {testMessage && (
                  <div className={`p-3 rounded-xl text-xs font-medium border ${
                    testStatus === 'success'
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : testStatus === 'failed'
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-indigo-950/40 border-indigo-800 text-indigo-300'
                  }`}>
                    {testMessage}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                  >
                    {testStatus === 'testing' ? 'Sedang Menguji...' : 'Uji Sambungan'}
                  </button>

                  <button
                    onClick={onSyncNow}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyegerakkan...' : 'Penyamaan Segera'}</span>
                  </button>

                  <button
                    onClick={handleSaveSheetsConfig}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Simpan Konfigurasi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Tetapan Sistem & Kebenaran Admin</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Konfigurasi keselamatan pegawai pentadbir dan fungsi penyelenggaraan data.
                </p>
              </div>

              {/* Section 1: Authorized Admins */}
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-white">Senarai Pegawai Pentadbir Yang Dibenarkan</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pegawai yang didaftarkan boleh mengakses Admin Console menggunakan emel MARA dan 4 digit terakhir nombor kad pengenalan (IC).
                </p>

                {/* Add admin form */}
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Emel MARA (cth: ali@mara.gov.my)"
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    value={newAdminIc}
                    onChange={(e) => setNewAdminIc(e.target.value)}
                    placeholder="4 Digit Terakhir IC (cth: 5312)"
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Nama Pegawai"
                      className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                </form>

                {adminMgmtStatus && (
                  <p className={`text-xs font-bold ${adminMgmtStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {adminMgmtStatus.message}
                  </p>
                )}

                {/* Admins Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-2.5">Nama Pegawai</th>
                        <th className="p-2.5">Emel MARA</th>
                        <th className="p-2.5">Peranan</th>
                        <th className="p-2.5 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      <tr className="bg-slate-950/40">
                        <td className="p-2.5 font-bold text-amber-400">Master Administrator</td>
                        <td className="p-2.5 font-mono text-slate-400">admin@mara.gov.my</td>
                        <td className="p-2.5 text-slate-400">Master Admin (Kunci Utama)</td>
                        <td className="p-2.5 text-right text-[10px] text-slate-500 italic">Kekal</td>
                      </tr>
                      {authorizedAdmins.map((adm) => (
                        <tr key={adm.id} className="hover:bg-slate-950/30">
                          <td className="p-2.5 font-bold text-white">{adm.name || 'Pegawai Pentadbir'}</td>
                          <td className="p-2.5 font-mono text-indigo-300">{adm.email}</td>
                          <td className="p-2.5 text-slate-400">{adm.role || 'Admin'}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => handleRemoveAdmin(adm.id)}
                              className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900 text-rose-300 rounded text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Padam
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Data Maintenance */}
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-black text-white">Penyelenggaraan Pangkalan Data</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tindakan ini digunakan sekiranya anda ingin menetapkan semula data atau memulihkan data asal kolej.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      if (confirm('Adakah anda pasti mahu memulihkan senarai staf ke data asal kolej? Perubahan yang belum disimpan akan digantikan.')) {
                        onResetStaffData();
                        alert('Data staf berjaya dipulihkan.');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Pulihkan Data Staf ke Asal
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Adakah anda pasti mahu mengosongkan cache jawatankuasa dan memuatkan semula daripada Google Sheets?')) {
                        onResetCommitteeData();
                        alert('Cache jawatankuasa dikosongkan.');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Muat Semula Jawatankuasa
                  </button>
                </div>
              </div>

              {/* Section 3: PWA Info */}
              {canInstallPWA && onInstallPWA && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">Pasang KPMBP SmartHub (PWA)</h4>
                    <p className="text-[11px] text-slate-400">Pasang aplikasi ini ke komputer atau peranti mudah alih anda untuk akses terus.</p>
                  </div>
                  <button
                    onClick={onInstallPWA}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pasang App</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Admin Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>KPMBP SmartHub — Dedicated Admin Console v2.0</span>
          <span>Kolej Profesional MARA Bandar Penawar</span>
        </div>
      </footer>

    </div>
  );
};
