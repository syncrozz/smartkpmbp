/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  RefreshCw, 
  Database, 
  Copy, 
  Check, 
  Info, 
  FileText, 
  Link2, 
  Wifi, 
  WifiOff, 
  ExternalLink, 
  FileSpreadsheet, 
  Upload, 
  Table, 
  X, 
  UserCheck, 
  UserPlus, 
  RotateCcw,
  Smartphone,
  Download,
  FileDown,
  Shield,
  ShieldCheck,
  Trash2,
  Key,
  Mail,
  Hash
} from 'lucide-react';
import { SyncConfig, Staff, StaffCommittee, AuthorizedAdmin } from '../types';
import { GAS_CONFIG } from '../config/gasConfig';
import { saveStaffListToFirestore, saveCommitteesToFirestore } from '../config/firebase';
import { getAuthorizedAdmins, addAuthorizedAdmin, removeAuthorizedAdmin } from '../utils/adminAuthService';

interface SyncSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
  isAdminMode?: boolean;
  onToggleAdminMode?: () => void;
  onOpenAddStaffModal?: () => void;
  config: SyncConfig;
  onSaveConfig: (newConfig: Partial<SyncConfig>) => void;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
  onImportStaffData?: (importedList: Staff[]) => void;
  onImportCommitteeData?: (importedList: StaffCommittee[]) => void;
  totalStaffCount?: number;
  totalCommitteeCount?: number;
  staffList?: Staff[];
  committeeList?: StaffCommittee[];
  onResetStaffData?: () => void;
  onResetCommitteeData?: () => void;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

// CSV escaping helper for proper quotes and UTF-8 handling
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

export const SyncSettings: React.FC<SyncSettingsProps> = ({
  isOpen = false,
  onClose,
  isAdminMode = false,
  onToggleAdminMode,
  onOpenAddStaffModal,
  config,
  onSaveConfig,
  onSyncNow,
  isSyncing,
  onImportStaffData,
  onImportCommitteeData,
  totalStaffCount = 0,
  totalCommitteeCount = 0,
  staffList = [],
  committeeList = [],
  onResetStaffData,
  onResetCommitteeData,
  onInstallPWA,
  canInstallPWA = false,
}) => {
  const [apiUrl, setApiUrl] = useState(config.apiUrl || GAS_CONFIG.webAppUrl);
  const [sheetId, setSheetId] = useState(config.sheetId || GAS_CONFIG.spreadsheetId);
  const [scriptId, setScriptId] = useState(config.scriptId || GAS_CONFIG.scriptId);
  const [sheetName, setSheetName] = useState(config.sheetName || 'Staff');
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Importer states
  const [showImporter, setShowImporter] = useState(true);
  const [importType, setImportType] = useState<'staff' | 'committee'>('staff');
  const [rawText, setRawText] = useState('');
  const [importMessage, setImportMessage] = useState('');

  // Authorized Admin management states
  const [authorizedAdmins, setAuthorizedAdmins] = useState<AuthorizedAdmin[]>(() => getAuthorizedAdmins());
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminIc, setNewAdminIc] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminAuthStatus, setAdminAuthStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminIc.trim()) {
      setAdminAuthStatus({ success: false, message: 'Sila masukkan emel MARA dan 4 digit terakhir nombor IC.' });
      return;
    }
    const res = addAuthorizedAdmin(newAdminEmail, newAdminIc, newAdminName);
    setAdminAuthStatus(res);
    if (res.success) {
      setAuthorizedAdmins(getAuthorizedAdmins());
      setNewAdminEmail('');
      setNewAdminIc('');
      setNewAdminName('');
      setTimeout(() => setAdminAuthStatus(null), 4000);
    }
  };

  const handleRemoveAdmin = (id: string) => {
    const res = removeAuthorizedAdmin(id);
    setAdminAuthStatus(res);
    setAuthorizedAdmins(getAuthorizedAdmins());
    setTimeout(() => setAdminAuthStatus(null), 3000);
  };

  const targetSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId || GAS_CONFIG.spreadsheetId}`;
  const targetScriptUrl = `https://script.google.com/d/${scriptId || GAS_CONFIG.scriptId}/edit`;

  const handleSave = () => {
    onSaveConfig({
      apiUrl,
      sheetId,
      scriptId,
      sheetName,
    });
  };

  const testConnection = async () => {
    const urlToTest = apiUrl || GAS_CONFIG.webAppUrl;
    if (!urlToTest) {
      setTestStatus('failed');
      setErrorMessage('Sambungan gagal');
      return;
    }

    setTestStatus('testing');
    setErrorMessage('');
    try {
      let res: Response;
      try {
        const proxyUrl = `/api/gas-proxy?url=${encodeURIComponent(urlToTest)}`;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 6000);
        res = await fetch(proxyUrl, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(id);
      } catch (proxyErr) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 6000);
        res = await fetch(urlToTest, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(id);
      }

      if (res.ok || res.status === 200 || res.type === 'opaque') {
        setTestStatus('success');
        onSaveConfig({ isConnected: true, apiUrl: urlToTest });
      } else {
        throw new Error('Sambungan gagal');
      }
    } catch (err: any) {
      console.warn('Connection test error:', err);
      setTestStatus('failed');
      setErrorMessage('Sambungan gagal');
    }
  };

  // Helper to parse CSV/TSV text respecting quotes and multiline fields
  const parseCSVToRows = (text: string): string[][] => {
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
          i++; // skip escaped quote
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
  };

  // Parse CSV/TSV for StaffCommittee and save to localStorage
  const handleParseAndImportCommittee = (overrideText?: string) => {
    const textToUse = overrideText || rawText;
    if (!textToUse.trim()) {
      setImportMessage('Sila muat naik fail CSV atau tampal teks data Jawatankuasa.');
      return;
    }

    try {
      const rows = parseCSVToRows(textToUse);
      if (rows.length < 2) {
        setImportMessage('Teks tidak sah atau kurang daripada 2 baris data.');
        return;
      }

      const headers = rows[0].map((h) => h.trim().replace(/^"|"$/g, ''));

      const findIdx = (possibleKeys: string[]): number => {
        return headers.findIndex((h) =>
          possibleKeys.some((k) => h.toLowerCase() === k.toLowerCase())
        );
      };

      const staffIdIdx = findIdx(['StaffID', 'staff_id', 'Staff ID', 'No Staf', 'ID', 'No. Staf']);
      const kategoriIdx = findIdx(['Kategori', 'peringkat', 'Peringkat', 'Category', 'Level']);
      const jawatanIdx = findIdx(['Jawatan', 'peranan', 'Peranan', 'Role', 'Position']);
      const unitIdx = findIdx(['Unit', 'jawatankuasa', 'Jawatankuasa', 'Committee', 'Nama Jawatankuasa']);
      const tahunIdx = findIdx(['Tahun', 'tahun', 'Year']);
      const statusIdx = findIdx(['Status', 'catatan', 'Catatan', 'Note']);
      const namaIdx = findIdx(['Nama', 'Nama Staf', 'staff_nama', 'Name']);

      const importedList: StaffCommittee[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const getCell = (idx: number, fallbackIdx: number = -1): string => {
          if (idx !== -1 && row[idx] !== undefined) return row[idx].trim().replace(/^"|"$/g, '');
          if (fallbackIdx !== -1 && row[fallbackIdx] !== undefined) return row[fallbackIdx].trim().replace(/^"|"$/g, '');
          return '';
        };

        const staffIdVal = getCell(staffIdIdx, 1);
        const unitVal = getCell(unitIdx, 4);
        const jawatanVal = getCell(jawatanIdx, 3);
        const kategoriVal = getCell(kategoriIdx, 2);

        if (!staffIdVal && !unitVal) continue;

        importedList.push({
          id: `c-imp-${i}-${Math.random().toString(36).substring(2, 6)}`,
          staff_id: staffIdVal.toUpperCase().trim(),
          staff_nama: getCell(namaIdx),
          jawatankuasa: unitVal || 'Jawatankuasa Kolej',
          peranan: jawatanVal || 'Ahli',
          peringkat: kategoriVal || 'Kolej',
          tahun: getCell(tahunIdx, 5),
          catatan: getCell(statusIdx, 6),
        });
      }

      if (importedList.length > 0) {
        if (onImportCommitteeData) {
          onImportCommitteeData(importedList);
        } else {
          localStorage.setItem('kpmbp_smarthub_committees', JSON.stringify(importedList));
        }
        setImportMessage(`✓ Mengimport ${importedList.length} rekod Jawatankuasa. Menyimpan ke Firebase...`);
        
        saveCommitteesToFirestore(importedList)
          .then(() => {
            setImportMessage(`✓ Berjaya mengimport ${importedList.length} rekod Jawatankuasa & tersimpan kekal di Firebase Firestore 🔥!`);
          })
          .catch((err) => {
            console.warn('Firebase save warning:', err);
            setImportMessage(`✓ Berjaya mengimport ${importedList.length} rekod Jawatankuasa ke dalam memori tempatan.`);
          });

        setRawText('');
      } else {
        setImportMessage('⚠ Tiada rekod jawatankuasa yang sah ditemui. Sila pastikan tajuk lajur seperti StaffID, Jawatan, Unit wujud.');
      }
    } catch (err: any) {
      setImportMessage(`⚠ Ralat memproses data Jawatankuasa: ${err.message}`);
    }
  };

  // Parse CSV/TSV text directly copied or exported from Google Sheets
  const handleParseAndImport = (overrideText?: string) => {
    const textToUse = overrideText || rawText;
    if (!textToUse.trim()) {
      setImportMessage('Sila tampal teks CSV / TSV daripada Google Sheets.');
      return;
    }

    try {
      const lines = textToUse.trim().split(/\r?\n/);
      if (lines.length === 0) {
        setImportMessage('Teks tidak sah.');
        return;
      }

      // Detect separator (Tab or Comma)
      const firstLine = lines[0];
      const separator = firstLine.includes('\t') ? '\t' : ',';
      
      const headers = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

      const parseRow = (line: string): string[] => {
        if (separator === '\t') {
          return line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
        }
        // Basic CSV regex parser
        const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
        const matches: string[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          matches.push((match[1] || match[2] || '').trim());
        }
        return matches;
      };

      const importedStaff: Staff[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = parseRow(lines[i]);
        if (cols.length === 0) continue;

        const getCol = (keyNames: string[], fallbackIdx: number): string => {
          for (const key of keyNames) {
            const keyLower = key.toLowerCase().trim();
            const foundIdx = headers.findIndex(h => h.toLowerCase().trim() === keyLower);
            if (foundIdx !== -1 && cols[foundIdx] !== undefined) {
              return cols[foundIdx].trim();
            }
          }
          if (fallbackIdx >= 0 && cols[fallbackIdx] !== undefined) {
            return cols[fallbackIdx].trim();
          }
          return '';
        };

        const bil = getCol(['Bil'], 0);
        const staffId = getCol(['StaffID', 'ID', 'staff_id'], 1) || `ST${String(i).padStart(3, '0')}`;
        const nama = getCol(['Nama', 'name'], 2);
        if (!nama) continue; // Skip empty rows

        const kategori = getCol(['Kategori', 'Bahagian'], 3) || 'Akademik';
        const jawatan = getCol(['Jawatan', 'position'], 4) || 'Pensyarah';
        const unit = getCol(['Unit', 'DepartmentID', 'Jabatan'], 5) || 'Pengurusan';
        const tahun = getCol(['Tahun'], 6) || '2026';
        const status = getCol(['Status'], 7) || 'Aktif';
        const kelulusan = getCol(['Kelulusan', 'qualification'], 8);
        const pengkhususan = getCol(['Pengkhususan', 'specialisation'], 9);
        const daerahAsal = getCol(['DaerahAsal', 'Daerah Asal', 'Asal'], 10);
        const telefon = getCol(['Telefon'], 11);
        const sambungan = getCol(['Sambungan'], 12);
        const whatsApp = getCol(['WhatsApp'], 13);
        const email = getCol(['Email', 'Emel'], 14);
        const urlProfil = getCol(['URL Profil', 'ProfileUrl'], 15);
        const sumber = getCol(['Sumber'], 16) || 'CSV Import';
        const lastSync = getCol(['LastSync'], 18) || new Date().toISOString().replace('T', ' ').substring(0, 16);
        const gred = getCol(['Gred', 'Grade'], 19);
        const tahunLahir = getCol(['Tahun Lahir', 'Tahun Lahir ', 'TahunLahir'], 20);
        const platNo1 = getCol(['PlatNo1', 'NoPlat', 'Plat 1'], 21);
        const platNo2 = getCol(['PlatNo2', 'Plat 2'], 22);
        const platNo3 = getCol(['PlatNo3', 'Plat 3'], 23);
        const platMotor1 = getCol(['PlatMotor1', 'Plat Motor 1'], 24);
        const platMotor2 = getCol(['PlatMotor2', 'Plat Motor 2'], 25);

        const allPlates = [platNo1, platNo2, platNo3, platMotor1, platMotor2].filter(Boolean);

        importedStaff.push({
          ID: staffId,
          staff_id: staffId,
          Bil: bil || String(i),
          Nama: nama,
          Kategori: kategori,
          Bahagian: kategori,
          Jawatan: jawatan,
          Unit: unit,
          DepartmentID: unit,
          Tahun: tahun,
          Status: status,
          Kelulusan: kelulusan,
          Pengkhususan: pengkhususan,
          DaerahAsal: daerahAsal,
          Telefon: telefon,
          Sambungan: sambungan,
          WhatsApp: whatsApp,
          Email: email,
          'URL Profil': urlProfil,
          Sumber: sumber,
          LastSync: lastSync,
          Gred: gred,
          grade: gred,
          TahunLahir: tahunLahir,
          'Tahun Lahir': tahunLahir,
          PlatNo1: platNo1,
          PlatNo2: platNo2,
          PlatNo3: platNo3,
          PlatMotor1: platMotor1,
          PlatMotor2: platMotor2,
          NoPlat: allPlates.join(', '),
        });
      }

      if (importedStaff.length > 0) {
        if (onImportStaffData) {
          onImportStaffData(importedStaff);
        }
        setImportMessage(`✓ Mengimport ${importedStaff.length} rekod kakitangan. Menyimpan ke Firebase...`);

        saveStaffListToFirestore(importedStaff)
          .then(() => {
            setImportMessage(`✓ Berjaya mengimport ${importedStaff.length} rekod kakitangan & tersimpan kekal di Firebase Firestore 🔥!`);
          })
          .catch((err) => {
            console.warn('Firebase staff save warning:', err);
            setImportMessage(`✓ Berjaya mengimport ${importedStaff.length} rekod kakitangan!`);
          });

        setRawText('');
        onSaveConfig({
          isConnected: true,
          lastSyncTime: new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        setImportMessage('⚠ Ralat: Tiada rekod sepadan ditemui. Pastikan baris pertama mengandungi tajuk lajur (Nama, Jawatan, dll).');
      }
    } catch (e: any) {
      setImportMessage(`⚠ Ralat memproses data: ${e.message}`);
    }
  };

  // State for copying header names
  const [copiedHeaders, setCopiedHeaders] = useState<'staff' | 'committee' | null>(null);

  // Copy Headers to Clipboard
  const handleCopyHeaders = (type: 'staff' | 'committee') => {
    const textToCopy = type === 'staff'
      ? 'Bil,StaffID,Nama,Kategori,Jawatan,Unit,Tahun,Kelulusan,Pengkhususan,DaerahAsal,Telefon,Sambungan,WhatsApp,Email,URL Profil,Sumber,LastSync,Gred,Tahun Lahir ,PlatNo1,PlatNo2,PlatNo3,PlatMotor1,PlatMotor2'
      : 'Bil,StaffID,Nama,Kategori,Jawatan,Unit,Tahun';
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedHeaders(type);
    setTimeout(() => setCopiedHeaders(null), 2500);
  };

  // Muat Turun Templat CSV Kakitangan
  const handleDownloadStaffTemplate = () => {
    const headers = [
      'Bil', 'StaffID', 'Nama', 'Kategori', 'Jawatan', 'Unit', 'Tahun',
      'Kelulusan', 'Pengkhususan', 'DaerahAsal', 'Telefon', 'Sambungan', 'WhatsApp',
      'Email', 'URL Profil', 'Sumber', 'LastSync', 'Gred', 'Tahun Lahir ',
      'PlatNo1', 'PlatNo2', 'PlatNo3', 'PlatMotor1', 'PlatMotor2'
    ];
    const sampleRows = [
      [
        '1', 'ST001', 'Muhammad Fazly Bin Jamaluddin', 'Pengurusan', 'Pengarah', 'Pengurusan', '2026',
        '', '', 'Kuantan, Pahang', '013-9500149', '201', '60139500149',
        'fazly.jamaluddin@mara.gov.my', '', 'Sistem KPMBP', '2026-09-04 00:00', 'DG13', '',
        'WUL3110', 'WB1782D', 'A7306A', '', ''
      ],
      [
        '2', 'ST002', 'Mohd Hakim Bin Hafiz', 'Pengurusan', 'Timb. Pengarah HEP', 'Pentadbiran', '2026',
        '', '', '', '018-3854235', '208', '60183854235',
        'hakim.hafiz@mara.gov.my', '', 'Sistem KPMBP', '2026-09-04 00:00', 'DG12', '1986',
        'SJ8684', '', '', '', ''
      ],
      [
        '6', 'ST010', 'Norhasnah Binti Mohd Nordin CMILT, M.T.A.M', 'Pengurusan', 'Ketua Jabatan', 'Sains Kuantitatif', '2026',
        'Sarjana Teknologi Pendidikan, UTM', 'Teknologi Maklumat', '', '012-7278737', '244', '60127278737',
        'norhasnah2@gmail.com', '', 'Sistem KPMBP', '2026-09-04 00:00', 'DG12', '',
        'JGK6336', '', '', '', ''
      ]
    ];

    const csvRows = [
      headers.map(escapeCSVCell).join(','),
      ...sampleRows.map(row => row.map(escapeCSVCell).join(','))
    ];

    downloadCSVFile(csvRows.join('\r\n'), 'templat_kakitangan_kpmbp.csv');
  };

  // Eksport Semua Data Kakitangan Semasa (.CSV)
  const handleExportStaffData = () => {
    let dataToExport = staffList;
    if (!dataToExport || dataToExport.length === 0) {
      try {
        dataToExport = JSON.parse(localStorage.getItem('kpmbp_smarthub_staff') || '[]');
      } catch (e) {
        dataToExport = [];
      }
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert('Tiada data kakitangan untuk dieksport.');
      return;
    }

    const headers = [
      'Bil', 'StaffID', 'Nama', 'Kategori', 'Jawatan', 'Unit', 'Tahun',
      'Kelulusan', 'Pengkhususan', 'DaerahAsal', 'Telefon', 'Sambungan', 'WhatsApp',
      'Email', 'URL Profil', 'Sumber', 'LastSync', 'Gred', 'Tahun Lahir ',
      'PlatNo1', 'PlatNo2', 'PlatNo3', 'PlatMotor1', 'PlatMotor2'
    ];

    const rows = dataToExport.map((s, idx) => {
      const bil = s.Bil || String(idx + 1);
      const staffId = s.ID || s.staff_id || `ST${String(idx + 1).padStart(3, '0')}`;
      const nama = s.Nama || '';
      const kategori = s.Kategori || s.Bahagian || 'Akademik';
      const jawatan = s.Jawatan || '';
      const unit = s.Unit || s.DepartmentID || '';
      const tahun = s.Tahun || '2026';
      const kelulusan = s.Kelulusan || '';
      const pengkhususan = s.Pengkhususan || '';
      const daerahAsal = s.DaerahAsal || '';
      const telefon = s.Telefon || '';
      const sambungan = s.Sambungan || '';
      const whatsApp = s.WhatsApp || '';
      const email = s.Email || '';
      const urlProfil = s['URL Profil'] || '';
      const sumber = s.Sumber || 'Sistem KPMBP';
      const lastSync = s.LastSync || new Date().toISOString().replace('T', ' ').substring(0, 16);
      const gred = s.Gred || s.grade || '';
      const tahunLahir = s.TahunLahir || s['Tahun Lahir'] || '';
      const platNo1 = s.PlatNo1 || '';
      const platNo2 = s.PlatNo2 || '';
      const platNo3 = s.PlatNo3 || '';
      const platMotor1 = s.PlatMotor1 || '';
      const platMotor2 = s.PlatMotor2 || '';

      return [
        bil,
        staffId,
        nama,
        kategori,
        jawatan,
        unit,
        tahun,
        kelulusan,
        pengkhususan,
        daerahAsal,
        telefon,
        sambungan,
        whatsApp,
        email,
        urlProfil,
        sumber,
        lastSync,
        gred,
        tahunLahir,
        platNo1,
        platNo2,
        platNo3,
        platMotor1,
        platMotor2
      ];
    });

    const csvContent = [
      headers.map(escapeCSVCell).join(','),
      ...rows.map(row => row.map(escapeCSVCell).join(','))
    ].join('\r\n');

    const todayStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csvContent, `senarai_kakitangan_kpmbp_${todayStr}.csv`);
  };

  // Muat Turun Templat CSV Jawatankuasa
  const handleDownloadCommitteeTemplate = () => {
    const headers = ['Bil', 'StaffID', 'Nama', 'Kategori', 'Jawatan', 'Unit', 'Tahun'];
    const sampleRows = [
      ['1', 'ST001', 'Ts. Dr. Ahmad bin Abdullah', 'Pengurusan', 'Pengerusi', 'JK Pengurusan Kolej (JPK)', '2025'],
      ['2', 'ST001', 'Ts. Dr. Ahmad bin Abdullah', 'Pengurusan', 'Pengerusi', 'JK Keselamatan & Kesihatan Pekerjaan Kolej (JKKP)', '2025'],
      ['3', 'ST002', 'Siti Aminah binti Kassim', 'Akademik', 'Setiausaha', 'JK Peperiksaan & Penilaian', '2025']
    ];

    const csvContent = [
      headers.map(escapeCSVCell).join(','),
      ...sampleRows.map(row => row.map(escapeCSVCell).join(','))
    ].join('\r\n');

    downloadCSVFile(csvContent, 'templat_jawatankuasa_kpmbp.csv');
  };

  // Eksport Semua Data Jawatankuasa Semasa (.CSV)
  const handleExportCommitteeData = () => {
    let dataToExport = committeeList;
    if (!dataToExport || dataToExport.length === 0) {
      try {
        dataToExport = JSON.parse(localStorage.getItem('kpmbp_smarthub_committees') || '[]');
      } catch (e) {
        dataToExport = [];
      }
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert('Tiada data jawatankuasa untuk dieksport.');
      return;
    }

    const headers = ['Bil', 'StaffID', 'Nama', 'Kategori', 'Jawatan', 'Unit', 'Tahun'];
    const rows = dataToExport.map((c, idx) => [
      String(idx + 1),
      c.staff_id || '',
      c.staff_nama || '',
      c.peringkat || '',
      c.peranan || '',
      c.jawatankuasa || '',
      c.tahun || ''
    ]);

    const csvContent = [
      headers.map(escapeCSVCell).join(','),
      ...rows.map(row => row.map(escapeCSVCell).join(','))
    ].join('\r\n');

    const todayStr = new Date().toISOString().split('T')[0];
    downloadCSVFile(csvContent, `senarai_jawatankuasa_kpmbp_${todayStr}.csv`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        if (importType === 'committee') {
          handleParseAndImportCommittee(content);
        } else {
          handleParseAndImport(content);
        }
      }
    };
    reader.readAsText(file);
  };

  const googleAppsScriptCode = `// Deploy as Web App in your Google Apps Script:
// 1. Open Google Sheet with name "Staff"
// 2. Click Extensions > Apps Script
// 3. Paste this code and click Deploy > New Deployment > Web App (Set access: "Anyone")

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Staff");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: "Sheet 'Staff' not found"}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var jsonArray = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    jsonArray.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(jsonArray))
                       .setMimeType(ContentService.MimeType.JSON)
                       .setHeader("Access-Control-Allow-Origin", "*");
}

function doPost(e) {
  // Handle sync updates from Directory KPMBP to Google Sheets
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Staff");
    
    // Simple overwrite implementation for v0.3 Foundation sync
    if (payload && payload.staffList) {
      sheet.clearContents();
      // Set headers
      var headers = ["ID", "Bahagian", "DepartmentID", "Nama", "Jawatan", "Kelulusan", "Pengkhususan", "Telefon", "WhatsApp", "Sambungan", "Email", "URL Profil", "Sumber", "LastSync"];
      sheet.appendRow(headers);
      
      payload.staffList.forEach(function(stf) {
        sheet.appendRow([
          stf.ID, stf.Bahagian, stf.DepartmentID, stf.Nama, stf.Jawatan,
          stf.Kelulusan, stf.Pengkhususan, stf.Telefon, stf.WhatsApp,
          stf.Sambungan, stf.Email, stf["URL Profil"], stf.Sumber,
          stf.LastSync
        ]);
      });
      return ContentService.createTextOutput(JSON.stringify({success: true, count: payload.staffList.length}))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()}))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 text-left max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl shadow-md shadow-indigo-200">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-sans font-extrabold text-slate-900 text-base md:text-lg leading-tight">
                  Pusat Pengurusan Admin & Database Google Sheets
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Urus rekod kakitangan, mod suntingan, & integrasi Google Sheets kolej
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canInstallPWA && onInstallPWA && (
                <button
                  type="button"
                  onClick={onInstallPWA}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer border border-emerald-500/30"
                  title="Pasang / Install Aplikasi Directory KPMBP (PWA)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Pasang App</span>
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
                  title="Tutup Modal Tetapan"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Admin Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Action 1: Admin Mode Toggle */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              isAdminMode 
                ? 'bg-amber-50/90 border-amber-200/80 text-amber-950 shadow-xs' 
                : 'bg-slate-50 border-slate-100 text-slate-800'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <UserCheck className={`w-4 h-4 ${isAdminMode ? 'text-amber-600' : 'text-slate-400'}`} />
                    Admin Mode (Suntingan)
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    isAdminMode ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isAdminMode ? 'AKTIF' : 'MATI'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mb-3 leading-snug">
                  Paparkan butang kemaskini & hapus pada kad direktori.
                </p>
              </div>
              <button
                onClick={onToggleAdminMode}
                className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isAdminMode 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs' 
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                {isAdminMode ? 'Matikan Admin Mode' : 'Aktifkan Admin Mode'}
              </button>
            </div>

            {/* Action 2: Add New Staff */}
            <div className="p-4 bg-indigo-50/90 border border-indigo-100 rounded-2xl text-indigo-950 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    Daftar Staf Baru
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                    {totalStaffCount} Staf
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mb-3 leading-snug">
                  Buka borang untuk pendaftaran staf atau pensyarah baru.
                </p>
              </div>
              <button
                onClick={() => {
                  if (onOpenAddStaffModal) onOpenAddStaffModal();
                  if (onClose) onClose();
                }}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Buka Borang Daftar</span>
              </button>
            </div>

            {/* Action 3: Google Sheets & Script Links */}
            <div className="p-4 bg-emerald-50/90 border border-emerald-100 rounded-2xl text-emerald-950 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Google Integrasi
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Aktif
                  </span>
                </div>
                <div className="space-y-1 mb-2">
                  <p className="text-[10px] font-mono text-slate-600 truncate bg-white px-2 py-1 rounded border border-emerald-200/60">
                    Sheet: {sheetId || '1D5LCyHw...'}
                  </p>
                  <p className="text-[10px] font-mono text-slate-600 truncate bg-white px-2 py-1 rounded border border-emerald-200/60">
                    Script: {scriptId || '16lBiFFg...'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <a
                  href={targetSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-center"
                  title="Buka Google Sheet"
                >
                  <span>Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={targetScriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-extrabold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-center"
                  title="Buka Google Script Editor"
                >
                  <span>Script</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Otorisasi Akses Admin (Emel MARA & 4 Digit PIN IC) */}
          <div className="p-4 md:p-5 bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 rounded-2xl border border-indigo-200/90 shadow-xs space-y-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
              <div>
                <h4 className="text-xs md:text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Otorisasi Akses Admin (Emel MARA & 4 Digit PIN IC)</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Master Admin boleh membenarkan pegawai mengakses Admin Mode untuk melihat maklumat sensitif (Daerah Asal, Tahun Lahir, No. Plat Kenderaan).
                </p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 border border-indigo-200 self-start sm:self-auto shrink-0">
                Master Admin Sahaja
              </span>
            </div>

            {/* Explanatory Info Card */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-amber-950 text-[11px]">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Cara Format Otorisasi:</p>
                <p className="text-amber-900/90 leading-relaxed">
                  Masukkan alamat emel rasmi MARA (cth: <span className="font-mono font-bold">khairi.mohd@mara.gov.my</span>) dan kombinasi 4 digit nombor IC terakhir (cth: untuk IC <span className="font-mono font-bold">861115-46-5305</span>, PIN keselamatannya adalah <span className="font-mono font-bold bg-amber-200/70 px-1 rounded">5305</span>).
                </p>
              </div>
            </div>

            {/* Add Authorized Admin Form */}
            <form onSubmit={handleAddAdmin} className="space-y-3 bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-indigo-600" />
                    <span>Alamat Emel MARA *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cth: khairi.mohd@mara.gov.my"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-indigo-600" />
                    <span>4 Digit Terakhir No. IC *</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="cth: 5305 (atau 861115-46-5305)"
                    value={newAdminIc}
                    onChange={(e) => setNewAdminIc(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-indigo-600" />
                    <span>Nama Pegawai (Pilihan)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="cth: Khairi Mohd"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-medium italic">
                  * Admin ini boleh log masuk menggunakan Emel MARA & PIN 4-digit IC.
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Otorisasi Admin</span>
                </button>
              </div>

              {adminAuthStatus && (
                <p className={`text-[11px] p-2 rounded-lg font-bold flex items-center gap-1.5 ${
                  adminAuthStatus.success 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {adminAuthStatus.success ? '✓' : '⚠'} {adminAuthStatus.message}
                </p>
              )}
            </form>

            {/* List of Authorized Admins */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span>Senarai Pegawai Diotorisasi ({authorizedAdmins.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Disimpan secara automatik</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {authorizedAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0">
                        {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {admin.name || admin.email}
                          </p>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {admin.role === 'master' ? 'Master' : 'Admin'}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 truncate">
                          {admin.email} • Status: <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">PIN Aktif (••••)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono">
                        {admin.addedAt ? new Date(admin.addedAt).toLocaleDateString('ms-MY') : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Batalkan otorisasi admin ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Data Importer & Exporter (CSV/TSV) */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-amber-50/40 rounded-2xl border border-indigo-100/80 shadow-xs space-y-3 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Pengurusan Data CSV (Import & Eksport)
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Muat turun templat CSV rasmi dengan susunan header yang tepat, eksport data semasa, atau muat naik fail CSV.
                </p>
              </div>

              {/* Quick Template Download & Toggle Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadStaffTemplate}
                  title="Muat turun templat CSV Kakitangan dengan susunan header yang betul"
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Templat Staf</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCommitteeTemplate}
                  title="Muat turun templat CSV Jawatankuasa dengan susunan header yang betul"
                  className="px-2.5 py-1.5 bg-white hover:bg-amber-50 border border-amber-200 text-amber-950 rounded-xl text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Templat JK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowImporter(!showImporter)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  {showImporter ? 'Tutup Panel' : 'Buka Panel CSV'}
                </button>
              </div>
            </div>

            {showImporter && (
              <div className="pt-3 space-y-3 border-t border-indigo-100/60">
                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 p-1 bg-white/80 border border-indigo-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setImportType('staff');
                      setImportMessage('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      importType === 'staff'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-indigo-50'
                    }`}
                  >
                    <span>👤 Kakitangan (Staff)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                      {totalStaffCount || staffList.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImportType('committee');
                      setImportMessage('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      importType === 'committee'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    <span>🏅 Jawatankuasa (StaffCommittee)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                      {totalCommitteeCount || committeeList.length}
                    </span>
                  </button>
                </div>

                {importType === 'staff' ? (
                  /* Staff CSV Section */
                  <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs">
                    {/* Staff Header Guide & Export Toolbar */}
                    <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                            Format Header CSV Kakitangan & Muat Turun
                          </span>
                          <p className="text-[10.5px] text-slate-500 font-medium">
                            Gunakan templat CSV untuk memasukkan rekod staf dengan format lajur yang betul.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyHeaders('staff')}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                          title="Salin baris tajuk lajur ke papan klip"
                        >
                          {copiedHeaders === 'staff' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Header Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-indigo-700" />
                              <span>Salin Format Header</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-indigo-100 text-[11px] font-mono text-slate-800 break-all select-all">
                        <span className="text-indigo-800 font-bold">Header Sah: </span>
                        Bil, StaffID, Nama, Kategori, Jawatan, Unit, Tahun, Kelulusan, Pengkhususan, DaerahAsal, Telefon, Sambungan, WhatsApp, Email, URL Profil, Sumber, LastSync, Gred, Tahun Lahir , PlatNo1, PlatNo2, PlatNo3, PlatMotor1, PlatMotor2
                      </div>

                      {/* Export Actions Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleDownloadStaffTemplate}
                          className="py-2 px-3 bg-white hover:bg-indigo-100 active:scale-[0.98] border border-indigo-200 text-indigo-950 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4 text-indigo-600" />
                          <span>Muat Turun Templat CSV Staf</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportStaffData}
                          className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Eksport Data Semasa ({totalStaffCount || staffList.length} Rekod)</span>
                        </button>
                      </div>
                    </div>

                    {/* Import / Upload Staff CSV */}
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Muat Naik atau Tampal Data Kakitangan:</span>
                        </label>

                        <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih Fail CSV / TSV</span>
                          <input
                            type="file"
                            accept=".csv,.tsv,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <textarea
                        rows={5}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder={`Bil,StaffID,Nama,Kategori,Jawatan,Unit,Tahun...\nTampal baris data staf terus dari fail CSV atau Google Sheets di sini`}
                        className="w-full p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none leading-relaxed"
                      />

                      <button
                        type="button"
                        onClick={() => handleParseAndImport()}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Proses & Kemaskini Data Staf Ke Sistem & Firebase
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Committee CSV Section */
                  <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-amber-200/70 shadow-xs">
                    {/* Committee Header Guide & Export Toolbar */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                            Format Header CSV Jawatankuasa & Muat Turun
                          </span>
                          <p className="text-[10.5px] text-amber-900/80 font-medium">
                            Gunakan templat CSV untuk mengelakkan ralat susunan lajur semasa import.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyHeaders('committee')}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                          title="Salin baris tajuk lajur ke papan klip"
                        >
                          {copiedHeaders === 'committee' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Header Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-amber-700" />
                              <span>Salin Format Header</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-amber-200/60 text-[11px] font-mono text-slate-800 break-all select-all">
                        <span className="text-amber-800 font-bold">Header Sah: </span>
                        Bil, StaffID, Nama, Kategori, Jawatan, Unit, Tahun
                      </div>

                      {/* Export Actions Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleDownloadCommitteeTemplate}
                          className="py-2 px-3 bg-white hover:bg-amber-100 active:scale-[0.98] border border-amber-300 text-amber-950 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4 text-amber-600" />
                          <span>Muat Turun Templat CSV Jawatankuasa</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportCommitteeData}
                          className="py-2 px-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Eksport Data Semasa ({totalCommitteeCount || committeeList.length} Rekod)</span>
                        </button>
                      </div>
                    </div>

                    {/* Import / Upload Committee CSV */}
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-amber-600" />
                          <span>Muat Naik atau Tampal Data Jawatankuasa:</span>
                        </label>

                        <label className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih Fail CSV / TSV</span>
                          <input
                            type="file"
                            accept=".csv,.tsv,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <textarea
                        rows={5}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder={`Bil,StaffID,Nama,Kategori,Jawatan,Unit,Tahun\n1,ST001,Ts. Dr. Ahmad bin Abdullah,Pengurusan,Pengerusi,JK Pengurusan Kolej (JPK),2025\n2,ST001,Ts. Dr. Ahmad bin Abdullah,Pengurusan,Pengerusi,JK Keselamatan & Kesihatan Pekerjaan Kolej (JKKP),2025`}
                        className="w-full p-3 bg-amber-50/30 border border-amber-200/80 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none leading-relaxed"
                      />

                      <button
                        type="button"
                        onClick={() => handleParseAndImportCommittee()}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Proses & Kemaskini Jawatankuasa Ke Sistem & Firebase
                      </button>
                    </div>
                  </div>
                )}

                {importMessage && (
                  <div className={`p-3 rounded-xl text-xs font-bold leading-relaxed ${
                    importMessage.startsWith('✓') 
                      ? 'bg-emerald-100/90 text-emerald-950 border border-emerald-200' 
                      : 'bg-amber-100/90 text-amber-950 border border-amber-200'
                  }`}>
                    {importMessage}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Configuration for API */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-indigo-600" /> Konfigurasi API Web App (Google Apps Script)
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">URL Web App Google Apps Script</label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Nama Helaian (Sheet)</label>
                <input
                  type="text"
                  placeholder="Staff"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none transition-all text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">ID Google Sheet</label>
                <input
                  type="text"
                  placeholder="Google Sheet ID"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">ID Google Script</label>
                <input
                  type="text"
                  placeholder="Google Script ID"
                  value={scriptId}
                  onChange={(e) => setScriptId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                Simpan Konfigurasi
              </button>
              
              <button
                onClick={testConnection}
                disabled={testStatus === 'testing'}
                className="px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
              >
                {testStatus === 'testing' ? 'Menguji...' : 'Uji Sambungan'}
              </button>
            </div>

            {/* Test connection alert status */}
            {testStatus === 'success' && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-1.5 font-bold shadow-xs">
                ✓ Sambungan berjaya disahkan
              </p>
            )}
            {testStatus === 'failed' && (
              <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl font-bold shadow-xs">
                ⚠ Sambungan gagal
              </p>
            )}
          </div>

          {/* Sync Action Area */}
          <div className="p-4 bg-indigo-950 text-white rounded-2xl flex items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                Segerakkan Rekod
              </h4>
              <p className="text-[11px] text-indigo-200/80 font-medium">
                {config.lastSyncTime ? `Terakhir disegerak: ${config.lastSyncTime}` : 'Belum pernah disegerakkan'}
              </p>
            </div>
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Menyinkron...' : 'Sync Sekarang'}
            </button>
          </div>

          {/* Script deployment guides */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Kod Backend Google Apps Script (GAS)
              </h4>
              <button
                onClick={handleCopyCode}
                className="text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Ditulis!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin Kod GAS
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Salin kod di atas & tampal ke <strong>Extensions &gt; Apps Script</strong> dalam Google Sheets anda, kemudian Deploy sebagai Web App.
            </p>
            <div className="bg-slate-900 rounded-2xl p-3 overflow-x-auto max-h-40 border border-slate-800 text-left">
              <pre className="text-[10px] font-mono text-slate-300 whitespace-pre leading-relaxed">
                {googleAppsScriptCode}
              </pre>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {onResetStaffData && (
                <button
                  onClick={onResetStaffData}
                  className="text-[11px] text-slate-500 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Data Staf
                </button>
              )}
              {onResetCommitteeData && (
                <button
                  onClick={onResetCommitteeData}
                  className="text-[11px] text-slate-500 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Jawatankuasa
                </button>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer ml-auto"
              >
                Selesai / Tutup
              </button>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
