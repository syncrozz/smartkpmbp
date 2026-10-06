/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Trash2 } from 'lucide-react';
import { Staff } from '../types';
import { determineBahagian } from '../utils/staffGrade';

interface AddEditStaffModalProps {
  staff: Staff | null; // If null, we are in "Add" mode; else "Edit" mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: Staff) => void;
  onDelete?: (id: string) => void;
}

export const AddEditStaffModal: React.FC<AddEditStaffModalProps> = ({
  staff,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Partial<Staff>>({
    ID: '',
    Bahagian: 'Akademik',
    DepartmentID: 'JTM',
    Nama: '',
    Jawatan: '',
    Kelulusan: '',
    Pengkhususan: '',
    Telefon: '07-8842222',
    WhatsApp: '60',
    Sambungan: '',
    Email: '',
    'URL Profil': '',
    Sumber: 'Manual',
    Status: 'Aktif',
    LastSync: '',
  });

  useEffect(() => {
    if (staff) {
      setFormData(staff);
    } else {
      // Auto-generate ID for new staff
      const randId = `STF-${Math.floor(100 + Math.random() * 900)}`;
      setFormData({
        ID: randId,
        Bahagian: 'Akademik',
        DepartmentID: 'JTM',
        Nama: '',
        Jawatan: '',
        Kelulusan: '',
        Pengkhususan: '',
        Telefon: '07-8842222',
        WhatsApp: '60',
        Sambungan: '',
        Email: '',
        'URL Profil': '',
        Sumber: 'Manual',
        Status: 'Aktif',
        LastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
    }
  }, [staff, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Nama || !formData.Jawatan || !formData.Email) {
      alert('Sila isi maklumat wajib: Nama, Jawatan, dan Emel.');
      return;
    }

    const { Foto, Gambar, ...restData } = formData;
    const finalStaff: Staff = {
      ...(restData as Staff),
      Bahagian: determineBahagian(formData.Jawatan, formData.Bahagian),
      LastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onSave(finalStaff);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative glass-modal rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl z-50 flex flex-col border border-white/55"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/30 flex items-center justify-between">
            <div>
              <h3 className="font-sans font-extrabold text-gray-900 text-lg leading-tight">
                {staff ? 'Kemas Kini Maklumat Staf' : 'Daftar Staf Baharu'}
              </h3>
              <p className="text-xs text-gray-500">Isi borang di bawah berpandukan standard database KPMBP</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/40 rounded-full text-gray-400 hover:text-gray-700 transition-colors border border-transparent hover:border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
            {/* Grid 1: ID, Bahagian, Dept */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">ID Staf</label>
                <input
                  type="text"
                  name="ID"
                  value={formData.ID}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-white/30 rounded-xl bg-white/20 text-gray-500 font-mono cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Bahagian</label>
                <select
                  name="Bahagian"
                  value={formData.Bahagian}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-white/40 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
                >
                  <option value="Akademik">Akademik</option>
                  <option value="Sokongan Akademik">Sokongan Akademik</option>
                  <option value="Pentadbiran">Pentadbiran</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Department ID</label>
                <select
                  name="DepartmentID"
                  value={formData.DepartmentID}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-white/40 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
                >
                  <option value="JTM">JTM (IT)</option>
                  <option value="JKA">JKA (Sains Pengurusan)</option>
                  <option value="JPA">JPA (Pengajian Am)</option>
                  <option value="HEP">HEP (Hal Ehwal Pelajar)</option>
                  <option value="Perpustakaan">Perpustakaan</option>
                  <option value="Kewangan">Kewangan</option>
                  <option value="Pentadbiran">Pentadbiran</option>
                  <option value="IT & Teknikal">IT & Teknikal</option>
                </select>
              </div>
            </div>

            {/* Nama */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Nama Penuh <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="Nama"
                required
                placeholder="cth: Tuan Haji Ahmad Safuan bin Mohamed"
                value={formData.Nama}
                onChange={handleChange}
                className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            {/* Jawatan & Gred */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Jawatan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="Jawatan"
                  required
                  placeholder="cth: Pensyarah Kanan Sains Pengurusan"
                  value={formData.Jawatan || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Gred Jawatan</label>
                <input
                  type="text"
                  name="Gred"
                  placeholder="cth: DG13, DG12, DG10, N2"
                  value={formData.Gred || formData.grade || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, Gred: val, grade: val }));
                  }}
                  className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15 uppercase font-mono"
                />
              </div>
            </div>

            {/* Grid 2: Telefon, Sambungan, WhatsApp, Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Telefon Pejabat</label>
                <input
                  type="text"
                  name="Telefon"
                  placeholder="07-8842222"
                  value={formData.Telefon}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">No. Sambungan</label>
                <input
                  type="text"
                  name="Sambungan"
                  placeholder="cth: 101"
                  value={formData.Sambungan}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">No. WhatsApp (Tanpa "+", Mula dengan "60")</label>
                <input
                  type="text"
                  name="WhatsApp"
                  placeholder="cth: 60127123456"
                  value={formData.WhatsApp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Alamat Emel Rasmi <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="Email"
                  required
                  placeholder="cth: safuan.mohamed@mara.gov.my"
                  value={formData.Email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            {/* Kelulusan */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Kelulusan Akademik</label>
              <textarea
                name="Kelulusan"
                rows={2}
                placeholder="cth: Sarjana Muda Sains Komputer (UTM), Sarjana Teknologi Maklumat (UKM)"
                value={formData.Kelulusan}
                onChange={handleChange}
                className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            {/* Pengkhususan */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Bidang Pengkhususan</label>
              <textarea
                name="Pengkhususan"
                rows={2}
                placeholder="cth: Pembangunan Web, Kecerdasan Buatan, Keselamatan Siber"
                value={formData.Pengkhususan}
                onChange={handleChange}
                className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>

            {/* SYNCROZZ Assets Profile Image Architecture Banner */}
            <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-1 text-left">
              <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                Gambar Profil (SYNCROZZ Assets Architecture)
              </span>
              <p className="text-[11px] text-slate-600 font-mono break-all leading-snug">
                Pautan automatik: <span className="font-bold text-indigo-700">https://assets.syncrozz.com/profile/staff/{(formData.ID || 'ST000').replace(/^STF-/i, 'ST')}.webp</span>
              </p>
              <p className="text-[10px] text-slate-400 italic">
                Sistem menjana gambar profil secara automatik berpandukan ID Staf tanpa menyimpan URL dalam pangkalan data.
              </p>
            </div>

            {/* URL Profil Web KPMBP */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Pautan Halaman Profil KPMBP (Pilihan)</label>
              <input
                type="url"
                name="URL Profil"
                placeholder="https://kpmbp.mara.gov.my/..."
                value={formData['URL Profil']}
                onChange={handleChange}
                className="w-full px-4 py-2 text-xs border border-white/50 rounded-xl bg-white/40 text-gray-800 font-semibold focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/15 font-mono"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/30 bg-white/25 flex items-center justify-between backdrop-blur-md">
            {staff && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Adakah anda pasti mahu memadam rekod staf ini?')) {
                    onDelete(staff.ID);
                    onClose();
                  }
                }}
                className="py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Padam Rekod
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-white/40 hover:bg-white/70 border border-white/60 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
