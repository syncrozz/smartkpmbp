export interface BahagianTheme {
  bg: string;
  badge: string;
  avatarBg: string;
  ring: string;
  banner: string;
  buttonPrimary: string;
}

export const getBahagianTheme = (bahagian: any = ''): BahagianTheme => {
  const b = String(bahagian || '').trim();

  if (b.includes('Akademik') && !b.includes('Sokongan')) {
    // Soft Pastel Yellow / Amber
    return {
      bg: 'hover:border-amber-300 hover:shadow-amber-100/60',
      badge: 'bg-amber-100/80 text-amber-900 border-amber-200/80',
      avatarBg: 'bg-gradient-to-tr from-amber-200 via-amber-100 to-yellow-100 text-amber-950 shadow-amber-200/40',
      ring: 'ring-2 ring-amber-400/50',
      banner: 'bg-gradient-to-r from-amber-500 to-amber-600',
      buttonPrimary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
    };
  }

  if (b.includes('Sokongan Akademik')) {
    // Soft Pastel Blue / Sky
    return {
      bg: 'hover:border-sky-300 hover:shadow-sky-100/60',
      badge: 'bg-sky-100/80 text-sky-900 border-sky-200/80',
      avatarBg: 'bg-gradient-to-tr from-sky-200 via-sky-100 to-blue-100 text-sky-950 shadow-sky-200/40',
      ring: 'ring-2 ring-sky-400/50',
      banner: 'bg-gradient-to-r from-sky-600 to-blue-600',
      buttonPrimary: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200',
    };
  }

  if (b.includes('Pengurusan')) {
    // Soft Pastel Yellow / Amber
    return {
      bg: 'hover:border-amber-300 hover:shadow-amber-100/60',
      badge: 'bg-amber-100/80 text-amber-900 border-amber-200/80',
      avatarBg: 'bg-gradient-to-tr from-amber-200 via-amber-100 to-yellow-100 text-amber-950 shadow-amber-200/40',
      ring: 'ring-2 ring-amber-400/50',
      banner: 'bg-gradient-to-r from-amber-500 to-amber-600',
      buttonPrimary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
    };
  }

  if (b.includes('Sains Kuantitatif')) {
    // Soft Pastel Indigo / Violet
    return {
      bg: 'hover:border-indigo-300 hover:shadow-indigo-100/60',
      badge: 'bg-indigo-100/80 text-indigo-900 border-indigo-200/80',
      avatarBg: 'bg-gradient-to-tr from-indigo-200 via-indigo-100 to-violet-100 text-indigo-950 shadow-indigo-200/40',
      ring: 'ring-2 ring-indigo-400/50',
      banner: 'bg-gradient-to-r from-indigo-600 to-violet-600',
      buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
    };
  }

  if (b.includes('Pengurusan Perniagaan')) {
    // Soft Pastel Sky / Blue
    return {
      bg: 'hover:border-sky-300 hover:shadow-sky-100/60',
      badge: 'bg-sky-100/80 text-sky-900 border-sky-200/80',
      avatarBg: 'bg-gradient-to-tr from-sky-200 via-sky-100 to-blue-100 text-sky-950 shadow-sky-200/40',
      ring: 'ring-2 ring-sky-400/50',
      banner: 'bg-gradient-to-r from-sky-600 to-blue-600',
      buttonPrimary: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200',
    };
  }

  if (b.includes('Perakaunan')) {
    // Soft Pastel Emerald / Mint
    return {
      bg: 'hover:border-emerald-300 hover:shadow-emerald-100/60',
      badge: 'bg-emerald-100/80 text-emerald-900 border-emerald-200/80',
      avatarBg: 'bg-gradient-to-tr from-emerald-200 via-emerald-100 to-teal-100 text-emerald-950 shadow-emerald-200/40',
      ring: 'ring-2 ring-emerald-400/50',
      banner: 'bg-gradient-to-r from-emerald-600 to-teal-600',
      buttonPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
    };
  }

  if (b.includes('Pengajian Am')) {
    // Soft Pastel Rose / Pink
    return {
      bg: 'hover:border-rose-300 hover:shadow-rose-100/60',
      badge: 'bg-rose-100/80 text-rose-900 border-rose-200/80',
      avatarBg: 'bg-gradient-to-tr from-rose-200 via-pink-100 to-rose-100 text-rose-950 shadow-rose-200/40',
      ring: 'ring-2 ring-rose-400/50',
      banner: 'bg-gradient-to-r from-rose-500 to-pink-600',
      buttonPrimary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
    };
  }

  if (b.includes('Kaunseling')) {
    // Soft Pastel Purple / Lavender
    return {
      bg: 'hover:border-purple-300 hover:shadow-purple-100/60',
      badge: 'bg-purple-100/80 text-purple-900 border-purple-200/80',
      avatarBg: 'bg-gradient-to-tr from-purple-200 via-purple-100 to-fuchsia-100 text-purple-950 shadow-purple-200/40',
      ring: 'ring-2 ring-purple-400/50',
      banner: 'bg-gradient-to-r from-purple-600 to-fuchsia-600',
      buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200',
    };
  }

  if (b.includes('Ko-Kurikulum')) {
    // Soft Pastel Orange / Peach
    return {
      bg: 'hover:border-orange-300 hover:shadow-orange-100/60',
      badge: 'bg-orange-100/80 text-orange-900 border-orange-200/80',
      avatarBg: 'bg-gradient-to-tr from-orange-200 via-orange-100 to-amber-100 text-orange-950 shadow-orange-200/40',
      ring: 'ring-2 ring-orange-400/50',
      banner: 'bg-gradient-to-r from-orange-500 to-amber-600',
      buttonPrimary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200',
    };
  }

  if (b.includes('Pentadbiran')) {
    // Soft Pastel Teal / Mint
    return {
      bg: 'hover:border-teal-300 hover:shadow-teal-100/60',
      badge: 'bg-teal-100/80 text-teal-900 border-teal-200/80',
      avatarBg: 'bg-gradient-to-tr from-teal-200 via-teal-100 to-cyan-100 text-teal-950 shadow-teal-200/40',
      ring: 'ring-2 ring-teal-400/50',
      banner: 'bg-gradient-to-r from-teal-600 to-cyan-600',
      buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200',
    };
  }

  // Fallback Soft Pastel Slate / Indigo
  return {
    bg: 'hover:border-indigo-300 hover:shadow-indigo-100/60',
    badge: 'bg-indigo-100/80 text-indigo-900 border-indigo-200/80',
    avatarBg: 'bg-gradient-to-tr from-indigo-200 via-indigo-100 to-violet-100 text-indigo-950 shadow-indigo-200/40',
    ring: 'ring-2 ring-indigo-400/50',
    banner: 'bg-gradient-to-r from-indigo-600 to-blue-600',
    buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
  };
};
