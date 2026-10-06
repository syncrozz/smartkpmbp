export const getGredBadgeStyle = (gred: any): string => {
  const g = String(gred || '').toUpperCase().trim();

  if (g.includes('DG12') || g.includes('JUSA') || g.includes('VK')) {
    // Pastel Warm Gold / Amber
    return 'bg-amber-100/90 text-amber-900 border border-amber-300/80 shadow-2xs';
  }
  if (g.includes('DG54') || g.includes('DG52')) {
    // Pastel Lavender / Violet
    return 'bg-purple-100/90 text-purple-900 border border-purple-300/80 shadow-2xs';
  }
  if (g.includes('DG48')) {
    // Pastel Rose / Magenta
    return 'bg-pink-100/90 text-pink-900 border border-pink-300/80 shadow-2xs';
  }
  if (g.includes('DG44')) {
    // Pastel Sky Blue
    return 'bg-sky-100/90 text-sky-900 border border-sky-300/80 shadow-2xs';
  }
  if (g.includes('DG41') || g.startsWith('DG')) {
    // Pastel Teal / Mint
    return 'bg-teal-100/90 text-teal-900 border border-teal-300/80 shadow-2xs';
  }
  if (g.startsWith('F')) {
    // Pastel Emerald Green (IT/Teknologi)
    return 'bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 shadow-2xs';
  }
  if (g.startsWith('S')) {
    // Pastel Peach / Orange (Kaunselor/Sosial)
    return 'bg-orange-100/90 text-orange-900 border border-orange-300/80 shadow-2xs';
  }
  if (g.startsWith('N') || g.startsWith('W') || g.startsWith('KP')) {
    // Pastel Cream / Yellow (Pentadbiran/Kewangan)
    return 'bg-yellow-100/90 text-yellow-950 border border-yellow-300/80 shadow-2xs';
  }

  // Default Pastel Indigo
  return 'bg-indigo-100/90 text-indigo-900 border border-indigo-300/80 shadow-2xs';
};
