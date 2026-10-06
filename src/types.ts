/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Staff {
  ID: string;
  staff_id?: string;
  Bil?: number | string;
  Bahagian: string; // e.g. "Pengurusan", "Akademik", "Sokongan Akademik", "Pentadbiran"
  Kategori?: string; // e.g. "Pengurusan", "Akademik", "Pentadbiran"
  DepartmentID: string; // e.g. "JTM", "JKA", "JPA", "HEP", "Kewangan", "Pentadbiran", "Pengurusan", etc.
  Unit?: string; // e.g. "Pengurusan", "Pentadbiran", "Sains Kuantitatif", "Pengurusan Perniagaan", etc.
  Nama: string;
  NamaPendek?: string;
  DaerahAsal?: string;
  TahunLahir?: string;
  'Tahun Lahir'?: string;
  NoPlat?: string;
  PlatNo1?: string;
  PlatNo2?: string;
  PlatNo3?: string;
  PlatMotor1?: string;
  PlatMotor2?: string;
  Gred?: string;
  grade?: string;
  Jawatan: string;
  Tahun?: string;
  Kelulusan: string;
  Pengkhususan: string;
  Telefon: string; // Office/General Phone
  WhatsApp: string; // WhatsApp Number/Link
  Sambungan: string; // Extension
  Email: string;
  'URL Profil': string; // Profile URL
  Foto?: string; // Photo URL
  Gambar?: string; // Photo URL alternative
  Sumber: string; // e.g. "Google Sheets", "Sistem KPMBP", "Manual"
  Status: string; // "Aktif", "Cuti", "Bersara"
  LastSync: string;
}

export interface StaffCommittee {
  id?: string;
  staff_id: string; // matches staff ID e.g. "ST001" or staff name
  staff_nama?: string;
  jawatankuasa: string; // e.g. "Jawatankuasa Pengurusan Kualiti (JKPK)"
  peranan: string; // e.g. "Pengerusi", "Setiausaha", "AJK", "Penyelaras"
  tahun?: string; // e.g. "2024/2025"
  peringkat?: string; // e.g. "Kolej", "Jabatan", "Kebangsaan"
  catatan?: string;
}

export type DivisionType = 'Semua' | 'Pengurusan' | 'Akademik' | 'Sokongan Akademik' | 'Pentadbiran';

export interface SyncConfig {
  apiUrl: string;
  sheetId: string;
  scriptId?: string;
  sheetName: string;
  isConnected: boolean;
  lastSyncTime: string | null;
}

export interface AuthorizedAdmin {
  id: string;
  email: string;
  pin: string; // 4-digit PIN (last 4 digits of IC)
  icLast4?: string;
  name?: string;
  role?: string;
  createdAt?: string;
}
