/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LinkItem {
  id: string;
  title: string;
  desc: string;
  url: string;
  audience: 'Pelajar' | 'Staf' | 'Kedua-dua';
  category: 'portal' | 'akademik' | 'hebahan';
}

export interface CalendarEvent {
  id: string;
  title: string;
  dateRange: string;
  status: 'Sedang Berjalan' | 'Akan Datang' | 'Selesai';
  type: 'akademik' | 'aktiviti' | 'cuti';
}

export interface ContactItem {
  id: string;
  department: string;
  role: string;
  phone: string;
  whatsapp: string;
  extension?: string;
  email?: string;
}

export interface RuleItem {
  id: string;
  title: string;
  desc: string;
  details: string[];
}

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  category: 'Akademik' | 'HEP & Asrama' | 'Pentadbiran';
  summary: string;
  details?: string;
  badge?: string;
  urgent?: boolean;
}

export const QUICK_PORTAL_LINKS: LinkItem[] = [
  {
    id: 'l1',
    title: 'Portal SPMP Pelajar',
    desc: 'Sistem Pengurusan Maklumat Pelajar untuk pendaftaran subjek, semakan keputusan peperiksaan, gred GPA/CGPA, dan rekod kehadiran.',
    url: 'https://bpenawar.kpm.edu.my/spmp/',
    audience: 'Pelajar',
    category: 'portal'
  },
  {
    id: 'l2',
    title: 'Sistem SISPEN (Staf)',
    desc: 'Sistem Penilaian Pensyarah & Staf Kolej Profesional MARA Bandar Penawar.',
    url: 'https://bpenawar.kpm.edu.my/sispen/',
    audience: 'Staf',
    category: 'portal'
  },
  {
    id: 'l3',
    title: 'Microsoft Teams & Office 365',
    desc: 'Hab pembelajaran digital, kelas hibrid, kuiz dalam talian, kolaborasi kumpulan, dan mel rasmi @student.kpm.edu.my.',
    url: 'https://teams.microsoft.com/',
    audience: 'Kedua-dua',
    category: 'portal'
  },
  {
    id: 'l4',
    title: 'Perpustakaan Al-Ghazali Portal',
    desc: 'Semak katalog buku fizikal, pangkalan data jurnal e-Perpustakaan, waktu operasi, dan buat tempahan bilik belajar kumpulan.',
    url: 'https://bpenawar.kpm.edu.my/library/',
    audience: 'Kedua-dua',
    category: 'portal'
  },
  {
    id: 'l5',
    title: 'Sistem e-Kehadiran MARA',
    desc: 'Pintu gerbang kehadiran kerja harian untuk semua kakitangan pengurusan dan tenaga pengajar akademik MARA.',
    url: 'https://ekehadiran.mara.gov.my/',
    audience: 'Staf',
    category: 'portal'
  },
  {
    id: 'l6',
    title: 'Portal Integriti MARA',
    desc: 'Garis panduan etika, pelaporan integriti, dasar kebajikan MARA, dan pekeliling perkhidmatan awam semasa.',
    url: 'https://www.mara.gov.my/',
    audience: 'Staf',
    category: 'portal'
  }
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Sesi Kuliah Semester I Sesi 2026/2027 Bermula',
    dateRange: '20 Julai 2026',
    status: 'Akan Datang',
    type: 'akademik'
  },
  {
    id: 'e2',
    title: 'Minggu Silaturrahim (MSR) Pelajar Baharu',
    dateRange: '15 Julai – 19 Julai 2026',
    status: 'Akan Datang',
    type: 'aktiviti'
  },
  {
    id: 'e3',
    title: 'Cuti Pertengahan Semester I Sesi 2026/2027',
    dateRange: '05 September – 13 September 2026',
    status: 'Akan Datang',
    type: 'cuti'
  },
  {
    id: 'e4',
    title: 'Peperiksaan Akhir Semester I Sesi 2026/2027',
    dateRange: '26 Oktober – 10 November 2026',
    status: 'Akan Datang',
    type: 'akademik'
  },
  {
    id: 'e5',
    title: 'Cuti Akhir Semester I',
    dateRange: '11 November – 29 November 2026',
    status: 'Akan Datang',
    type: 'cuti'
  },
  {
    id: 'e6',
    title: 'Sesi Penilaian Prestasi Mengajar Pensyarah (SPMP)',
    dateRange: '01 Oktober – 15 Oktober 2026',
    status: 'Akan Datang',
    type: 'akademik'
  }
];

export const KEY_CAMPUS_CONTACTS: ContactItem[] = [
  {
    id: 'c1',
    department: 'Unit Hal Ehwal Pelajar (HEP)',
    role: 'Urusan asrama, kebajikan, disiplin, biasiswa, dan aktiviti persatuan pelajar.',
    phone: '07-8842222',
    whatsapp: '60183854235',
    extension: '210',
    email: 'hep.penawar@mara.gov.my'
  },
  {
    id: 'c2',
    department: 'Unit Hal Ehwal Akademik (HEA)',
    role: 'Semakan jadual kuliah, pendaftaran kelas, dewan peperiksaan, dan slip keputusan.',
    phone: '07-8842222',
    whatsapp: '60174693512',
    extension: '215',
    email: 'hea.penawar@mara.gov.my'
  },
  {
    id: 'c3',
    department: 'Warden Blok Asrama Lelaki (On-Duty)',
    role: 'Kebajikan asrama, keselamatan pelajar, kecemasan di luar waktu pejabat.',
    phone: '07-8843100',
    whatsapp: '60139500149',
    email: 'warden.lelaki@mara.gov.my'
  },
  {
    id: 'c4',
    department: 'Warden Blok Asrama Perempuan (On-Duty)',
    role: 'Hubungi untuk laporan asrama, kemudahan asrama, atau kecemasan kesihatan pelajar.',
    phone: '07-8843102',
    whatsapp: '60138661616',
    email: 'warden.perempuan@mara.gov.my'
  },
  {
    id: 'c5',
    department: 'Unit Pentadbiran & Kewangan Kolej',
    role: 'Pembayaran yuran pengajian, tuntutan elaun wang saku MARA, urusan pendaftaran masuk.',
    phone: '07-8842222',
    whatsapp: '60138661616',
    extension: '100',
    email: 'pentadbiran.penawar@mara.gov.my'
  },
  {
    id: 'c6',
    department: 'Unit Teknologi Maklumat & Sokongan Sistem',
    role: 'Akses Wi-Fi kampus, penetapan emel rasmi, ID Teams, dan sokongan sistem digital.',
    phone: '07-8842222',
    whatsapp: '60137254391',
    extension: '144',
    email: 'it.penawar@mara.gov.my'
  }
];

export const COLLEGE_RULES: RuleItem[] = [
  {
    id: 'r1',
    title: 'Etika Pemakaian & Rupa Diri (Staf & Pelajar)',
    desc: 'Setiap warga KPM Bandar Penawar mesti mematuhi etika pakaian formal mengikut pekeliling MARA sepanjang waktu kuliah/pejabat.',
    details: [
      'Pelajar Lelaki: Baju kemeja lengan panjang lengkap bertali leher, seluar slack hitam/gelap, rambut pendek kemas.',
      'Pelajar Perempuan: Baju kurung lengkap bertudung kemas (bagi muslim), pemakaian kasut bertutup (sukan/formal).',
      'Staf Akademik/Sokongan: Pakaian pejabat rasmi. Hari Khamis digalakkan memakai pakaian Batik Malaysia.'
    ]
  },
  {
    id: 'r2',
    title: 'Peraturan Keluar Masuk Kampus (Outing & Balik Bermalam)',
    desc: 'Sistem kemasukan dikawal selia oleh unit pengawal keselamatan dan HEP demi kesejahteraan komuniti kampus.',
    details: [
      'Outing Mingguan: Hari Rabu (selepas kelas - 6.30 PM), Jumaat (12.30 PM - 7.00 PM), Sabtu & Ahad (8.00 AM - 7.00 PM).',
      'Balik Bermalam (Homeleave): Pelajar dibenarkan pulang ke rumah dengan kelulusan Warden/HEP melalui borang digital sekurang-kurangnya 3 hari awal.',
      'Kawalan Pagar: Pagar utama ditutup sepenuhnya selepas jam 11:00 malam setiap hari.'
    ]
  },
  {
    id: 'r3',
    title: 'Panduan Am Perpustakaan Al-Ghazali',
    desc: 'Waktu operasi dan tatatertib di dalam dewan perpustakaan utama.',
    details: [
      'Waktu Operasi: Isnin hingga Jumaat (8.15 AM – 4.45 PM). Ditutup pada hari Sabtu, Ahad, dan cuti am.',
      'Pinjaman Buku: Setiap pelajar dibenarkan meminjam maksimum 4 buah buku pada satu masa selama 14 hari berturut-turut.',
      'Larangan: Dilarang membawa makanan, beg galas, minuman manis, atau membuat bising yang mengganggu fokus pembaca lain.'
    ]
  }
];

export const CAMPUS_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'a1',
    title: 'Pendaftaran Kursus & Semakan Jadual Kuliah Sesi Baharu',
    date: '10 Julai 2026',
    category: 'Akademik',
    badge: 'Terkini',
    summary: 'Pendaftaran kursus dalam talian dibuka melalui portal SPMP. Sila rujuk Penasihat Akademik (PA) masing-masing untuk pengesahan.',
    urgent: true
  },
  {
    id: 'a2',
    title: 'Minggu Silaturrahim (MSR) Pelajar Baharu Sesi 2026/2027',
    date: '08 Julai 2026',
    category: 'HEP & Asrama',
    badge: 'Aktiviti',
    summary: 'Pendaftaran asrama bermula 15 Julai 2026. Sila bawa dokumen pengesahan kesihatan dan surat tawaran rasmi.'
  },
  {
    id: 'a3',
    title: 'Peringatan Pemakaian Kad Matrik & Kod Etika Berpakaian Kampus',
    date: '01 Julai 2026',
    category: 'Pentadbiran',
    badge: 'Peringatan',
    summary: 'Semua pelajar dan staf diwajibkan memakai kad pengenalan pintar/matrik sepanjang berada dalam kawasan kolej.'
  }
];
