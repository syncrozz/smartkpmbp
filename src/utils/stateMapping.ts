const districtStateMap: Record<string, string> = {
  // Johor
  'johor bahru': 'Johor',
  'jb': 'Johor',
  'batu pahat': 'Johor',
  'kluang': 'Johor',
  'muar': 'Johor',
  'segamat': 'Johor',
  'pontian': 'Johor',
  'kota tinggi': 'Johor',
  'mersing': 'Johor',
  'kulai': 'Johor',
  'tangkak': 'Johor',
  'bandar penawar': 'Johor',
  'pasir gudang': 'Johor',
  'skudai': 'Johor',
  'yong peng': 'Johor',

  // Kedah
  'alor setar': 'Kedah',
  'sungai petani': 'Kedah',
  'kulim': 'Kedah',
  'kubang pasu': 'Kedah',
  'baling': 'Kedah',
  'langkawi': 'Kedah',
  'yan': 'Kedah',
  'pendang': 'Kedah',
  'sik': 'Kedah',
  'padang terap': 'Kedah',
  'bandar baharu': 'Kedah',
  'jitra': 'Kedah',

  // Kelantan
  'kota bharu': 'Kelantan',
  'pasir mas': 'Kelantan',
  'tumpat': 'Kelantan',
  'bachok': 'Kelantan',
  'pasir puteh': 'Kelantan',
  'machang': 'Kelantan',
  'tanah merah': 'Kelantan',
  'jeli': 'Kelantan',
  'gua musang': 'Kelantan',
  'kuala krai': 'Kelantan',

  // Pahang
  'kuantan': 'Pahang',
  'temerloh': 'Pahang',
  'bentong': 'Pahang',
  'pekan': 'Pahang',
  'rompin': 'Pahang',
  'raub': 'Pahang',
  'jerantut': 'Pahang',
  'lipis': 'Pahang',
  'cameron highlands': 'Pahang',
  'bera': 'Pahang',
  'maran': 'Pahang',

  // Melaka
  'melaka tengah': 'Melaka',
  'alor gajah': 'Melaka',
  'jasin': 'Melaka',
  'melaka': 'Melaka',

  // Negeri Sembilan
  'seremban': 'Negeri Sembilan',
  'port dickson': 'Negeri Sembilan',
  'jempol': 'Negeri Sembilan',
  'tampin': 'Negeri Sembilan',
  'kuala pilah': 'Negeri Sembilan',
  'rembau': 'Negeri Sembilan',
  'jelebu': 'Negeri Sembilan',
  'nilai': 'Negeri Sembilan',

  // Pulau Pinang
  'george town': 'Pulau Pinang Penang',
  'butterworth': 'Pulau Pinang Penang',
  'bukit mertajam': 'Pulau Pinang Penang',
  'bayan lepas': 'Pulau Pinang Penang',
  'nibong tebal': 'Pulau Pinang Penang',
  'seberang perai': 'Pulau Pinang Penang',
  'penang': 'Pulau Pinang Penang',

  // Perak
  'ipoh': 'Perak',
  'taiping': 'Perak',
  'teluk intan': 'Perak',
  'batu gajah': 'Perak',
  'kampar': 'Perak',
  'manjung': 'Perak',
  'kuala kangsar': 'Perak',
  'seri manjung': 'Perak',
  'parit buntar': 'Perak',
  'tapah': 'Perak',
  'lumut': 'Perak',

  // Perlis
  'kangar': 'Perlis',
  'arau': 'Perlis',
  'padang besar': 'Perlis',

  // Selangor
  'shah alam': 'Selangor',
  'petaling jaya': 'Selangor',
  'pj': 'Selangor',
  'subang jaya': 'Selangor',
  'klang': 'Selangor',
  'kajang': 'Selangor',
  'ampang': 'Selangor',
  'rawang': 'Selangor',
  'selayang': 'Selangor',
  'sepang': 'Selangor',
  'kuala selangor': 'Selangor',
  'hulu langat': 'Selangor',
  'kuala langat': 'Selangor',
  'sabak bernam': 'Selangor',
  'bangi': 'Selangor',
  'cyberjaya': 'Selangor',

  // Terengganu
  'kuala terengganu': 'Terengganu',
  'kemaman': 'Terengganu',
  'dungun': 'Terengganu',
  'besut': 'Terengganu',
  'marang': 'Terengganu',
  'setiu': 'Terengganu',
  'hulu terengganu': 'Terengganu',

  // Sabah
  'kota kinabalu': 'Sabah',
  'sandakan': 'Sabah',
  'tawau': 'Sabah',
  'lahad datu': 'Sabah',
  'keningau': 'Sabah',
  'putatan': 'Sabah',
  'penampang': 'Sabah',

  // Sarawak
  'kuching': 'Sarawak',
  'miri': 'Sarawak',
  'sibu': 'Sarawak',
  'bintulu': 'Sarawak',
  'samarahan': 'Sarawak',
  'sri aman': 'Sarawak',
  'limbang': 'Sarawak',

  // Wilayah Persekutuan
  'kuala lumpur': 'Wilayah Persekutuan Kuala Lumpur WP KL',
  'putrajaya': 'Wilayah Persekutuan Putrajaya WP Putrajaya',
  'labuan': 'Wilayah Persekutuan Labuan WP Labuan',
};

export function getDistrictState(daerah: string): string {
  if (!daerah) return '';
  const clean = daerah.toLowerCase().trim();
  for (const [key, value] of Object.entries(districtStateMap)) {
    if (clean.includes(key)) {
      return value;
    }
  }
  return '';
}
