export interface Provider {
  id: string;
  name: string;
  category: string[];
  city: 'Islamabad' | 'Lahore' | 'Karachi';
  location: string; // District/Area (e.g., F-11, DHA Phase 5, Clifton)
  distanceKm: number; // Simulated distance
  rating: number; // Out of 5
  reviews: number;
  reliabilityScore: number; // 0-100%
  cancellationRate: number; // 0-100%
  baseRateHourly: number; // PKR
  isAvailable: boolean;
  avatar: string;
  experienceYears?: number;
  certifications?: string[];
  specializations?: string[];
}

export const providers: Provider[] = [
  // ==========================================
  // --- ISLAMABAD PROVIDERS (3+ per category) ---
  // ==========================================
  // AC Repair
  {
    id: 'p_isb_ac1',
    name: 'Ali Raza',
    category: ['AC Repair', 'Electrician'],
    city: 'Islamabad',
    location: 'G-13',
    distanceKm: 2.5,
    rating: 4.8,
    reviews: 120,
    reliabilityScore: 95,
    cancellationRate: 2,
    baseRateHourly: 1500,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=aliraza',
    experienceYears: 8,
    certifications: ['HVAC Certified', 'SDA Diploma'],
    specializations: ['Compressor Overhaul', 'Smart Wiring']
  },
  {
    id: 'p_isb_ac2',
    name: 'Muhammad Usman',
    category: ['AC Repair'],
    city: 'Islamabad',
    location: 'F-11',
    distanceKm: 1.2,
    rating: 4.2,
    reviews: 85,
    reliabilityScore: 78,
    cancellationRate: 15,
    baseRateHourly: 1200,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=musman',
    experienceYears: 2,
    certifications: ['Basic AC Maintenance'],
    specializations: ['Filter Cleaning']
  },
  {
    id: 'p_isb_ac3',
    name: 'Hamza Shah',
    category: ['AC Repair', 'Electrician'],
    city: 'Islamabad',
    location: 'E-11',
    distanceKm: 3.4,
    rating: 4.6,
    reviews: 62,
    reliabilityScore: 90,
    cancellationRate: 4,
    baseRateHourly: 1400,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=hamzashah',
    experienceYears: 4,
    certifications: ['DAE Electrical'],
    specializations: ['General AC Service']
  },
  // Electrician
  {
    id: 'p_isb_el1',
    name: 'Jahangir Alvi',
    category: ['Electrician'],
    city: 'Islamabad',
    location: 'G-11',
    distanceKm: 2.1,
    rating: 4.7,
    reviews: 104,
    reliabilityScore: 96,
    cancellationRate: 2,
    baseRateHourly: 900,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=jahangir',
    experienceYears: 10,
    certifications: ['NESPAK Certified', 'Safety Specialist'],
    specializations: ['Commercial Wiring', 'Overload Protection']
  },
  {
    id: 'p_isb_el2',
    name: 'Kamran Khan',
    category: ['Plumber', 'Electrician', 'Carpenter'],
    city: 'Islamabad',
    location: 'G-11',
    distanceKm: 4.0,
    rating: 4.9,
    reviews: 210,
    reliabilityScore: 99,
    cancellationRate: 1,
    baseRateHourly: 1000,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=kamran',
    experienceYears: 12,
    certifications: ['Master Plumber', 'Safety First'],
    specializations: ['Main Sewer Leakage', 'Drain Unblocking']
  },
  // Plumber
  {
    id: 'p_isb_pl1',
    name: 'Sohail Javed',
    category: ['Plumber'],
    city: 'Islamabad',
    location: 'G-8',
    distanceKm: 1.9,
    rating: 4.5,
    reviews: 78,
    reliabilityScore: 88,
    cancellationRate: 5,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=sohail'
  },
  {
    id: 'p_isb_pl2',
    name: 'Faraz Anwar',
    category: ['Plumber'],
    city: 'Islamabad',
    location: 'F-11',
    distanceKm: 1.5,
    rating: 4.3,
    reviews: 50,
    reliabilityScore: 85,
    cancellationRate: 7,
    baseRateHourly: 1000,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=faraz'
  },
  // Carpenter
  {
    id: 'p_isb_cp1',
    name: 'Tariq Javed',
    category: ['Carpenter'],
    city: 'Islamabad',
    location: 'I-8',
    distanceKm: 3.1,
    rating: 4.6,
    reviews: 75,
    reliabilityScore: 92,
    cancellationRate: 3,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=tariq'
  },
  {
    id: 'p_isb_cp2',
    name: 'Majid Naim',
    category: ['Carpenter'],
    city: 'Islamabad',
    location: 'G-9',
    distanceKm: 2.8,
    rating: 4.4,
    reviews: 42,
    reliabilityScore: 87,
    cancellationRate: 6,
    baseRateHourly: 1200,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=majid'
  },
  // House Cleaner
  {
    id: 'p_isb_hc1',
    name: 'Noman Shah',
    category: ['House Cleaner'],
    city: 'Islamabad',
    location: 'F-6',
    distanceKm: 5.2,
    rating: 4.7,
    reviews: 140,
    reliabilityScore: 94,
    cancellationRate: 2,
    baseRateHourly: 800,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=noman'
  },
  {
    id: 'p_isb_hc2',
    name: 'Sadia Malik',
    category: ['House Cleaner'],
    city: 'Islamabad',
    location: 'G-11',
    distanceKm: 3.0,
    rating: 4.9,
    reviews: 185,
    reliabilityScore: 98,
    cancellationRate: 0,
    baseRateHourly: 950,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=sadia'
  },
  {
    id: 'p_isb_hc3',
    name: 'Kiran Yasmin',
    category: ['House Cleaner'],
    city: 'Islamabad',
    location: 'F-11',
    distanceKm: 1.0,
    rating: 4.5,
    reviews: 32,
    reliabilityScore: 88,
    cancellationRate: 4,
    baseRateHourly: 900,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=kiran'
  },
  // Painter
  {
    id: 'p_isb_pt1',
    name: 'Asif Mahmood',
    category: ['Painter'],
    city: 'Islamabad',
    location: 'G-9',
    distanceKm: 1.8,
    rating: 4.5,
    reviews: 98,
    reliabilityScore: 89,
    cancellationRate: 5,
    baseRateHourly: 1300,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=asif'
  },
  {
    id: 'p_isb_pt2',
    name: 'Shahzad Mughal',
    category: ['Painter'],
    city: 'Islamabad',
    location: 'F-8',
    distanceKm: 4.1,
    rating: 4.8,
    reviews: 110,
    reliabilityScore: 95,
    cancellationRate: 2,
    baseRateHourly: 1400,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=shahzad'
  },
  {
    id: 'p_isb_pt3',
    name: 'Bashir Ahmad',
    category: ['Painter'],
    city: 'Islamabad',
    location: 'I-9',
    distanceKm: 4.6,
    rating: 4.2,
    reviews: 54,
    reliabilityScore: 86,
    cancellationRate: 8,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=bashir'
  },

  // ==========================================
  // --- LAHORE PROVIDERS (3+ per category) ---
  // ==========================================
  // Carpenter
  {
    id: 'p_lhr_cp1',
    name: 'Bilal Butt',
    category: ['Carpenter', 'Electrician'],
    city: 'Lahore',
    location: 'Gulberg III',
    distanceKm: 2.1,
    rating: 4.8,
    reviews: 150,
    reliabilityScore: 97,
    cancellationRate: 1,
    baseRateHourly: 1400,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=bilal'
  },
  {
    id: 'p_lhr_cp2',
    name: 'Rafiq Chishti',
    category: ['Carpenter'],
    city: 'Lahore',
    location: 'Faisal Town',
    distanceKm: 3.2,
    rating: 4.6,
    reviews: 87,
    reliabilityScore: 92,
    cancellationRate: 3,
    baseRateHourly: 1200,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=rafiq'
  },
  {
    id: 'p_lhr_cp3',
    name: 'Waqas Gujjar',
    category: ['Carpenter'],
    city: 'Lahore',
    location: 'Johar Town',
    distanceKm: 4.5,
    rating: 4.4,
    reviews: 62,
    reliabilityScore: 89,
    cancellationRate: 5,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=waqas'
  },
  // House Cleaner
  {
    id: 'p_lhr_hc1',
    name: 'Yasir Arafat',
    category: ['House Cleaner'],
    city: 'Lahore',
    location: 'DHA Phase 5',
    distanceKm: 3.5,
    rating: 4.9,
    reviews: 310,
    reliabilityScore: 98,
    cancellationRate: 0,
    baseRateHourly: 900,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=yasir'
  },
  {
    id: 'p_lhr_hc2',
    name: 'Amina Bibi',
    category: ['House Cleaner'],
    city: 'Lahore',
    location: 'Model Town',
    distanceKm: 1.8,
    rating: 4.7,
    reviews: 142,
    reliabilityScore: 95,
    cancellationRate: 2,
    baseRateHourly: 850,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=amina'
  },
  {
    id: 'p_lhr_hc3',
    name: 'Shazia Parveen',
    category: ['House Cleaner'],
    city: 'Lahore',
    location: 'Gulberg III',
    distanceKm: 1.0,
    rating: 4.6,
    reviews: 79,
    reliabilityScore: 91,
    cancellationRate: 4,
    baseRateHourly: 800,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=shazia'
  },
  // Painter
  {
    id: 'p_lhr_pt1',
    name: 'Zahid Iqbal',
    category: ['Painter'],
    city: 'Lahore',
    location: 'Model Town',
    distanceKm: 1.5,
    rating: 4.4,
    reviews: 80,
    reliabilityScore: 88,
    cancellationRate: 6,
    baseRateHourly: 1200,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=zahid'
  },
  {
    id: 'p_lhr_pt2',
    name: 'Tariq Painter',
    category: ['Painter'],
    city: 'Lahore',
    location: 'DHA Phase 5',
    distanceKm: 3.9,
    rating: 4.8,
    reviews: 122,
    reliabilityScore: 96,
    cancellationRate: 2,
    baseRateHourly: 1450,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=tariqpainter'
  },
  {
    id: 'p_lhr_pt3',
    name: 'Nadeem Shah',
    category: ['Painter'],
    city: 'Lahore',
    location: 'Johar Town',
    distanceKm: 5.1,
    rating: 4.3,
    reviews: 45,
    reliabilityScore: 85,
    cancellationRate: 7,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=nadeem'
  },
  // Plumber
  {
    id: 'p_lhr_pl1',
    name: 'Sajid Mehmood',
    category: ['Plumber'],
    city: 'Lahore',
    location: 'Johar Town',
    distanceKm: 4.5,
    rating: 4.6,
    reviews: 95,
    reliabilityScore: 90,
    cancellationRate: 4,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=sajid'
  },
  {
    id: 'p_lhr_pl2',
    name: 'Akram Plumber',
    category: ['Plumber'],
    city: 'Lahore',
    location: 'DHA Phase 5',
    distanceKm: 3.2,
    rating: 4.5,
    reviews: 64,
    reliabilityScore: 87,
    cancellationRate: 6,
    baseRateHourly: 1150,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=akram'
  },
  {
    id: 'p_lhr_pl3',
    name: 'Liaquat Ali',
    category: ['Plumber'],
    city: 'Lahore',
    location: 'Model Town',
    distanceKm: 2.0,
    rating: 4.3,
    reviews: 38,
    reliabilityScore: 84,
    cancellationRate: 9,
    baseRateHourly: 1000,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=liaquat'
  },
  // AC Repair & Electrician
  {
    id: 'p_lhr_ac1',
    name: 'Imran Malik',
    category: ['AC Repair', 'Electrician'],
    city: 'Lahore',
    location: 'Gulberg III',
    distanceKm: 1.5,
    rating: 4.7,
    reviews: 130,
    reliabilityScore: 94,
    cancellationRate: 3,
    baseRateHourly: 1500,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=imranmalik'
  },
  {
    id: 'p_lhr_ac2',
    name: 'Faisal Lodhi',
    category: ['AC Repair'],
    city: 'Lahore',
    location: 'Model Town',
    distanceKm: 3.1,
    rating: 4.5,
    reviews: 74,
    reliabilityScore: 88,
    cancellationRate: 5,
    baseRateHourly: 1300,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=faisallodhi'
  },
  {
    id: 'p_lhr_el1',
    name: 'Naveed Electrician',
    category: ['Electrician'],
    city: 'Lahore',
    location: 'Johar Town',
    distanceKm: 2.8,
    rating: 4.4,
    reviews: 58,
    reliabilityScore: 89,
    cancellationRate: 4,
    baseRateHourly: 950,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=naveed'
  },

  // ==========================================
  // --- KARACHI PROVIDERS (3+ per category) ---
  // ==========================================
  // Carpenter
  {
    id: 'p_khi_cp1',
    name: 'Farhan Saeed',
    category: ['Carpenter'],
    city: 'Karachi',
    location: 'Clifton Block 5',
    distanceKm: 1.0,
    rating: 4.9,
    reviews: 240,
    reliabilityScore: 99,
    cancellationRate: 0,
    baseRateHourly: 1600,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=farhan'
  },
  {
    id: 'p_khi_cp2',
    name: 'Khalid Mahmood',
    category: ['Carpenter'],
    city: 'Karachi',
    location: 'PECHS Block 2',
    distanceKm: 3.6,
    rating: 4.7,
    reviews: 104,
    reliabilityScore: 95,
    cancellationRate: 2,
    baseRateHourly: 1300,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=khalid'
  },
  {
    id: 'p_khi_cp3',
    name: 'Yousuf Khan',
    category: ['Carpenter'],
    city: 'Karachi',
    location: 'Gulshan-e-Iqbal',
    distanceKm: 5.1,
    rating: 4.4,
    reviews: 72,
    reliabilityScore: 88,
    cancellationRate: 6,
    baseRateHourly: 1200,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=yousuf'
  },
  // House Cleaner
  {
    id: 'p_khi_hc1',
    name: 'Waseem Akram',
    category: ['House Cleaner', 'Painter'],
    city: 'Karachi',
    location: 'Gulshan-e-Iqbal',
    distanceKm: 4.8,
    rating: 4.7,
    reviews: 190,
    reliabilityScore: 93,
    cancellationRate: 3,
    baseRateHourly: 1000,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=waseem'
  },
  {
    id: 'p_khi_hc2',
    name: 'Rukhsana Bibi',
    category: ['House Cleaner'],
    city: 'Karachi',
    location: 'Clifton Block 5',
    distanceKm: 1.5,
    rating: 4.9,
    reviews: 320,
    reliabilityScore: 99,
    cancellationRate: 0,
    baseRateHourly: 950,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=rukhsana'
  },
  {
    id: 'p_khi_hc3',
    name: 'Naseem Akhtar',
    category: ['House Cleaner'],
    city: 'Karachi',
    location: 'DHA Phase 6',
    distanceKm: 3.1,
    rating: 4.6,
    reviews: 84,
    reliabilityScore: 92,
    cancellationRate: 4,
    baseRateHourly: 900,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=naseem'
  },
  // Painter
  {
    id: 'p_khi_pt1',
    name: 'Munir Painter',
    category: ['Painter'],
    city: 'Karachi',
    location: 'PECHS Block 2',
    distanceKm: 3.0,
    rating: 4.5,
    reviews: 88,
    reliabilityScore: 90,
    cancellationRate: 4,
    baseRateHourly: 1250,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=munir'
  },
  {
    id: 'p_khi_pt2',
    name: 'Saleem Qureshi',
    category: ['Painter'],
    city: 'Karachi',
    location: 'North Nazimabad',
    distanceKm: 6.0,
    rating: 4.3,
    reviews: 56,
    reliabilityScore: 86,
    cancellationRate: 7,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=saleem'
  },
  // Electrician
  {
    id: 'p_khi_el1',
    name: 'Junaid Khan',
    category: ['Electrician', 'AC Repair'],
    city: 'Karachi',
    location: 'DHA Phase 6',
    distanceKm: 2.9,
    rating: 4.5,
    reviews: 112,
    reliabilityScore: 91,
    cancellationRate: 4,
    baseRateHourly: 1500,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=junaid'
  },
  {
    id: 'p_khi_el2',
    name: 'Sohail Khan',
    category: ['Electrician'],
    city: 'Karachi',
    location: 'Gulshan-e-Iqbal',
    distanceKm: 4.2,
    rating: 4.7,
    reviews: 96,
    reliabilityScore: 94,
    cancellationRate: 2,
    baseRateHourly: 950,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=sohailkhan'
  },
  {
    id: 'p_khi_el3',
    name: 'Tariq PECHS',
    category: ['Electrician'],
    city: 'Karachi',
    location: 'PECHS Block 2',
    distanceKm: 2.5,
    rating: 4.4,
    reviews: 48,
    reliabilityScore: 88,
    cancellationRate: 5,
    baseRateHourly: 900,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=tariqpechs'
  },
  // Plumber
  {
    id: 'p_khi_pl1',
    name: 'Riaz Ahmed',
    category: ['Plumber'],
    city: 'Karachi',
    location: 'North Nazimabad',
    distanceKm: 6.2,
    rating: 4.3,
    reviews: 70,
    reliabilityScore: 85,
    cancellationRate: 8,
    baseRateHourly: 950,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=riaz'
  },
  {
    id: 'p_khi_pl2',
    name: 'Shakeel Plumber',
    category: ['Plumber'],
    city: 'Karachi',
    location: 'Clifton Block 5',
    distanceKm: 1.8,
    rating: 4.6,
    reviews: 90,
    reliabilityScore: 92,
    cancellationRate: 3,
    baseRateHourly: 1200,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=shakeel'
  },
  {
    id: 'p_khi_pl3',
    name: 'Murtaza Ali',
    category: ['Plumber'],
    city: 'Karachi',
    location: 'DHA Phase 6',
    distanceKm: 3.4,
    rating: 4.4,
    reviews: 52,
    reliabilityScore: 87,
    cancellationRate: 5,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=murtaza'
  },
  // AC Repair
  {
    id: 'p_khi_ac1',
    name: 'Asad AC Repair',
    category: ['AC Repair'],
    city: 'Karachi',
    location: 'Saddar',
    distanceKm: 5.4,
    rating: 4.5,
    reviews: 80,
    reliabilityScore: 89,
    cancellationRate: 4,
    baseRateHourly: 1400,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=asadac'
  },
  {
    id: 'p_khi_ac2',
    name: 'Imran Siddiqui',
    category: ['AC Repair'],
    city: 'Karachi',
    location: 'Clifton Block 5',
    distanceKm: 2.0,
    rating: 4.8,
    reviews: 154,
    reliabilityScore: 97,
    cancellationRate: 1,
    baseRateHourly: 1600,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=imransid'
  },
  // --- ADDED FOR EXTENDED MULTI-CITY COVERAGE ---
  {
    id: 'p_isb_pl3',
    name: 'Shahzad Plumber',
    category: ['Plumber'],
    city: 'Islamabad',
    location: 'G-11',
    distanceKm: 2.4,
    rating: 4.7,
    reviews: 60,
    reliabilityScore: 94,
    cancellationRate: 3,
    baseRateHourly: 950,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=shahzadplumber'
  },
  {
    id: 'p_isb_cp3',
    name: 'Haris Mughal',
    category: ['Carpenter'],
    city: 'Islamabad',
    location: 'F-11',
    distanceKm: 1.8,
    rating: 4.5,
    reviews: 48,
    reliabilityScore: 89,
    cancellationRate: 5,
    baseRateHourly: 1200,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=harismughal'
  },
  {
    id: 'p_lhr_ac3',
    name: 'Zeeshan AC Repair',
    category: ['AC Repair'],
    city: 'Lahore',
    location: 'Gulberg III',
    distanceKm: 1.2,
    rating: 4.6,
    reviews: 78,
    reliabilityScore: 91,
    cancellationRate: 4,
    baseRateHourly: 1400,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=zeeshan'
  },
  {
    id: 'p_lhr_el2',
    name: 'Shakeel Electrician',
    category: ['Electrician'],
    city: 'Lahore',
    location: 'DHA Phase 5',
    distanceKm: 3.4,
    rating: 4.8,
    reviews: 110,
    reliabilityScore: 96,
    cancellationRate: 2,
    baseRateHourly: 900,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=shakeel'
  },
  {
    id: 'p_khi_pt3',
    name: 'Iqbal Painter',
    category: ['Painter'],
    city: 'Karachi',
    location: 'Clifton Block 5',
    distanceKm: 1.1,
    rating: 4.4,
    reviews: 52,
    reliabilityScore: 88,
    cancellationRate: 6,
    baseRateHourly: 1100,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=iqbal'
  },
  {
    id: 'p_khi_ac3',
    name: 'Rafay AC Repair',
    category: ['AC Repair'],
    city: 'Karachi',
    location: 'PECHS Block 2',
    distanceKm: 2.8,
    rating: 4.7,
    reviews: 92,
    reliabilityScore: 93,
    cancellationRate: 2,
    baseRateHourly: 1350,
    isAvailable: true,
    avatar: 'https://i.pravatar.cc/150?u=rafay'
  }
];

export interface ServiceType {
  id: string;
  name: string;
  complexity: 'basic' | 'intermediate' | 'complex';
  basePrice: number;
}

export const services: Record<string, ServiceType> = {
  'ac_repair': { id: 'ac_repair', name: 'AC Repair', complexity: 'complex', basePrice: 1500 },
  'plumbing': { id: 'plumbing', name: 'Plumbing', complexity: 'intermediate', basePrice: 1000 },
  'electrical': { id: 'electrical', name: 'Electrical', complexity: 'basic', basePrice: 800 },
  'carpenter': { id: 'carpenter', name: 'Carpenter', complexity: 'intermediate', basePrice: 1100 },
  'house_cleaner': { id: 'house_cleaner', name: 'House Cleaner', complexity: 'basic', basePrice: 800 },
  'painter': { id: 'painter', name: 'Painter', complexity: 'complex', basePrice: 1300 }
};

// --- MOCKED NADRA DATABASE ---
export interface NadraRecord {
  cnic: string;
  name: string;
  mobile: string;
  city: 'Islamabad' | 'Lahore' | 'Karachi';
  address: string;
  motherMaidenName: string; // NEW property for security validation
  registeredMobile: string; // NEW property to match Sim registered mobile
}

export const NadraDatabase: Record<string, NadraRecord> = {
  '37405-1234567-1': {
    cnic: '37405-1234567-1',
    name: 'Muhammad Imran',
    mobile: '03312933020',
    city: 'Islamabad',
    address: 'House 45, Street 12, Sector F-11/3, Islamabad',
    motherMaidenName: 'Kausar Bibi',
    registeredMobile: '03312933020'
  },
  '35201-7654321-2': {
    cnic: '35201-7654321-2',
    name: 'Aisha Bibi',
    mobile: '03312933020',
    city: 'Lahore',
    address: 'House 112, Block J, Gulberg III, Lahore',
    motherMaidenName: 'Zainab Begum',
    registeredMobile: '03312933020'
  },
  '42201-9876543-3': {
    cnic: '42201-9876543-3',
    name: 'Syed Ali',
    mobile: '03312933020',
    city: 'Karachi',
    address: 'Flat 4B, Clifton View Apartments, Clifton Block 5, Karachi',
    motherMaidenName: 'Fatima Shah',
    registeredMobile: '03312933020'
  }
};

// --- IN-MEMORY REGISTERED USERS DATABASE ---
export interface UserCredential {
  cnic: string;
  password: string;
  name: string;
  mobile: string;
  city: 'Islamabad' | 'Lahore' | 'Karachi';
  primaryAddress: string;
  secondaryAddress1?: string;
  secondaryAddress2?: string;
}

// Prepopulate registered users for instant logins during testing!
export const RegisteredUsers: Record<string, UserCredential> = {
  '37405-1234567-1': {
    cnic: '37405-1234567-1',
    password: '123', // Simple password for quick testing
    name: 'Muhammad Imran',
    mobile: '03312933020',
    city: 'Islamabad',
    primaryAddress: 'House 45, Street 12, Sector F-11/3, Islamabad',
    secondaryAddress1: 'Office - Blue Area, Islamabad'
  },
  '35201-7654321-2': {
    cnic: '35201-7654321-2',
    password: '123',
    name: 'Aisha Bibi',
    mobile: '03312933020',
    city: 'Lahore',
    primaryAddress: 'House 112, Block J, Gulberg III, Lahore',
    secondaryAddress1: 'Office - Mall Road, Lahore'
  },
  '42201-9876543-3': {
    cnic: '42201-9876543-3',
    password: '123',
    name: 'Syed Ali',
    mobile: '03312933020',
    city: 'Karachi',
    primaryAddress: 'Flat 4B, Clifton View Apartments, Clifton Block 5, Karachi',
    secondaryAddress1: 'Office - Clifton, Karachi'
  }
};
