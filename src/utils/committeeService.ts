import { Staff, StaffCommittee } from '../types';
import { COMMITTEE_CSV_DATA } from '../data/committeeCSV';

// Default / fallback committee generator if sheet StaffCommittee returns empty
export function generateDefaultCommitteesForStaff(staffList: Staff[]): StaffCommittee[] {
  const committees: StaffCommittee[] = [...COMMITTEE_CSV_DATA];

  // Map staff with existing records in CSV
  const existingStaffIds = new Set(committees.map(c => c.staff_id));

  staffList.forEach((staff) => {
    const id = (staff.ID || staff.staff_id || '').toUpperCase().trim();
    if (!id || existingStaffIds.has(id)) return;

    const name = staff.Nama || '';
    const jawatan = (staff.Jawatan || '').toLowerCase();

    if (jawatan.includes('pengarah') && !jawatan.includes('timb')) {
      committees.push(
        {
          id: `jk-${id}-1`,
          staff_id: id,
          staff_nama: name,
          jawatankuasa: 'Jawatankuasa Pengurusan Kolej (JKPK)',
          peranan: 'Pengerusi',
          tahun: '2024/2025',
          peringkat: 'Kolej',
          catatan: 'Pengurusan Tertinggi Kolej',
        },
        {
          id: `jk-${id}-2`,
          staff_id: id,
          staff_nama: name,
          jawatankuasa: 'Jawatankuasa Kecemerlangan Latihan & Pembangunan',
          peranan: 'Pengerusi',
          tahun: '2024/2025',
          peringkat: 'Kebangsaan / KPM',
          catatan: 'Pemantauan Standard Latihan',
        }
      );
    } else if (jawatan.includes('timb. pengarah')) {
      committees.push(
        {
          id: `jk-${id}-1`,
          staff_id: id,
          staff_nama: name,
          jawatankuasa: 'Jawatankuasa Hal Ehwal Pelajar & Pembangunan Individu',
          peranan: 'Pengerusi',
          tahun: '2024/2025',
          peringkat: 'Kolej',
          catatan: 'Pengurusan Pelajar & Sahsiah',
        },
        {
          id: `jk-${id}-2`,
          staff_id: id,
          staff_nama: name,
          jawatankuasa: 'Jawatankuasa Ekosistem Kondusif Sektor Awam (EKSA)',
          peranan: 'Timbalan Pengerusi',
          tahun: '2024/2025',
          peringkat: 'Kolej',
          catatan: 'Penarafan EKSA',
        }
      );
    } else if (jawatan.includes('ketua jabatan')) {
      committees.push(
        {
          id: `jk-${id}-1`,
          staff_id: id,
          staff_nama: name,
          jawatankuasa: `Jawatankuasa Akademik Jabatan (${staff.DepartmentID || 'Jabatan'})`,
          peranan: 'Pengerusi',
          tahun: '2024/2025',
          peringkat: 'Jabatan',
          catatan: 'Semakan Kurikulum & Pentaksiran',
        },
        {
          id: `jk-${id}-2`,
          staff_id: id,
          staff_nama: name,
          jawatankuasa: 'Jawatankuasa Jaminan Kualiti & Akreditasi MQA',
          peranan: 'Penyelaras Jabatan',
          tahun: '2024/2025',
          peringkat: 'Kolej',
          catatan: 'Pematuhan Standard MQA',
        }
      );
    } else if (jawatan.includes('pensyarah')) {
      committees.push(
        {
          id: `jk-${id}-1`,
          staff_id: id,
          staff_nama: name,
          jawatankuasa: 'Jawatankuasa Penyelidikan, Inovasi & Penerbitan',
          peranan: 'Ahli Jawatankuasa (AJK)',
          tahun: '2024/2025',
          peringkat: 'Kolej',
          catatan: 'Projek Inovasi KPMBP',
        },
        {
          id: `jk-${id}-2`,
          staff_id: id,
          staff_nama: name,
          jawatankuasa: 'Jawatankuasa Penasihat Akademik & Bimbingan Staf',
          peranan: 'Mentor / Penasihat',
          tahun: '2024/2025',
          peringkat: 'Jabatan',
          catatan: 'Sistem Mentor-Mentee',
        }
      );
    } else {
      committees.push({
        id: `jk-${id}-1`,
        staff_id: id,
        staff_nama: name,
        jawatankuasa: 'Jawatankuasa Keselamatan & Kesihatan Pekerjaan (OJKK)',
        peranan: 'Ahli Jawatankuasa (AJK)',
        tahun: '2024/2025',
        peringkat: 'Kolej',
        catatan: 'Pengurusan Operasi & Pentadbiran',
      });
    }
  });

  return committees;
}

export function parseCommitteeRows(rows: any[]): StaffCommittee[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows.map((row, idx) => {
    const rawStaffId = String(
      row.staff_id || row.ID || row['ID Staf'] || row.Staff_ID || row['ID Staff'] || row.Nama || ''
    ).trim();

    const cleanStaffId = rawStaffId.toUpperCase().replace(/^STF-/i, 'ST').replace(/^STF/i, 'ST');

    return {
      id: String(row.id || row.ID_Jawatankuasa || `JK-${idx + 1}`),
      staff_id: cleanStaffId,
      staff_nama: String(row.staff_nama || row.Nama || row['Nama Staf'] || row['Nama Staff'] || ''),
      jawatankuasa: String(
        row.jawatankuasa || row.Jawatankuasa || row['Nama Jawatankuasa'] || row.Committee || row['Jawatankuasa / Program'] || 'Jawatankuasa Rasmi'
      ),
      peranan: String(
        row.peranan || row.Peranan || row.Jawatan || row['Jawatan Dalam Jawatankuasa'] || row.Role || 'Ahli Jawatankuasa'
      ),
      tahun: String(row.tahun || row.Tahun || row.Sesi || row.Session || '2024/2025'),
      peringkat: String(row.peringkat || row.Peringkat || row.Category || 'Kolej'),
      catatan: String(row.catatan || row.Catatan || row.Remarks || ''),
    };
  });
}
