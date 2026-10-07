export interface PakistanCityItem {
  name: string;
  province: string;
  isPopular?: boolean;
}

export const PAKISTAN_PROVINCES = [
  'All Cities (A-Z)',
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa (KPK)',
  'Balochistan',
  'Islamabad (Capital)',
  'Gilgit-Baltistan',
  'Azad Kashmir (AJK)'
] as const;

export type ProvinceType = typeof PAKISTAN_PROVINCES[number];

export const PAKISTAN_CITIES: PakistanCityItem[] = [
  // --- A ---
  { name: 'Abbottabad', province: 'Khyber Pakhtunkhwa (KPK)', isPopular: true },
  { name: 'Ahmed Nager Chatha', province: 'Punjab' },
  { name: 'Ali Khan Abad', province: 'Punjab' },
  { name: 'Aliabad (Hunza)', province: 'Gilgit-Baltistan' },
  { name: 'Alipur', province: 'Punjab' },
  { name: 'Alpuri', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Arifwala', province: 'Punjab' },
  { name: 'Astore', province: 'Gilgit-Baltistan' },
  { name: 'Attock', province: 'Punjab' },
  { name: 'Awaran', province: 'Balochistan' },

  // --- B ---
  { name: 'Badin', province: 'Sindh' },
  { name: 'Bagh', province: 'Azad Kashmir (AJK)' },
  { name: 'Bahawalnagar', province: 'Punjab' },
  { name: 'Bahawalpur', province: 'Punjab', isPopular: true },
  { name: 'Bandhi', province: 'Sindh' },
  { name: 'Bannu', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Barkhan', province: 'Balochistan' },
  { name: 'Batkhela', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Battagram', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Bela', province: 'Balochistan' },
  { name: 'Berani', province: 'Sindh' },
  { name: 'Bhag', province: 'Balochistan' },
  { name: 'Bhakkar', province: 'Punjab' },
  { name: 'Bhalwal', province: 'Punjab' },
  { name: 'Bhimber', province: 'Azad Kashmir (AJK)' },
  { name: 'Bhiria City', province: 'Sindh' },
  { name: 'Buner', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Burewala', province: 'Punjab' },

  // --- C ---
  { name: 'Chachro', province: 'Sindh' },
  { name: 'Chakdara', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Chakswari', province: 'Azad Kashmir (AJK)' },
  { name: 'Chakwal', province: 'Punjab' },
  { name: 'Chaman', province: 'Balochistan' },
  { name: 'Charsadda', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Chichawatni', province: 'Punjab' },
  { name: 'Chilas', province: 'Gilgit-Baltistan' },
  { name: 'Chiniot', province: 'Punjab' },
  { name: 'Chishtian', province: 'Punjab' },
  { name: 'Chitral', province: 'Khyber Pakhtunkhwa (KPK)' },

  // --- D ---
  { name: 'Dadu', province: 'Sindh' },
  { name: 'Dadyal', province: 'Azad Kashmir (AJK)' },
  { name: 'Daharki', province: 'Sindh' },
  { name: 'Dalbandin', province: 'Balochistan' },
  { name: 'Dargai', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Daska', province: 'Punjab' },
  { name: 'Dera Bugti', province: 'Balochistan' },
  { name: 'Dera Ghazi Khan', province: 'Punjab' },
  { name: 'Dera Ismail Khan', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Diamer', province: 'Gilgit-Baltistan' },
  { name: 'Digri', province: 'Sindh' },
  { name: 'Dina', province: 'Punjab' },
  { name: 'Dir', province: 'Khyber Pakhtunkhwa (KPK)' },

  // --- F ---
  { name: 'Faisalabad', province: 'Punjab', isPopular: true },
  { name: 'Fateh Jang', province: 'Punjab' },
  { name: 'Fazilpur', province: 'Punjab' },

  // --- G ---
  { name: 'Gaddani', province: 'Balochistan' },
  { name: 'Gambat', province: 'Sindh' },
  { name: 'Ghotki', province: 'Sindh' },
  { name: 'Gilgit', province: 'Gilgit-Baltistan', isPopular: true },
  { name: 'Gojra', province: 'Punjab' },
  { name: 'Gujar Khan', province: 'Punjab' },
  { name: 'Gujranwala', province: 'Punjab', isPopular: true },
  { name: 'Gujrat', province: 'Punjab' },
  { name: 'Gwadar', province: 'Balochistan', isPopular: true },

  // --- H ---
  { name: 'Hafizabad', province: 'Punjab' },
  { name: 'Hala', province: 'Sindh' },
  { name: 'Hangu', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Haripur', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Haroonabad', province: 'Punjab' },
  { name: 'Hasan Abdal', province: 'Punjab' },
  { name: 'Havelian', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Hub', province: 'Balochistan' },
  { name: 'Hunza', province: 'Gilgit-Baltistan', isPopular: true },
  { name: 'Hyderabad', province: 'Sindh', isPopular: true },

  // --- I ---
  { name: 'Islamabad', province: 'Islamabad (Capital)', isPopular: true },
  { name: 'Islamkot', province: 'Sindh' },

  // --- J ---
  { name: 'Jacobabad', province: 'Sindh' },
  { name: 'Jafarabad', province: 'Balochistan' },
  { name: 'Jahanian', province: 'Punjab' },
  { name: 'Jalalpur Jattan', province: 'Punjab' },
  { name: 'Jamshoro', province: 'Sindh' },
  { name: 'Jaranwala', province: 'Punjab' },
  { name: 'Jauharabad', province: 'Punjab' },
  { name: 'Jhang', province: 'Punjab' },
  { name: 'Jhelum', province: 'Punjab' },

  // --- K ---
  { name: 'Kalat', province: 'Balochistan' },
  { name: 'Kamalia', province: 'Punjab' },
  { name: 'Kamoke', province: 'Punjab' },
  { name: 'Kandhkot', province: 'Sindh' },
  { name: 'Kandiaro', province: 'Sindh' },
  { name: 'Karachi', province: 'Sindh', isPopular: true },
  { name: 'Karak', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Karimabad', province: 'Gilgit-Baltistan' },
  { name: 'Kashmore', province: 'Sindh' },
  { name: 'Kasur', province: 'Punjab' },
  { name: 'Khairpur', province: 'Sindh' },
  { name: 'Khanewal', province: 'Punjab' },
  { name: 'Khanpur', province: 'Punjab' },
  { name: 'Kharian', province: 'Punjab' },
  { name: 'Khushab', province: 'Punjab' },
  { name: 'Khuzdar', province: 'Balochistan' },
  { name: 'Kohat', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Kot Addu', province: 'Punjab' },
  { name: 'Kotli', province: 'Azad Kashmir (AJK)' },

  // --- L ---
  { name: 'Lahore', province: 'Punjab', isPopular: true },
  { name: 'Lakki Marwat', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Lalamusa', province: 'Punjab' },
  { name: 'Larkana', province: 'Sindh' },
  { name: 'Layyah', province: 'Punjab' },
  { name: 'Lodhran', province: 'Punjab' },
  { name: 'Loralai', province: 'Balochistan' },

  // --- M ---
  { name: 'Malakand', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Mandi Bahauddin', province: 'Punjab' },
  { name: 'Mansehra', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Mardan', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Matiari', province: 'Sindh' },
  { name: 'Mian Channu', province: 'Punjab' },
  { name: 'Mianwali', province: 'Punjab' },
  { name: 'Mingora', province: 'Khyber Pakhtunkhwa (KPK)', isPopular: true },
  { name: 'Mirpur', province: 'Azad Kashmir (AJK)', isPopular: true },
  { name: 'Mirpur Khas', province: 'Sindh' },
  { name: 'Moro', province: 'Sindh' },
  { name: 'Multan', province: 'Punjab', isPopular: true },
  { name: 'Muridke', province: 'Punjab' },
  { name: 'Murree', province: 'Punjab', isPopular: true },
  { name: 'Muzaffarabad', province: 'Azad Kashmir (AJK)', isPopular: true },
  { name: 'Muzaffargarh', province: 'Punjab' },

  // --- N ---
  { name: 'Nankana Sahib', province: 'Punjab' },
  { name: 'Narowal', province: 'Punjab' },
  { name: 'Naseerabad', province: 'Balochistan' },
  { name: 'Naushahro Feroze', province: 'Sindh' },
  { name: 'Nawabshah', province: 'Sindh' },
  { name: 'Nowshera', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Nushki', province: 'Balochistan' },

  // --- O ---
  { name: 'Okara', province: 'Punjab' },
  { name: 'Ormara', province: 'Balochistan' },

  // --- P ---
  { name: 'Pakpattan', province: 'Punjab' },
  { name: 'Panjgur', province: 'Balochistan' },
  { name: 'Pasni', province: 'Balochistan' },
  { name: 'Peshawar', province: 'Khyber Pakhtunkhwa (KPK)', isPopular: true },
  { name: 'Pishin', province: 'Balochistan' },

  // --- Q ---
  { name: 'Quetta', province: 'Balochistan', isPopular: true },

  // --- R ---
  { name: 'Rahim Yar Khan', province: 'Punjab' },
  { name: 'Rawalakot', province: 'Azad Kashmir (AJK)' },
  { name: 'Rawalpindi', province: 'Punjab', isPopular: true },
  { name: 'Rohri', province: 'Sindh' },

  // --- S ---
  { name: 'Sadiqabad', province: 'Punjab' },
  { name: 'Sahiwal', province: 'Punjab' },
  { name: 'Saidu Sharif', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Sanghar', province: 'Sindh' },
  { name: 'Sargodha', province: 'Punjab' },
  { name: 'Sehwan Sharif', province: 'Sindh' },
  { name: 'Shabqadar', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Sheikhupura', province: 'Punjab' },
  { name: 'Shikarpur', province: 'Sindh' },
  { name: 'Sialkot', province: 'Punjab', isPopular: true },
  { name: 'Sibi', province: 'Balochistan' },
  { name: 'Skardu', province: 'Gilgit-Baltistan', isPopular: true },
  { name: 'Sukkur', province: 'Sindh', isPopular: true },
  { name: 'Swabi', province: 'Khyber Pakhtunkhwa (KPK)' },
  { name: 'Swat', province: 'Khyber Pakhtunkhwa (KPK)', isPopular: true },

  // --- T ---
  { name: 'Taxila', province: 'Punjab' },
  { name: 'Toba Tek Singh', province: 'Punjab' },
  { name: 'Turbat', province: 'Balochistan' },

  // --- U ---
  { name: 'Umerkot', province: 'Sindh' },

  // --- V ---
  { name: 'Vehari', province: 'Punjab' },

  // --- W ---
  { name: 'Wah Cantt', province: 'Punjab' },
  { name: 'Wazirabad', province: 'Punjab' },

  // --- Z ---
  { name: 'Zhob', province: 'Balochistan' },
  { name: 'Ziarat', province: 'Balochistan' }
].sort((a, b) => a.name.localeCompare(b.name));

// Unique first letters in alphabetical order
export const ALPHABET_LETTERS = Array.from(
  new Set(PAKISTAN_CITIES.map(c => c.name.charAt(0).toUpperCase()))
).sort();
