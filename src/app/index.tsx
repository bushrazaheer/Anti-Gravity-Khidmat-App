import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Head from 'expo-router/head';
import { agent, MatchedProvider, addTrace } from '@/engine/AntigravityAgent';
import { ProviderCard } from '@/components/ProviderCard';
import { NadraDatabase, NadraRecord, RegisteredUsers, UserCredential, providers } from '@/data/mockData';
import { sendWhatsAppNotification, getWhatsAppRedirectUrl } from '@/engine/whatsapp';

const generateUniqueId = () => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

interface UserProfile {
  cnic: string;
  name: string;
  mobile: string;
  city: 'Islamabad' | 'Lahore' | 'Karachi';
  primaryAddress: string;
  secondaryAddress1?: string;
  secondaryAddress2?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  providers?: MatchedProvider[];
  isTyping?: boolean;
  type?: 'text' | 'location_select' | 'timeslot_select' | 'date_select' | 'dispute_select' | 'dispute_action_select' | 'refund_voucher' | 'fallback_select';
  options?: string[];
  details?: any;
}

type AuthMode = 'login' | 'reg_cnic' | 'reg_details' | 'reg_otp' | 'reg_password' | 'chat';

const serviceTranslations: Record<string, Record<'roman_urdu' | 'english' | 'urdu', string>> = {
  'AC Repair': {
    roman_urdu: 'AC Repair',
    english: 'AC Repair',
    urdu: 'اے سی سروس'
  },
  'Electrician': {
    roman_urdu: 'Electrician',
    english: 'Electrician',
    urdu: 'الیکٹریشن'
  },
  'Plumber': {
    roman_urdu: 'Plumber',
    english: 'Plumber',
    urdu: 'پلمبر'
  },
  'Carpenter': {
    roman_urdu: 'Carpenter',
    english: 'Carpenter',
    urdu: 'کارپینٹر'
  },
  'Mechanic': {
    roman_urdu: 'Mechanic',
    english: 'Mechanic',
    urdu: 'میکینک'
  },
  'House Cleaner': {
    roman_urdu: 'House Cleaner',
    english: 'House Cleaner',
    urdu: 'خادمہ / صفائی'
  },
  'Painter': {
    roman_urdu: 'Painter',
    english: 'Painter',
    urdu: 'پینٹر'
  }
};

const translations: Record<'roman_urdu' | 'english' | 'urdu', {
  welcomeMessage: (name: string, city: string) => string;
  clarifyMessage: string;
  confirmLocation: (serviceType: string) => string;
  proximityApology: (location: string, serviceType: string) => string;
  matchingIntro: (score: number) => string;
  selectDate: (providerName: string) => string;
  noSlotsToday: string;
  selectTimeSlot: (providerName: string, dateOption: string) => string;
  bookingSuccess: (providerName: string, date: string, slot: string) => string;
  whatsappText: (name: string, mobile: string, serviceType: string, providerName: string, date: string, slot: string, location: string, total: number) => string;
  reminderText: (providerName: string, serviceType: string) => string;
  greetingResponse: string;
  thanksResponse: string;
  okResponse: string;
  selectedDateMsg: (date: string) => string;
  selectedSlotMsg: (slot: string) => string;
}> = {
  roman_urdu: {
    welcomeMessage: (name: string, city: string) => `Assalam o Alaikum, ${name}! Khidmat 24/7 AI Service Orchestrator me aapka khush amdeed.\n\nAapki profile successfully login ho chuki hai. Registered shehar: ${city}.\n\nAaj aapko kis kisam ki service chahiye? (e.g. "I need a Carpenter", "House Cleaner chahiye", "Painter jaldi bheinjein")`,
    clarifyMessage: 'Maazrat, kya aap thoda wazeh kar sakte hain ke aapko kya service chahiye?',
    confirmLocation: (serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.roman_urdu || serviceType;
      return `[Booking Agent] Aapki request ${trans} ke liye hai. Please service ki location confirm karein:`;
    },
    proximityApology: (location: string, serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.roman_urdu || serviceType;
      return `Maazrat, hum bohot sharminda hain par aapke bataye hue location "${location}" me abhi hamara koi ${trans} dastyab nahi hai. Insha'Allah hum jald hi aapke area me apni services shuru karenge!`;
    },
    matchingIntro: (score: number) => `Humne aapke location ke mutabiq providers dhoond liye hain (AI Match Confidence: ${score}%):`,
    selectDate: (providerName: string) => `[Booking Agent] Please select your preferred arrival Date for ${providerName}:`,
    noSlotsToday: `[Booking Agent] Maazrat, aaj ke din ke liye ab koi time slot available nahi hai (minimum 2 hours advance booking ki zaroorat hai).\n\nPlease select another date from the options above or schedule for tomorrow/day after.`,
    selectTimeSlot: (providerName: string, dateOption: string) => `[Booking Agent] Please select your preferred arrival time slot for ${providerName} on ${dateOption}:`,
    bookingSuccess: (providerName: string, date: string, slot: string) => `🎉 Shabaash! Aapki booking ${providerName} ke sath confirm ho chuki hai for ${date} (${slot}).\n\n✅ WhatsApp message aur status details bhej diye gaye hain.`,
    whatsappText: (name: string, mobile: string, serviceType: string, providerName: string, date: string, slot: string, location: string, total: number) => {
      const trans = serviceTranslations[serviceType]?.roman_urdu || serviceType;
      return `🟢 WhatsApp Confirmation\nTo: ${name} (${mobile})\nYour Khidmat booking for ${trans} with ${providerName} is confirmed for ${date} at ${slot} at ${location}. Total: Rs ${total}.`;
    },
    reminderText: (providerName: string, serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.roman_urdu || serviceType;
      return `🔔 Khidmat Notification (1hr before)\nReminder: ${providerName} (${trans}) is scheduled to arrive at your address in 1 hour!`;
    },
    greetingResponse: 'Wa Alaikum Assalam! Mai Khidmat AI Assistant hoon. Aapko aaj kya service chahiye? (AC Repair, Electrician, Plumber, Carpenter, House Cleaner, Painter)',
    thanksResponse: 'Bohot shukriya! Agar aapko koi aur service chahiye to zaroor batayein. Khidmat 24/7 hamesha aapke sath hai!',
    okResponse: 'Ji bilkul! Please batayein mai aapki kya madad kar sakta hoon?',
    selectedDateMsg: (date: string) => `Selected Date: ${date}`,
    selectedSlotMsg: (slot: string) => `Selected Time Slot: ${slot}`
  },
  english: {
    welcomeMessage: (name: string, city: string) => `Assalam o Alaikum, ${name}! Welcome to Khidmat 24/7 AI Service Orchestrator.\n\nYour profile has been logged in successfully. Registered City: ${city}.\n\nWhat service do you need today? (e.g. "I need a Carpenter", "House Cleaner chahiye", "Painter jaldi bheinjein")`,
    clarifyMessage: 'We apologize, could you please clarify what service you require?',
    confirmLocation: (serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.english || serviceType;
      return `[Booking Agent] Your request is for ${trans}. Please confirm your service location:`;
    },
    proximityApology: (location: string, serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.english || serviceType;
      return `We apologize, but there are no operational ${trans}s available at your specified location "${location}". God willing, we will expand our services to your area soon!`;
    },
    matchingIntro: (score: number) => `We found providers matching your location (AI Match Confidence: ${score}%):`,
    selectDate: (providerName: string) => `[Booking Agent] Please select your preferred arrival Date for ${providerName}:`,
    noSlotsToday: `[Booking Agent] We apologize, there are no more slots available for today (minimum 2 hours advance booking required).\n\nPlease select another date from the options above or schedule for tomorrow/day after.`,
    selectTimeSlot: (providerName: string, dateOption: string) => `[Booking Agent] Please select your preferred arrival time slot for ${providerName} on ${dateOption}:`,
    bookingSuccess: (providerName: string, date: string, slot: string) => `🎉 Success! Your booking with ${providerName} has been confirmed for ${date} (${slot}).\n\n✅ WhatsApp confirmation and status details have been dispatched.`,
    whatsappText: (name: string, mobile: string, serviceType: string, providerName: string, date: string, slot: string, location: string, total: number) => {
      const trans = serviceTranslations[serviceType]?.english || serviceType;
      return `🟢 WhatsApp Confirmation\nTo: ${name} (${mobile})\nYour Khidmat booking for ${trans} with ${providerName} is confirmed for ${date} at ${slot} at ${location}. Total: Rs ${total}.`;
    },
    reminderText: (providerName: string, serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.english || serviceType;
      return `🔔 Khidmat Notification (1hr before)\nReminder: ${providerName} (${trans}) is scheduled to arrive at your address in 1 hour!`;
    },
    greetingResponse: 'Hello! I am your Khidmat AI Assistant. What service do you need today? (AC Repair, Electrician, Plumber, Carpenter, House Cleaner, Painter)',
    thanksResponse: 'You are very welcome! Let me know if you need any other service. Khidmat 24/7 is always here for you!',
    okResponse: 'Perfect! Please let me know how I can help you today.',
    selectedDateMsg: (date: string) => `Selected Date: ${date}`,
    selectedSlotMsg: (slot: string) => `Selected Time Slot: ${slot}`
  },
  urdu: {
    welcomeMessage: (name: string, city: string) => `السلام علیکم، ${name}! خدمت 24/7 اے آئی سروس آرکیسٹریٹر میں آپ کا خوش آمدید۔\n\nآپ کا پروفائل کامیابی کے ساتھ لاگ ان ہو چکا ہے۔ رجسٹرڈ شہر: ${city}۔\n\nآپ کو آج کس قسم کی سروس چاہیے؟ (مثال کے طور پر: "مجھے کارپینٹر چاہیے"، "ہاؤس کلینر بھیجیں")`,
    clarifyMessage: 'معذرت، کیا آپ تھوڑا واضح کر سکتے ہیں کہ آپ کو کیا سروس چاہیے؟',
    confirmLocation: (serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.urdu || serviceType;
      return `[بکنگ ایجنٹ] آپ کی درخواست ${trans} کے لیے ہے۔ براہ کرم سروس کی لوکیشن کی تصدیق کریں:`;
    },
    proximityApology: (location: string, serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.urdu || serviceType;
      return `معذرت، ہم بہت شرمندہ ہیں لیکن آپ کی بتائی ہوئی لوکیشن "${location}" میں ابھی ہمارا کوئی ${trans} دستیاب نہیں ہے۔ ان شاء اللہ ہم جلد ہی آپ کے علاقے میں اپنی سروسز شروع کریں گے!`;
    },
    matchingIntro: (score: number) => `ہم نے آپ کی لوکیشن کے مطابق سروس فراہم کنندگان تلاش کر لیے ہیں (AI میچ اعتمادی سکور: ${score}٪):`,
    selectDate: (providerName: string) => `[بکنگ ایجنٹ] براہ کرم ${providerName} کے لیے اپنی پسندیدہ آمد کی تاریخ منتخب کریں:`,
    noSlotsToday: `[بکنگ ایجنٹ] معذرت، آج کے دن کے لیے اب کوئی ٹائم سلاٹ دستیاب نہیں ہے (کم از کم 2 گھنٹے پہلے بکنگ لازمی ہے)۔\n\nبراہ کرم اوپر دیے گئے اختیارات میں سے کوئی دوسری تاریخ منتخب کریں یا کل/پرسوں کے لیے شیڈول کریں۔`,
    selectTimeSlot: (providerName: string, dateOption: string) => `[بکنگ ایجنٹ] براہ کرم ${dateOption} کو ${providerName} کے لیے اپنی پسندیدہ آمد کا ٹائم سلاٹ منتخب کریں:`,
    bookingSuccess: (providerName: string, date: string, slot: string) => `🎉 مبارک ہو! ${providerName} کے ساتھ آپ کی بکنگ ${date} (${slot}) کے لیے کنفرم ہو چکی ہے۔\n\n✅ واٹس ایپ پیغام اور اسٹیٹس کی تفصیلات بھیج دی گئی ہیں۔`,
    whatsappText: (name: string, mobile: string, serviceType: string, providerName: string, date: string, slot: string, location: string, total: number) => {
      const trans = serviceTranslations[serviceType]?.urdu || serviceType;
      return `🟢 واٹس ایپ تصدیق\nبنام: ${name} (${mobile})\nآپ کی خدمت بکنگ برائے ${trans} ہمراہ ${providerName} تاریخ ${date} بوقت ${slot} بمقام ${location} کنفرم ہو گئی ہے۔ کل رقم: روپے ${total}۔`;
    },
    reminderText: (providerName: string, serviceType: string) => {
      const trans = serviceTranslations[serviceType]?.urdu || serviceType;
      return `🔔 خدمت الرٹ (1 گھنٹہ پہلے)\nیاددہانی: ${providerName} (${trans}) 1 گھنٹے میں آپ کے پتے پر پہنچ رہے ہیں!`;
    },
    greetingResponse: 'وعلیکم السلام! میں خدمت اے آئی اسسٹنٹ ہوں۔ آج آپ کو کیا سروس چاہیے؟ (اے سی سروس، الیکٹریشن، پلمبر، کارپینٹر، خادمہ / صفائی، پینٹر)',
    thanksResponse: 'بہت شکریہ! اگر آپ کو کسی اور سروس کی ضرورت ہو تو ضرور بتائیں۔ خدمت 24/7 ہمیشہ آپ کے ساتھ ہے!',
    okResponse: 'جی بالکل! براہ کرم بتائیں میں آپ کی کیا مدد کر سکتا ہوں؟',
    selectedDateMsg: (date: string) => `منتخب تاریخ: ${date}`,
    selectedSlotMsg: (slot: string) => `منتخب ٹائم سلاٹ: ${slot}`
  }
};

interface BookedSlot {
  providerId: string;
  dateKey: 'today' | 'tomorrow' | 'dayAfter';
  slot: string;
}

// Global registry of booked slots to simulate and test overlapping/collision bookings
export const bookedSlotsRegistry: BookedSlot[] = [];

export default function HomeScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('login'); // Default is Login

  // --- CHAT LANGUAGE STATE ---
  const [chatLanguage, setChatLanguage] = useState<'roman_urdu' | 'english' | 'urdu'>('roman_urdu');

  // --- LOGIN STATE ---
  const [loginCnic, setLoginCnic] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // --- WIZARD REGISTRATION STATE ---
  const [regCnic, setRegCnic] = useState('');
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regMother, setRegMother] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSecAddr1, setRegSecAddr1] = useState('');
  const [regSecAddr2, setRegSecAddr2] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [currentNadraRecord, setCurrentNadraRecord] = useState<NadraRecord | null>(null);

  // --- ACTIVE SESSION PROFILE ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // --- CHAT STATE ---
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIntent, setCurrentIntent] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<MatchedProvider | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [rawSelectedDateKey, setRawSelectedDateKey] = useState<'today' | 'tomorrow' | 'dayAfter' | null>(null);
  const [rawSelectedSlotLabel, setRawSelectedSlotLabel] = useState<string | null>(null);
  const [activeBooking, setActiveBooking] = useState<{
    id: string;
    providerName: string;
    total: number;
    date: string;
    slot: string;
    status: 'confirmed' | 'en_route' | 'arrived' | 'completed' | 'disputed' | 'refunded';
    reliabilityScore: number;
    bookingDateKey: 'today' | 'tomorrow' | 'dayAfter';
    bookingSlotLabel: string;
  } | null>(null);

  const [simulatedTimeOffset, setSimulatedTimeOffset] = useState<number>(0);
  const [isBookingCardCollapsed, setIsBookingCardCollapsed] = useState(true);

  // --- CUSTOM LOCATION MODAL STATE ---
  const [isCustomLocModalVisible, setIsCustomLocModalVisible] = useState(false);
  const [customLocCity, setCustomLocCity] = useState<'Islamabad' | 'Lahore' | 'Karachi'>('Islamabad');
  const [customLocArea, setCustomLocArea] = useState('');
  const [customLocStreet, setCustomLocStreet] = useState('');
  const [customLocError, setCustomLocError] = useState<string | null>(null);
  
  // --- SIMULATION / ALERT STATE ---
  const [whatsappBanner, setWhatsappBanner] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });
  const [pushNotification, setPushNotification] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (userProfile && authMode === 'chat') {
      const welcomeText = translations[chatLanguage].welcomeMessage(userProfile.name, userProfile.city);
      setMessages([
        { 
          id: 'm1', 
          sender: 'bot', 
          text: welcomeText
        }
      ]);
    }
  }, [userProfile, authMode]);

  const handleLanguageChange = (lang: 'roman_urdu' | 'english' | 'urdu') => {
    setChatLanguage(lang);
    
    let ackText = '';
    if (lang === 'roman_urdu') {
      ackText = 'Theek hai, ab se mai aap se Roman Urdu me guftagu karunga!';
    } else if (lang === 'english') {
      ackText = 'Sure, I will communicate with you in English from now on!';
    } else if (lang === 'urdu') {
      ackText = 'ٹھیک ہے، اب سے میں آپ سے اردو میں بات کروں گا۔';
    }

    setMessages(prev => [...prev, {
      id: 'lang_ack_' + generateUniqueId(),
      sender: 'bot',
      text: ackText
    }]);
  };

  // Clear registration errors when switching steps
  useEffect(() => {
    setRegError(null);
  }, [authMode]);

  // Sync / load saved users from localStorage for persistent testing on reload
  useEffect(() => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('Khidmat_RegisteredUsers');
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.assign(RegisteredUsers, parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load registered users from localStorage:', e);
    }
  }, []);

  // --- LOGIN FLOW ---
  const handleLogin = () => {
    const cnic = loginCnic.trim();
    const password = loginPassword.trim();
    setLoginError(null);

    if (!cnic || !password) {
      setLoginError('Please enter your CNIC and Password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user = RegisteredUsers[cnic];
      if (user && user.password === password) {
        // Successful login
        const profile: UserProfile = {
          cnic: user.cnic,
          name: user.name,
          mobile: user.mobile,
          city: user.city,
          primaryAddress: user.primaryAddress,
          secondaryAddress1: user.secondaryAddress1,
          secondaryAddress2: user.secondaryAddress2
        };
        setUserProfile(profile);
        setAuthMode('chat');
        // Clear login form
        setLoginCnic('');
        setLoginPassword('');
      } else {
        setLoginError('Invalid CNIC or Password.');
      }
    }, 1200);
  };

  // --- WIZARD SIGN UP FLOWS ---

  // Step 1: Verify CNIC against NADRA
  const handleVerifyCnic = () => {
    const cnic = regCnic.trim();
    setRegError(null);
    if (!cnic) {
      setRegError('Please enter your CNIC number.');
      return;
    }

    // Prevent signup if user is already registered in mockup data
    if (RegisteredUsers[cnic]) {
      setRegError('User already exists for this citizen. Please use another ID or login.');
      return;
    }

    setIsLoading(true);
    agent.verifyCNIC(cnic);

    setTimeout(() => {
      setIsLoading(false);
      const record = NadraDatabase[cnic];
      if (record) {
        setCurrentNadraRecord(record);
        setAuthMode('reg_details');
      } else {
        setRegError('No NADRA record found for this CNIC.');
      }
    }, 1200);
  };

  // Step 2: Verify Mother's Maiden Name + Mobile carrier matching
  const handleVerifyDetails = () => {
    const name = regName.trim();
    const mother = regMother.trim();
    const mobile = regMobile.trim();
    setRegError(null);

    if (!name || !mother || !mobile) {
      setRegError('Please fill out Citizen Name, Maiden Name, and Mobile number.');
      return;
    }

    if (!currentNadraRecord) return;

    setIsLoading(true);
    agent.verifySecurityDetails(name, mother, mobile);

    setTimeout(() => {
      setIsLoading(false);
      // Validate all parameters: Citizen Name, Mother's name, registered cell match CNIC
      const isNameMatch = currentNadraRecord.name.toLowerCase() === name.toLowerCase();
      const isMotherMatch = currentNadraRecord.motherMaidenName.toLowerCase() === mother.toLowerCase();
      const isMobileMatch = currentNadraRecord.registeredMobile === mobile;

      if (isNameMatch && isMotherMatch && isMobileMatch) {
        agent.validationResult(true, '');
        agent.dispatchOTP(mobile);
        
        // Dispatch real WhatsApp OTP notification asynchronously
        sendWhatsAppNotification(`Your Khidmat 24/7 Citizen Verification OTP code is: *4821*.\n\nPlease enter this 4-digit code in the app registration form to complete your secure setup.`);
        
        Alert.alert('Verification Passed', `SIM card ownership matched. An SMS security OTP has been dispatched to ${mobile}.\n\nYour mock OTP code is: 4821`);
        setAuthMode('reg_otp');
      } else {
        let errorMsg = '';
        if (!isNameMatch) {
          errorMsg = 'Citizen name does not match NADRA registry.';
        } else if (!isMotherMatch) {
          errorMsg = 'Mother\'s maiden name does not match NADRA registry.';
        } else {
          errorMsg = 'This SIM card cell number is not registered against this CNIC.';
        }
        agent.validationResult(false, errorMsg);
        setRegError(errorMsg);
      }
    }, 1200);
  };

  // Step 3: Verify OTP Code
  const handleVerifyOtp = () => {
    const otp = regOtp.trim();
    setRegError(null);
    if (!otp) {
      setRegError('Please enter the 4-digit verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (otp === '4821') {
        agent.verifyOTP(true);
        Alert.alert('Code Verified', 'Secure handshake successful! Please set up your password.');
        setAuthMode('reg_password');
      } else {
        agent.verifyOTP(false);
        setRegError('Invalid verification code.');
      }
    }, 1000);
  };

  // Step 4: Password setup and Complete Signup
  const handleCompleteSignup = () => {
    const password = regPassword.trim();
    const confirm = regConfirmPassword.trim();
    setRegError(null);

    if (!password || !confirm) {
      setRegError('Please set a secure password.');
      return;
    }

    if (password !== confirm) {
      setRegError('Passwords do not match.');
      return;
    }

    if (!currentNadraRecord) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);

      // Create new credential record
      const newUser: UserCredential = {
        cnic: currentNadraRecord.cnic,
        password: password,
        name: currentNadraRecord.name,
        mobile: regMobile,
        city: currentNadraRecord.city,
        primaryAddress: currentNadraRecord.address,
        secondaryAddress1: regSecAddr1.trim() || undefined,
        secondaryAddress2: regSecAddr2.trim() || undefined
      };

      // Store in memory database
      RegisteredUsers[currentNadraRecord.cnic] = newUser;

      // Persist to localStorage for web to prevent lost state on hot reloads
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('Khidmat_RegisteredUsers', JSON.stringify(RegisteredUsers));
        }
      } catch (e) {
        console.warn('Failed to save registered users to localStorage:', e);
      }

      agent.registerUser(
        currentNadraRecord.name, 
        currentNadraRecord.city, 
        currentNadraRecord.address, 
        regSecAddr1.trim() || undefined, 
        regSecAddr2.trim() || undefined
      );

      // Set successful registration message
      setLoginSuccess('User Created Successful. Use your CNIC and password to login.');
      
      // Clear forms
      setRegCnic('');
      setRegName('');
      setRegMobile('');
      setRegMother('');
      setRegOtp('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegSecAddr1('');
      setRegSecAddr2('');
      setCurrentNadraRecord(null);

      // Redirect to Login
      setAuthMode('login');
    }, 1200);
  };

  // --- CORE CHAT ORCHESTRATION ---
  const sendMessage = async () => {
    if (!inputText.trim() || !userProfile) return;

    const userMsg: Message = { id: generateUniqueId(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    const input = inputText;
    setInputText('');

    const typingId = 'typing_' + generateUniqueId();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    // Step 1: Parse Intent
    if (input.toLowerCase().includes('overlap') || input.toLowerCase().includes('collision')) {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      const testProvider = providers.find(p => p.category.includes('Electrician')) || providers[0];
      if (testProvider) {
        bookedSlotsRegistry.push({
          providerId: testProvider.id,
          dateKey: 'tomorrow',
          slot: '10:00 AM - 12:00 PM'
        });
        addTrace('Booking Agent', 'Simulation', `Seeded overlapping booking for ${testProvider.name} (ID: ${testProvider.id}) on Tomorrow 10:00 AM - 12:00 PM.`);
        setMessages(prev => [...prev, {
          id: generateUniqueId(),
          sender: 'bot',
          text: `🔧 [Dev Tool] Simulated collision seeded! Provider ${testProvider.name} is now pre-booked for Tomorrow's slot "10:00 AM - 12:00 PM".\n\nTry searching for an Electrician now, select ${testProvider.name}, choose "Tomorrow" as the date, and choose "10:00 AM - 12:00 PM" as the slot to see the Recovery Agent re-route you!`
        }]);
      }
      return;
    }

    const intent = await agent.processRequest(input);
    setMessages(prev => prev.filter(m => m.id !== typingId));

    // Handle Pleasantries/Extra Natural Words conversationally
    if (intent.isGreeting) {
      setMessages(prev => [...prev, { id: generateUniqueId(), sender: 'bot', text: translations[chatLanguage].greetingResponse }]);
      return;
    }
    if (intent.isThanks) {
      setMessages(prev => [...prev, { id: generateUniqueId(), sender: 'bot', text: translations[chatLanguage].thanksResponse }]);
      return;
    }
    if (intent.isOk) {
      setMessages(prev => [...prev, { id: generateUniqueId(), sender: 'bot', text: translations[chatLanguage].okResponse }]);
      return;
    }

    if (intent.needsClarification) {
      setMessages(prev => [...prev, { id: generateUniqueId(), sender: 'bot', text: translations[chatLanguage].clarifyMessage }]);
      return;
    }

    setCurrentIntent(intent);

    // Step 2: Booking Agent asks to Confirm Location
    addTrace('Booking Agent', 'Simulation', 'Validating user target address for matched category.');
    
    const locationOptions = [userProfile.primaryAddress];
    if (userProfile.secondaryAddress1) locationOptions.push(userProfile.secondaryAddress1);
    if (userProfile.secondaryAddress2) locationOptions.push(userProfile.secondaryAddress2);
    locationOptions.push('Use a different location...');

    setMessages(prev => [...prev, {
      id: 'loc_' + generateUniqueId(),
      sender: 'bot',
      text: translations[chatLanguage].confirmLocation(intent.serviceType),
      type: 'location_select',
      options: locationOptions
    }]);
  };

  const selectLocation = (location: string) => {
    if (location === 'Use a different location...') {
      setCustomLocCity(userProfile?.city || 'Islamabad');
      setCustomLocArea('');
      setCustomLocStreet('');
      setCustomLocError(null);
      setIsCustomLocModalVisible(true);
    } else {
      processFinalLocation(location);
    }
  };

  const handleConfirmCustomLocation = () => {
    const area = customLocArea.trim();
    const street = customLocStreet.trim();
    setCustomLocError(null);

    if (!area) {
      setCustomLocError('Please specify Sector / Area (e.g. Johar Town or Clifton Block 5).');
      return;
    }

    const fullAddress = `${street ? street + ', ' : ''}${area}, ${customLocCity}`;
    setIsCustomLocModalVisible(false);
    processFinalLocation(fullAddress, area, customLocCity);
  };

  const processFinalLocation = (location: string, customArea?: string, customCity?: string) => {
    if (!userProfile || !currentIntent) return;
    
    setSelectedLocation(location);
    agent.confirmLocationSelected(location);
    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'user',
      text: `Confirmed Location: ${location}`
    }]);

    const typingId = 'typing_' + generateUniqueId();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));

      const targetCity = (customCity || userProfile.city) as 'Islamabad' | 'Lahore' | 'Karachi';
      const targetArea = customArea || location;

      // Match Providers Near Location
      const matches = agent.matchProviders(currentIntent, targetCity, targetArea);

      if (matches.length === 0) {
        addTrace('Recovery Agent', 'Fallback', `No matching ${currentIntent.serviceType} available in ${targetCity} near ${targetArea}.`);
        addTrace('Recovery Agent', 'Fallback', 'Automatically registering citizen to waitlist retry queue. Checking scheduling intelligence for alternate slots...');
        
        const retryText = chatLanguage === 'urdu'
          ? `[ریکوری ایجنٹ] 🚨 معذرت، اس وقت آپ کے علاقے میں کوئی فراہم کنندہ دستیاب نہیں ہے۔ ہم نے آپ کو انتظار کی فہرست (Waitlist) میں شامل کر دیا ہے۔\n\nکوشش کریں کہ متبادل تاریخ (کل یا پرسوں) منتخب کریں یا قریبی کسی اور سروس کو تلاش کریں:`
          : chatLanguage === 'roman_urdu'
          ? `[Recovery Agent] 🚨 Sorry, no providers are available near your location right now. We have registered you to the Waitlist.\n\nPlease try selecting an alternate date to search again:`
          : `[Recovery Agent] 🚨 We apologize, but no providers are available in your immediate vicinity right now. We have added you to our active waitlist retry queue.\n\nPlease try selecting an alternate date to check alternative availability:`;

        setMessages(prev => [...prev, { 
          id: generateUniqueId(), 
          sender: 'bot', 
          text: retryText,
          type: 'date_select',
          options: [
            chatLanguage === 'urdu' ? 'آج' : chatLanguage === 'roman_urdu' ? 'Today' : 'Today',
            chatLanguage === 'urdu' ? 'کل' : chatLanguage === 'roman_urdu' ? 'Tomorrow' : 'Tomorrow',
            chatLanguage === 'urdu' ? 'پرسوں' : chatLanguage === 'roman_urdu' ? 'Day After' : 'Day After'
          ]
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: generateUniqueId(), 
          sender: 'bot', 
          text: translations[chatLanguage].matchingIntro(currentIntent.confidenceScore),
          providers: matches
        }]);
      }
    }, 1000);
  };


  // --- LOCALIZED DATE AND TIME SLOT HELPERS ---
  const getLocalizedDateString = (date: Date, relativeKey: 'today' | 'tomorrow' | 'dayAfter') => {
    const weekdayEN = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthEN = date.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = date.getDate();

    const weekdayMap = {
      english: { Sun: 'Sun', Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat' },
      roman_urdu: { Sun: 'Itwar', Mon: 'Peer', Tue: 'Mangal', Wed: 'Budh', Thu: 'Jumeirat', Fri: 'Juma', Sat: 'Hafta' },
      urdu: { Sun: 'اتوار', Mon: 'پیر', Tue: 'منگل', Wed: 'بدھ', Thu: 'جمعرات', Fri: 'جمعہ', Sat: 'ہفتہ' }
    };

    const monthMap = {
      english: { Jan: 'Jan', Feb: 'Feb', Mar: 'Mar', Apr: 'Apr', May: 'May', Jun: 'Jun', Jul: 'Jul', Aug: 'Aug', Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dec' },
      roman_urdu: { Jan: 'Jan', Feb: 'Feb', Mar: 'Mar', Apr: 'Apr', May: 'May', Jun: 'June', Jul: 'July', Aug: 'Aug', Sep: 'Sept', Oct: 'Oct', Nov: 'Nov', Dec: 'Dec' },
      urdu: { Jan: 'جنوری', Feb: 'فروری', Mar: 'مارچ', Apr: 'اپریل', May: 'مئی', Jun: 'جون', Jul: 'جولائی', Aug: 'اگست', Sep: 'ستمبر', Oct: 'اکتوبر', Nov: 'نومبر', Dec: 'دسمبر' }
    };

    const relativeText = {
      today: { english: 'Today', roman_urdu: 'Aaj', urdu: 'آج' },
      tomorrow: { english: 'Tomorrow', roman_urdu: 'Kal', urdu: 'کل' },
      dayAfter: { english: 'Day after', roman_urdu: 'Parso', urdu: 'پرسوں' }
    };

    const rel = relativeText[relativeKey][chatLanguage];
    const wd = weekdayMap[chatLanguage][weekdayEN as keyof typeof weekdayMap['english']] || weekdayEN;
    const m = monthMap[chatLanguage][monthEN as keyof typeof monthMap['english']] || monthEN;

    if (chatLanguage === 'urdu') {
      return `${rel} (${wd}، ${dayNum} ${m})`;
    } else if (chatLanguage === 'roman_urdu') {
      return `${rel} (${wd}, ${dayNum} ${m})`;
    } else {
      return `${rel} (${wd}, ${m} ${dayNum})`;
    }
  };

  const getLocalizedSlotLabel = (label: string) => {
    if (chatLanguage === 'urdu') {
      return label.replace(' - ', ' سے ');
    } else if (chatLanguage === 'roman_urdu') {
      return label.replace(' - ', ' se ');
    }
    return label;
  };

  const handleBook = (provider: MatchedProvider) => {
    setSelectedProvider(provider);
    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'user',
      text: `Book ${provider.provider.name}`
    }]);

    // Generate Dynamic Date Options (Today, Tomorrow, Day after)
    const today = new Date();
    const todayStr = getLocalizedDateString(today, 'today');
    
    const tom = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomStr = getLocalizedDateString(tom, 'tomorrow');
    
    const dayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dayAfterStr = getLocalizedDateString(dayAfter, 'dayAfter');

    setMessages(prev => [...prev, {
      id: 'date_' + generateUniqueId(),
      sender: 'bot',
      text: translations[chatLanguage].selectDate(provider.provider.name),
      type: 'date_select',
      options: [todayStr, tomStr, dayAfterStr]
    }]);
  };

  const getFormattedSelectedDate = (key: 'today' | 'tomorrow' | 'dayAfter' | null) => {
    if (!key) return '';
    const today = new Date();
    let targetDate = today;
    if (key === 'tomorrow') {
      targetDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    } else if (key === 'dayAfter') {
      targetDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    }
    return getLocalizedDateString(targetDate, key);
  };

  const selectDate = (dateOption: string) => {
    let relativeKey: 'today' | 'tomorrow' | 'dayAfter' = 'today';
    if (dateOption.startsWith('Tomorrow') || dateOption.startsWith('Kal') || dateOption.startsWith('کل')) {
      relativeKey = 'tomorrow';
    } else if (dateOption.startsWith('Day after') || dateOption.startsWith('Parso') || dateOption.startsWith('پرسوں')) {
      relativeKey = 'dayAfter';
    }
    setRawSelectedDateKey(relativeKey);

    const formattedDate = getFormattedSelectedDate(relativeKey);
    setSelectedDate(formattedDate);

    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'user',
      text: translations[chatLanguage].selectedDateMsg(formattedDate)
    }]);

    const typingId = 'typing_' + generateUniqueId();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));

      // Calculate slots based on Date selection and current local time
      const today = new Date();
      const isToday = dateOption.startsWith('Today') || dateOption.startsWith('Aaj') || dateOption.startsWith('آج');
      
      const allSlots = [
        { label: '10:00 AM - 12:00 PM', startHour: 10 },
        { label: '02:00 PM - 04:00 PM', startHour: 14 },
        { label: '06:00 PM - 08:00 PM', startHour: 18 }
      ];

      let availableSlots: string[] = [];

      if (isToday) {
        const currentHour = today.getHours();
        const currentMin = today.getMinutes();
        const currentDecimal = currentHour + currentMin / 60;
        const threshold = currentDecimal + 2; // available post 2 hours

        availableSlots = allSlots
          .filter(s => s.startHour >= threshold)
          .map(s => getLocalizedSlotLabel(s.label));
      } else {
        availableSlots = allSlots.map(s => getLocalizedSlotLabel(s.label));
      }

      if (availableSlots.length === 0) {
        setMessages(prev => [...prev, {
          id: 'time_fail_' + generateUniqueId(),
          sender: 'bot',
          text: translations[chatLanguage].noSlotsToday,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: 'time_' + generateUniqueId(),
          sender: 'bot',
          text: translations[chatLanguage].selectTimeSlot(selectedProvider?.provider.name || '', formattedDate),
          type: 'timeslot_select',
          options: availableSlots
        }]);
      }
    }, 800);
  };

  const selectTimeSlot = (slot: string) => {
    if (!selectedProvider || !userProfile) return;

    let rawSlot = slot;
    if (slot.includes(' se ')) {
      rawSlot = slot.replace(' se ', ' - ');
    } else if (slot.includes(' سے ')) {
      rawSlot = slot.replace(' سے ', ' - ');
    }
    setRawSelectedSlotLabel(rawSlot);

    const currentRawDateKey = rawSelectedDateKey || 'today';
    const formattedDate = getFormattedSelectedDate(currentRawDateKey);
    const formattedSlot = getLocalizedSlotLabel(rawSlot);

    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'user',
      text: translations[chatLanguage].selectedSlotMsg(formattedSlot)
    }]);

    agent.confirmTimeSlotSelected(formattedSlot, selectedProvider.provider.name);
    const typingId = 'typing_' + generateUniqueId();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      
      // Check for slot booking collision
      const hasConflict = bookedSlotsRegistry.some(
        booking => 
          booking.providerId === selectedProvider.provider.id &&
          booking.dateKey === currentRawDateKey &&
          booking.slot === rawSlot
      );

      if (hasConflict) {
        addTrace('Booking Agent', 'Fallback', `Collision detected! Provider ${selectedProvider.provider.name} is already booked for ${formattedDate} (${formattedSlot}). Handing off to Recovery Agent.`);
        
        // Find next best fallback provider in the same category
        const currentCategory = selectedProvider.provider.category[0] || 'Electrician';
        const otherMatches = providers.filter(p => 
          p.id !== selectedProvider.provider.id &&
          p.city === selectedProvider.provider.city &&
          p.category.includes(currentCategory) &&
          p.isAvailable
        );

        let fallbackMsg = "";
        let nextBestProvider = null;

        if (otherMatches.length > 0) {
          otherMatches.sort((a, b) => b.rating - a.rating || b.reliabilityScore - a.reliabilityScore);
          nextBestProvider = otherMatches[0];

          fallbackMsg = chatLanguage === 'urdu'
            ? `[ریکوری ایجنٹ] 🚨 سسٹم تنازعہ: فراہم کنندہ ${selectedProvider.provider.name} کو اسی وقت کے لیے پہلے ہی کسی دوسرے صارف نے بک کر لیا ہے۔\n\nہم نے خودکار طور پر آپ کی بکنگ کو اگلے بہترین فراہم کنندہ ${nextBestProvider.name} کے ساتھ منتقل کرنے کا عمل شروع کیا ہے، جن کی ریٹنگ ${nextBestProvider.rating}⭐ ہے۔ کیا آپ ان کے ساتھ آگے بڑھنا چاہیں گے؟`
            : chatLanguage === 'roman_urdu'
            ? `[Recovery Agent] 🚨 System conflict: Provider ${selectedProvider.provider.name} was just booked for this slot by another citizen.\n\nHumne automatically aapki request next best provider ${nextBestProvider.name} (Rating: ${nextBestProvider.rating}⭐) par re-route kar di hai. Kya aap is alternate provider ko book karna chahte hain?`
            : `[Recovery Agent] 🚨 System Conflict: Provider ${selectedProvider.provider.name} has just been booked for this overlapping slot by another citizen.\n\nWe have automatically re-routed your request to the next best match: ${nextBestProvider.name} (Rating: ${nextBestProvider.rating}⭐). Would you like to proceed with this fallback provider?`;
        } else {
          fallbackMsg = chatLanguage === 'urdu'
            ? `[ریکوری ایجنٹ] 🚨 سسٹم تنازعہ: فراہم کنندہ ${selectedProvider.provider.name} پہلے ہی بک ہو چکے ہیں اور اس وقت کوئی متبادل فراہم کنندہ دستیاب نہیں ہے۔`
            : chatLanguage === 'roman_urdu'
            ? `[Recovery Agent] 🚨 System conflict: Provider ${selectedProvider.provider.name} booked, and no other matching providers are available for this slot.`
            : `[Recovery Agent] 🚨 System Conflict: Provider ${selectedProvider.provider.name} was booked, and no other fallback providers are available for this slot.`;
        }

        setMessages(prev => [...prev, {
          id: generateUniqueId(),
          sender: 'bot',
          text: fallbackMsg,
          type: 'fallback_select',
          options: nextBestProvider ? [
            chatLanguage === 'urdu' ? `ہاں، ${nextBestProvider.name} کو بک کریں` : chatLanguage === 'roman_urdu' ? `Yes, book ${nextBestProvider.name}` : `Yes, book ${nextBestProvider.name}`,
            chatLanguage === 'urdu' ? 'نیا سرچ شروع کریں' : chatLanguage === 'roman_urdu' ? 'Start new search' : 'Start new search'
          ] : undefined
        }]);

        if (nextBestProvider) {
          (global as any).pendingFallbackProvider = nextBestProvider;
        }
        return;
      }

      // If no conflict, add booking to registry
      bookedSlotsRegistry.push({
        providerId: selectedProvider.provider.id,
        dateKey: currentRawDateKey,
        slot: rawSlot
      });

      // Step 5: Simulate Booking Handshake
      agent.simulateBooking(selectedProvider.provider, selectedProvider.quote, `${formattedDate} at ${formattedSlot}`, selectedLocation);

      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        sender: 'bot',
        text: translations[chatLanguage].bookingSuccess(selectedProvider.provider.name, formattedDate, formattedSlot)
      }]);
      const bookingId = 'BK-' + Math.floor(Math.random() * 9000 + 1000);
      setActiveBooking({
        id: bookingId,
        providerName: selectedProvider.provider.name,
        total: selectedProvider.quote.total,
        date: formattedDate,
        slot: formattedSlot,
        status: 'confirmed',
        reliabilityScore: selectedProvider.provider.reliabilityScore,
        bookingDateKey: currentRawDateKey,
        bookingSlotLabel: rawSlot
      });

      // Reset simulated time offset for new booking
      setSimulatedTimeOffset(0);

      // Construct a highly detailed premium receipt notification
      const receiptText = `Shabaash! Aapki booking confirm ho chuki hai!\n\n` +
        `*📄 BOOKING DETAILS:*\n` +
        `• *Booking ID:* ${bookingId}\n` +
        `• *Service Provider:* ${selectedProvider.provider.name}\n` +
        `• *Category:* ${selectedProvider.provider.category.join(', ')}\n` +
        `• *Schedule:* ${formattedDate} (${formattedSlot})\n` +
        `• *Address:* ${selectedLocation}\n\n` +
        `*💰 BILLING SUMMARY:*\n` +
        `• Base Fee: Rs ${selectedProvider.quote.visitFee}\n` +
        `• Distance: Rs ${selectedProvider.quote.distanceCost}\n` +
        (selectedProvider.quote.urgencyAdjustment > 0 ? `• Urgency Surge: Rs ${selectedProvider.quote.urgencyAdjustment}\n` : '') +
        `• *Total Estimate:* Rs ${selectedProvider.quote.total}\n\n` +
        `✅ Khidmat Verification secure status active. Safe travels!`;

      // Trigger background WhatsApp gateway delivery
      sendWhatsAppNotification(receiptText);

      // WhatsApp Message Mock
      setWhatsappBanner({
        visible: true,
        text: translations[chatLanguage].whatsappText(
          userProfile.name,
          userProfile.mobile,
          currentIntent.serviceType,
          selectedProvider.provider.name,
          formattedDate,
          formattedSlot,
          selectedLocation,
          selectedProvider.quote.total
        )
      });

      // 1hr Push Notification Mock
      setTimeout(() => {
        setActiveBooking(currentActive => {
          if (currentActive && currentActive.id === bookingId) {
            setPushNotification({
              visible: true,
              text: translations[chatLanguage].reminderText(selectedProvider.provider.name, currentIntent.serviceType)
            });
          }
          return currentActive;
        });
      }, 3500);


    }, 1500);
  };


  const getBookingDateRange = (dateKey: 'today' | 'tomorrow' | 'dayAfter', slotLabel: string) => {
    const today = new Date();
    let bookingDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (dateKey === 'tomorrow') {
      bookingDate.setDate(bookingDate.getDate() + 1);
    } else if (dateKey === 'dayAfter') {
      bookingDate.setDate(bookingDate.getDate() + 2);
    }
    
    let startHour = 10;
    let endHour = 12;
    
    const cleanSlot = slotLabel.toLowerCase();
    if (cleanSlot.includes('10')) {
      startHour = 10;
      endHour = 12;
    } else if (cleanSlot.includes('2') || cleanSlot.includes('02') || cleanSlot.includes('14')) {
      startHour = 14;
      endHour = 16;
    } else if (cleanSlot.includes('6') || cleanSlot.includes('06') || cleanSlot.includes('18')) {
      startHour = 18;
      endHour = 20;
    }
    
    const start = new Date(bookingDate.getTime());
    start.setHours(startHour, 0, 0, 0);
    
    const end = new Date(bookingDate.getTime());
    end.setHours(endHour, 0, 0, 0);
    
    return { start, end };
  };

  const getCanCancel = () => {
    if (!activeBooking) return false;
    const { start } = getBookingDateRange(activeBooking.bookingDateKey, activeBooking.bookingSlotLabel);
    const currentTime = new Date(Date.now() + simulatedTimeOffset);
    
    const diffMs = start.getTime() - currentTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 2;
  };

  const handleCancelBooking = () => {
    if (!activeBooking) return;
    
    const cancelMsg = chatLanguage === 'urdu'
      ? `آپ کی بکنگ ${activeBooking.id} کامیابی سے منسوخ کر دی گئی ہے۔`
      : chatLanguage === 'roman_urdu'
      ? `Aap ki booking ${activeBooking.id} successfully cancel kar di gayi hai.`
      : `Your booking ${activeBooking.id} has been successfully cancelled.`;
      
    const cancelWhatsappText = chatLanguage === 'urdu'
      ? `🟢 واٹس ایپ تصدیق\nمنجانب: Khidmat\nمحترم/محترمہ ${userProfile?.name || ''}، آپ کی بکنگ ${activeBooking.id} برائے ${activeBooking.providerName} کامیابی سے منسوخ کر دی گئی ہے۔`
      : chatLanguage === 'roman_urdu'
      ? `🟢 WhatsApp Confirmation\nTo: ${userProfile?.name || ''} (${userProfile?.mobile || ''})\nYour Khidmat booking ${activeBooking.id} with ${activeBooking.providerName} has been cancelled successfully.`
      : `🟢 WhatsApp Confirmation\nTo: ${userProfile?.name || ''} (${userProfile?.mobile || ''})\nYour Khidmat booking ${activeBooking.id} with ${activeBooking.providerName} has been cancelled successfully.`;
      
    addTrace('Booking Agent', 'Decision', `Citizen cancelled booking ${activeBooking.id} (> 2 hours before scheduled slot).`);
    
    // Real notification dispatch
    sendWhatsAppNotification(cancelWhatsappText);
    
    // In-app banner simulation
    setWhatsappBanner({
      visible: true,
      text: cancelWhatsappText
    });
    
    // Dismiss push notification reminder if active
    setPushNotification({ visible: false, text: '' });
    
    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'bot',
      text: cancelMsg
    }]);
    
    setActiveBooking(null);
  };



  useEffect(() => {
    if (!activeBooking) return;
    
    // Skip if status is already completed, disputed, or refunded
    if (['completed', 'disputed', 'refunded'].includes(activeBooking.status)) return;

    const checkStatus = () => {
      const { start, end } = getBookingDateRange(activeBooking.bookingDateKey, activeBooking.bookingSlotLabel);
      const currentTime = new Date(Date.now() + simulatedTimeOffset);
      let newStatus: typeof activeBooking.status = activeBooking.status;

      if (currentTime >= end) {
        newStatus = 'completed';
      } else if (currentTime >= start) {
        newStatus = 'arrived'; // 'arrived' is In Progress in the UI
      } else if (start.getTime() - currentTime.getTime() <= 30 * 60 * 1000) {
        newStatus = 'en_route';
      } else {
        newStatus = 'confirmed';
      }

      if (newStatus !== activeBooking.status) {
        setActiveBooking(prev => {
          if (!prev) return null;
          
          if (newStatus === 'en_route') {
            addTrace('Booking Agent', 'Simulation', `Provider ${prev.providerName} is en-route to customer address. Simulated distance: 1.5km. ETA: 10 minutes.`);
            sendWhatsAppNotification(`Your service provider ${prev.providerName} is now en-route to your address! ETA: 10 mins.`);
          } else if (newStatus === 'arrived') {
            addTrace('Booking Agent', 'Simulation', `Provider ${prev.providerName} has arrived at address and started service (In Progress).`);
            sendWhatsAppNotification(`Your service provider ${prev.providerName} has started the job! Status: In Progress.`);
          } else if (newStatus === 'completed') {
            addTrace('Booking Agent', 'Simulation', `Provider ${prev.providerName} has completed the job.`);
            sendWhatsAppNotification(`Your booking with ${prev.providerName} is now completed. Please rate the service in the app.`);
          }
          
          return { ...prev, status: newStatus };
        });
      }
    };

    // Run immediately
    checkStatus();

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [activeBooking, simulatedTimeOffset]);

  const handleRateService = () => {
    if (!activeBooking) return;
    
    // Find provider and apply positive reinforcement rating adjustment
    const provider = providers.find(p => p.name === activeBooking.providerName);
    const oldRating = provider ? provider.rating : 4.8;
    const newRating = provider ? Math.min(5.0, Number((provider.rating + 0.05).toFixed(2))) : 4.85;
    if (provider) {
      provider.rating = newRating;
      provider.reviews = (provider.reviews || 0) + 1;
      provider.reliabilityScore = Math.min(100, (provider.reliabilityScore || 90) + 1);
    }

    addTrace('Booking Agent', 'Simulation', `Quality Checklist verified: [x] Service area cleaned, [x] Customer safety check passed, [x] Photo evidence placeholder uploaded.`);
    addTrace('Booking Agent', 'Simulation', `Customer feedback registered. Adjusting provider ${activeBooking.providerName} metrics: Rating (${oldRating}⭐ -> ${newRating}⭐), Reliability (+1%). Priority weight boosted for future matching cycles.`);

    const thankYouMsg = chatLanguage === 'urdu' 
      ? `شکریہ! ہم نے فراہم کنندہ ${activeBooking.providerName} کے لیے آپ کی 5-اسٹار ریٹنگ کامیابی کے ساتھ درج کر لی ہے۔ ان کی ریٹنگ اب ${newRating}⭐ ہو گئی ہے۔ خِدمت استعمال کرنے کا شکریہ!`
      : chatLanguage === 'roman_urdu'
      ? `JazakAllah! Humne provider ${activeBooking.providerName} ke liye aapki 5-star rating register kar li hai. Unki rating ab ${newRating}⭐ ho gayi hai. Khidmat use karne ka shukriya!`
      : `Thank you! We have successfully registered your 5-star rating for provider ${activeBooking.providerName}. Their rating is now updated to ${newRating}⭐. Thank you for choosing Khidmat!`;

    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'bot',
      text: thankYouMsg
    }]);
    
    setActiveBooking(null); // Clear floating widget
  };

  const handleDisputeInitiate = () => {
    if (!activeBooking) return;

    setActiveBooking(prev => prev ? { ...prev, status: 'disputed' } : null);

    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'user',
      text: chatLanguage === 'urdu' 
        ? `میں بکنگ ${activeBooking.id} کے بل یا کام کے متعلق شکایت درج کروانا چاہتا ہوں۔`
        : chatLanguage === 'roman_urdu'
        ? `Mai booking ${activeBooking.id} ke bill ya kaam ke mutalik shikayat darj karwana chahta hoon.`
        : `I want to file a dispute/complaint for booking ${activeBooking.id}.`
    }]);

    const typingId = 'typing_' + generateUniqueId();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));

      const agentText = chatLanguage === 'urdu'
        ? `[ریکوری ایجنٹ] مجھے یہ سن کر افسوس ہوا۔ میں خِدمت ریکوری اسسٹنٹ ہوں۔ براہ کرم مسئلہ منتخب کریں تاکہ ہم فراہم کنندہ کی ہسٹری کے مطابق مناسب حل پیش کر سکیں:`
        : chatLanguage === 'roman_urdu'
        ? `[Recovery Agent] Mujhe ye sun kar afsos hua. Mai Khidmat Recovery Assistant hoon. Please issue select karein taake hum provider history ke mutabik resolution de sakein:`
        : `[Recovery Agent] We are sorry to hear that. I am the Khidmat Recovery Assistant. Please select the primary issue so we can assess provider history and resolve this:`;

      setMessages(prev => [...prev, {
        id: 'dispute_options_' + generateUniqueId(),
        sender: 'bot',
        text: agentText,
        type: 'dispute_select',
        options: chatLanguage === 'urdu'
          ? ['سروس غیر تسلی بخش تھی', 'فراہم کنندہ دیر سے پہنچے', 'زیادہ پیسے لیے گئے']
          : chatLanguage === 'roman_urdu'
          ? ['Poor Service Quality', 'Provider Arrived Late', 'Overcharged / Price dispute']
          : ['Poor Service Quality', 'Provider Arrived Late', 'Overcharged / Price dispute']
      }]);
    }, 1000);
  };

  const handleDisputeResolve = (option: string) => {
    if (!activeBooking) return;

    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'user',
      text: option
    }]);

    const typingId = 'typing_' + generateUniqueId();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    // Trigger Recovery Agent trace logging
    addTrace('Recovery Agent', 'Fallback', `User initiated a dispute on booking ${activeBooking.id} due to: "${option}".`);
    addTrace('Recovery Agent', 'Matching', `Checking provider ${activeBooking.providerName}'s reliability score in the marketplace...`);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));

      // Find the provider in the global providers list and drop rating & reviews
      const providerToPenalize = providers.find(p => p.name === activeBooking.providerName);
      if (providerToPenalize) {
        const oldRating = providerToPenalize.rating;
        const oldReviews = providerToPenalize.reviews;
        const oldReliability = providerToPenalize.reliabilityScore;

        providerToPenalize.rating = Math.max(1.0, parseFloat((providerToPenalize.rating - 0.3).toFixed(1)));
        providerToPenalize.reliabilityScore = Math.max(50, providerToPenalize.reliabilityScore - 5);
        providerToPenalize.reviews += 1;

        addTrace('Recovery Agent', 'Decision', `Dispute recorded against ${providerToPenalize.name}. Rating adjusted: ${oldRating}⭐ -> ${providerToPenalize.rating}⭐, Reviews: ${oldReviews} -> ${providerToPenalize.reviews}.`);
        addTrace('Recovery Agent', 'Decision', `Provider reliability score penalized: ${oldReliability}% -> ${providerToPenalize.reliabilityScore}%.`);
      }

      const providerReliability = activeBooking.reliabilityScore || 85;
      const refundPercent = providerReliability < 80 ? 25 : 15; // low reliability = higher refund
      const refundAmount = Math.round(activeBooking.total * (refundPercent / 100));
      const adjustedTotal = activeBooking.total - refundAmount;

      addTrace('Recovery Agent', 'Decision', `Provider reliability score is ${providerReliability}%. Determined standard refund of ${refundPercent}% is fair and justified.`);
      addTrace('Recovery Agent', 'Simulation', `Processed a credit adjustment of Rs ${refundAmount} back to user's wallet. Adjusted invoice total is Rs ${adjustedTotal}.`);

      const resolutionText = chatLanguage === 'urdu'
        ? `[ریکوری ایجنٹ] ہم نے فراہم کنندہ کی ہسٹری کا جائزہ لیا ہے۔ فراہم کنندہ کی ریلائبلٹی ریٹنگ ${providerReliability}٪ ہے۔ چونکہ آپ کو پریشانی کا سامنا کرنا پڑا، ہم نے آپ کے اکاؤنٹ میں ${refundPercent}٪ جزوی رقم یعنی روپے ${refundAmount} بطور ریفنڈ کریڈٹ جمع کر دی ہے۔`
        : chatLanguage === 'roman_urdu'
        ? `[Recovery Agent] Humne provider ki history ka review kiya hai. Provider ki reliability rating ${providerReliability}% hai. Apko pareshani ki wajah se humne ${refundPercent}% partial refund yani Rs ${refundAmount} apke account me credit kar diya hai.`
        : `[Recovery Agent] We have completed our review of the provider history. Provider ${activeBooking.providerName} has a reliability score of ${providerReliability}%. To compensate for the inconvenience, we have issued a ${refundPercent}% partial refund of Rs ${refundAmount} back to your account.`;

      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        sender: 'bot',
        text: resolutionText
      }]);

      // Render a premium green refund voucher card directly inside the chat bubble list!
      setMessages(prev => [...prev, {
        id: 'refund_voucher_' + generateUniqueId(),
        sender: 'bot',
        type: 'refund_voucher',
        text: '',
        details: {
          id: activeBooking.id,
          providerName: activeBooking.providerName,
          refundAmount,
          adjustedTotal,
          voucherCode: `KHIDMAT-REF-` + Math.floor(Math.random() * 9000 + 1000)
        }
      }]);

      setMessages(prev => [...prev, {
        id: 'dispute_actions_' + generateUniqueId(),
        sender: 'bot',
        text: chatLanguage === 'urdu'
          ? 'براہ کرم تنازعہ کا حتمی عمل منتخب کریں:'
          : chatLanguage === 'roman_urdu'
          ? 'Please select the final dispute action:'
          : 'Please select the final dispute action:',
        type: 'dispute_action_select',
        options: chatLanguage === 'urdu'
          ? ['ریفنڈ قبول کریں اور بکنگ بند کریں', 'انسانی سپروائزر کو منتقل کریں', 'اس فراہم کنندہ کو بلیک لسٹ کریں']
          : chatLanguage === 'roman_urdu'
          ? ['Accept Refund & Close Booking', 'Escalate to Human Supervisor', 'Blacklist this Provider']
          : ['Accept Refund & Close Booking', 'Escalate to Human Supervisor', 'Blacklist this Provider']
      }]);

      setActiveBooking(prev => prev ? { ...prev, status: 'refunded' } : null);
    }, 2000);
  };

  const handleDisputeAction = (option: string) => {
    if (!activeBooking) return;

    setMessages(prev => [...prev, {
      id: generateUniqueId(),
      sender: 'user',
      text: option
    }]);

    const typingId = 'typing_' + generateUniqueId();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));

      let resolutionMsg = '';
      if (option.includes('Escalate') || option.includes('انسانی سپروائزر')) {
        addTrace('Recovery Agent', 'Simulation', `Escalated dispute on booking ${activeBooking.id} to Level-2 Support operations supervisor.`);
        resolutionMsg = chatLanguage === 'urdu'
          ? `[ریکوری ایجنٹ] 📞 ہم نے آپ کی شکایت کو انسانی سپروائزر (ٹکٹ #SUP-9821) کو منتقل کر دیا ہے۔ وہ اگلے 15 منٹ میں آپ کے رجسٹرڈ نمبر پر رابطہ کریں گے۔`
          : chatLanguage === 'roman_urdu'
          ? `[Recovery Agent] 📞 Humne aapki shikayat human supervisor (Ticket #SUP-9821) ko forward kar di hai. Wo next 15 minutes me aap se registered number par rabta karein ge.`
          : `[Recovery Agent] 📞 We have escalated your dispute to a human operations supervisor (Support Ticket #SUP-9821). They will contact you at your registered mobile number within 15 minutes.`;
      } else if (option.includes('Blacklist') || option.includes('بلیک لسٹ')) {
        addTrace('Recovery Agent', 'Simulation', `User blacklisted provider ${activeBooking.providerName}. Removed from user's future match registry.`);
        resolutionMsg = chatLanguage === 'urdu'
          ? `[ریکوری ایجنٹ] 🚫 ہم نے فراہم کنندہ ${activeBooking.providerName} کو آپ کی بلیک لسٹ میں شامل کر دیا ہے۔ وہ آپ کو آئندہ کبھی میچ نہیں کیے جائیں گے۔`
          : chatLanguage === 'roman_urdu'
          ? `[Recovery Agent] 🚫 Humne provider ${activeBooking.providerName} ko aapki blacklist me add kar diya hai. Wo future me aap ke sath match nahi honge.`
          : `[Recovery Agent] 🚫 Understood. We have added provider ${activeBooking.providerName} to your personal blacklist. They will be excluded from all future match recommendations.`;
      } else {
        addTrace('Recovery Agent', 'Simulation', `User accepted refund voucher of Rs ${Math.round(activeBooking.total * 0.15)}. Dispute resolved successfully.`);
        resolutionMsg = chatLanguage === 'urdu'
          ? `شکریہ! تنازعہ کامیابی کے ساتھ حل ہو گیا ہے اور آپ کا والٹ اپ ڈیٹ کر دیا گیا ہے۔`
          : chatLanguage === 'roman_urdu'
          ? `Thank you! Dispute successfully resolved aur aapka wallet credit update ho gaya hai.`
          : `Thank you! The dispute has been successfully resolved and your wallet has been updated.`;
      }

      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        sender: 'bot',
        text: resolutionMsg
      }]);

      setActiveBooking(null); // Clear floating widget
    }, 1500);
  };

  const handleFallbackSelect = (option: string) => {
    if (option.includes('Yes') || option.includes('ہاں')) {
      const fallbackProvider = (global as any).pendingFallbackProvider;
      if (fallbackProvider) {
        (global as any).pendingFallbackProvider = null;
        
        const simulatedDistance = Math.floor(Math.random() * 5) + 1;
        const quote = agent.generateQuote(fallbackProvider, currentIntent || { urgency: 'medium', complexity: 'basic' } as any, simulatedDistance);
        
        setSelectedProvider({
          provider: { ...fallbackProvider, distanceKm: simulatedDistance },
          quote,
          matchScore: 100,
          matchReasons: ['Recovery Agent Fallback Assignment']
        });
        
        const currentRawDateKey = rawSelectedDateKey || 'today';
        const formattedDate = getFormattedSelectedDate(currentRawDateKey);
        
        setMessages(prev => [...prev, {
          id: generateUniqueId(),
          sender: 'user',
          text: option
        }]);

        const typingId = 'typing_' + generateUniqueId();
        setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

        setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== typingId));

          const today = new Date();
          const isToday = currentRawDateKey === 'today';
          const allSlots = [
            { label: '10:00 AM - 12:00 PM', startHour: 10 },
            { label: '02:00 PM - 04:00 PM', startHour: 14 },
            { label: '06:00 PM - 08:00 PM', startHour: 18 }
          ];

          let availableSlots: string[] = [];
          if (isToday) {
            const currentHour = today.getHours();
            const currentMin = today.getMinutes();
            const currentDecimal = currentHour + currentMin / 60;
            const threshold = currentDecimal + 2;

            availableSlots = allSlots
              .filter(s => s.startHour >= threshold)
              .map(s => getLocalizedSlotLabel(s.label));
          } else {
            availableSlots = allSlots.map(s => getLocalizedSlotLabel(s.label));
          }

          setMessages(prev => [...prev, {
            id: generateUniqueId(),
            sender: 'bot',
            text: translations[chatLanguage].selectTimeSlot(fallbackProvider.name, formattedDate),
            type: 'timeslot_select',
            options: availableSlots
          }]);
        }, 800);
      }
    } else {
      (global as any).pendingFallbackProvider = null;
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        sender: 'user',
        text: option
      }]);
      
      const typingId = 'typing_' + generateUniqueId();
      setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);
      
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== typingId));
        setMessages(prev => [...prev, {
          id: generateUniqueId(),
          sender: 'bot',
          text: translations[chatLanguage].greetingResponse
        }]);
        setSelectedProvider(null);
        setCurrentIntent(null);
      }, 800);
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Head>
        <title>Khidmat 24/7 - AI Service Orchestrator</title>
      </Head>

      {/* WhatsApp Popup Banner */}
      {whatsappBanner.visible && (
        <TouchableOpacity style={styles.whatsappBanner} onPress={() => setWhatsappBanner({ visible: false, text: '' })}>
          <Text style={styles.whatsappText}>{whatsappBanner.text}</Text>
          <Text style={styles.bannerCloseText}>Tap to close</Text>
        </TouchableOpacity>
      )}

      {/* Push Notification Banner */}
      {pushNotification.visible && (
        <TouchableOpacity style={styles.pushNotification} onPress={() => setPushNotification({ visible: false, text: '' })}>
          <Text style={styles.pushTitle}>🔔 Khidmat 24/7 AI</Text>
          <Text style={styles.pushText}>{pushNotification.text}</Text>
        </TouchableOpacity>
      )}

      <LinearGradient colors={['#064E3B', '#065F46']} style={styles.header}>
        <View style={styles.headerTopLine}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🌙</Text>
            <Text style={styles.headerTitle}>Khidmat 24/7</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          {authMode !== 'chat' && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Antigravity Active</Text>
            </View>
          )}
        </View>
        
        {authMode === 'chat' && (
          <View style={styles.languageSelectorContainer}>
            {(['roman_urdu', 'english', 'urdu'] as const).map(lang => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langBtn,
                  chatLanguage === lang && styles.langBtnActive
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={[
                  styles.langBtnText,
                  chatLanguage === lang && styles.langBtnTextActive
                ]}>
                  {lang === 'roman_urdu' ? '🇵🇰 Roman' : lang === 'english' ? '🇺🇸 English' : '🕌 اردو'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </LinearGradient>

      {authMode !== 'chat' && (
        <ScrollView contentContainerStyle={styles.regScroll}>
        
        {/* --- DEFAULT LOGIN MODE --- */}
        {authMode === 'login' && (
          <View style={styles.regCard}>
            <LinearGradient colors={['#064E3B', '#065F46']} style={styles.regHeaderGradient}>
              <Text style={styles.regCardTitle}>Secure Citizen Login</Text>
              <Text style={styles.regCardSubtitle}>Authorized Gateway for Pakistan AI Service Orchestrator</Text>
            </LinearGradient>
            
            <View style={styles.regForm}>
              <Text style={styles.label}>CNIC Number</Text>
              <TextInput
                style={styles.regInput}
                placeholder="e.g. 37405-1234567-1"
                placeholderTextColor="#9CA3AF"
                value={loginCnic}
                onChangeText={(val) => { setLoginCnic(val); setLoginError(null); setLoginSuccess(null); }}
              />
              <Text style={styles.hint}> Islamabad: 37405-1234567-1 (Password: 123) or register new!</Text>

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.regInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={loginPassword}
                onChangeText={(val) => { setLoginPassword(val); setLoginError(null); setLoginSuccess(null); }}
              />

              {loginSuccess && (
                <Text style={styles.successText}>✅ {loginSuccess}</Text>
              )}

              {loginError && (
                <Text style={styles.errorText}>⚠️ {loginError}</Text>
              )}

              <TouchableOpacity style={styles.verifyBtn} onPress={handleLogin}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyBtnText}>Secure Login</Text>}
              </TouchableOpacity>

              <View style={styles.switchAuthContainer}>
                <Text style={styles.switchAuthText}>New Citizen? </Text>
                <TouchableOpacity onPress={() => { setAuthMode('reg_cnic'); setLoginSuccess(null); setLoginError(null); }}>
                  <Text style={styles.switchAuthLink}>Sign Up Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* --- WIZARD STEP 1: CNIC VALIDATION --- */}
        {authMode === 'reg_cnic' && (
          <View style={styles.regCard}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.regHeaderGradient}>
              <Text style={styles.regCardTitle}>Sign Up: Citizen CNIC</Text>
              <Text style={styles.regCardSubtitle}>Step 1 of 4: NADRA Verification</Text>
            </LinearGradient>

            <View style={styles.regForm}>
              <Text style={styles.label}>Enter CNIC Number (*)</Text>
              <TextInput
                style={styles.regInput}
                placeholder="e.g. 37405-1234567-1"
                placeholderTextColor="#9CA3AF"
                value={regCnic}
                onChangeText={(val) => { setRegCnic(val); setRegError(null); }}
              />
              <Text style={styles.hint}>Supported for: 37405-1234567-1, 35201-7654321-2, 42201-9876543-3</Text>

              {regError && (
                <Text style={styles.errorText}>⚠️ {regError}</Text>
              )}

              <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyCnic}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyBtnText}>Verify CNIC</Text>}
              </TouchableOpacity>

              <View style={styles.switchAuthContainer}>
                <TouchableOpacity onPress={() => { setAuthMode('login'); setLoginSuccess(null); setLoginError(null); }}>
                  <Text style={styles.switchAuthLink}>← Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* --- WIZARD STEP 2: SECURITY MATCHING --- */}
        {authMode === 'reg_details' && currentNadraRecord && (
          <View style={styles.regCard}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.regHeaderGradient}>
              <Text style={styles.regCardTitle}>Sign Up: SIM & Maiden Verification</Text>
              <Text style={styles.regCardSubtitle}>Step 2 of 4: Carrier Match</Text>
            </LinearGradient>

            <View style={styles.regForm}>
              <Text style={[styles.nadraValue, { marginBottom: 12 }]}>CNIC: {currentNadraRecord.cnic}</Text>

              <Text style={styles.label}>Full Name (as per CNIC)</Text>
              <TextInput
                style={styles.regInput}
                placeholder="Citizen's full name"
                placeholderTextColor="#9CA3AF"
                value={regName}
                onChangeText={(val) => { setRegName(val); setRegError(null); }}
              />
              <Text style={styles.hint}> Imran: Muhammad Imran | Aisha: Aisha Bibi | Syed Ali: Syed Ali</Text>

              <Text style={styles.label}>Mother's Maiden Name</Text>
              <TextInput
                style={styles.regInput}
                placeholder="Mother's name in registry"
                placeholderTextColor="#9CA3AF"
                value={regMother}
                onChangeText={(val) => { setRegMother(val); setRegError(null); }}
              />
              <Text style={styles.hint}> Imran: Kausar Bibi | Aisha: Zainab Begum | Syed Ali: Fatima Shah</Text>

              <Text style={styles.label}>Registered SIM Mobile Number</Text>
              <TextInput
                style={styles.regInput}
                placeholder="e.g. 03312933020"
                placeholderTextColor="#9CA3AF"
                value={regMobile}
                onChangeText={(val) => { setRegMobile(val); setRegError(null); }}
                keyboardType="phone-pad"
              />
              <Text style={styles.hint}> Must match the mobile registered against this CNIC (e.g. Imran: 03312933020)</Text>

              {regError && (
                <Text style={styles.errorText}>⚠️ {regError}</Text>
              )}

              <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyDetails}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyBtnText}>Verify Details</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- WIZARD STEP 3: OTP VERIFICATION --- */}
        {authMode === 'reg_otp' && (
          <View style={styles.regCard}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.regHeaderGradient}>
              <Text style={styles.regCardTitle}>Sign Up: SMS OTP Verification</Text>
              <Text style={styles.regCardSubtitle}>Step 3 of 4: Secure Handshake</Text>
            </LinearGradient>

            <View style={styles.regForm}>
              <Text style={styles.label}>Enter 4-Digit Security Code (OTP)</Text>
              <TextInput
                style={styles.regInput}
                placeholder="4821"
                placeholderTextColor="#9CA3AF"
                value={regOtp}
                onChangeText={(val) => { setRegOtp(val); setRegError(null); }}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.hint}> Mock security OTP sent: 4821</Text>

              {regError && (
                <Text style={styles.errorText}>⚠️ {regError}</Text>
              )}

              <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOtp}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyBtnText}>Verify OTP Code</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- WIZARD STEP 4: PASSWORD SETUP --- */}
        {authMode === 'reg_password' && currentNadraRecord && (
          <View style={styles.regCard}>
            <LinearGradient colors={['#10B981', '#059669']} style={styles.regHeaderGradient}>
              <Text style={styles.regCardTitle}>Sign Up: Complete Profile</Text>
              <Text style={styles.regCardSubtitle}>Step 4 of 4: Credentials</Text>
            </LinearGradient>

            <View style={styles.regForm}>
              <Text style={styles.label}>Create Password</Text>
              <TextInput
                style={styles.regInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={regPassword}
                onChangeText={(val) => { setRegPassword(val); setRegError(null); }}
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.regInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={regConfirmPassword}
                onChangeText={(val) => { setRegConfirmPassword(val); setRegError(null); }}
              />

              <View style={styles.nadraProfileContainer}>
                <Text style={styles.nadraTitle}>Retrieve Address from NADRA</Text>
                <Text style={[styles.nadraValue, { fontStyle: 'italic', marginBottom: 12 }]}>{currentNadraRecord.address}</Text>

                <Text style={styles.label}>Save Secondary Address 1 (e.g. Office)</Text>
                <TextInput
                  style={styles.regInput}
                  placeholder="Enter secondary address"
                  placeholderTextColor="#9CA3AF"
                  value={regSecAddr1}
                  onChangeText={setRegSecAddr1}
                />

                <Text style={styles.label}>Save Secondary Address 2 (e.g. Home 2)</Text>
                <TextInput
                  style={styles.regInput}
                  placeholder="Enter secondary address"
                  placeholderTextColor="#9CA3AF"
                  value={regSecAddr2}
                  onChangeText={setRegSecAddr2}
                />
              </View>

              {regError && (
                <Text style={styles.errorText}>⚠️ {regError}</Text>
              )}

              <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteSignup}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.completeBtnText}>Finalize Account Sign Up</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        </ScrollView>
      )}

      {/* --- ACTIVE CHAT ORCHESTRATOR SCREEN --- */}
      {authMode === 'chat' && userProfile && (
        <View style={styles.keyboardAvoid}>
          <LinearGradient
            colors={['#064E3B', '#022C22']}
            style={StyleSheet.absoluteFill}
          />
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Star_and_Crescent.svg/1024px-Star_and_Crescent.svg.png' }}
            style={[styles.watermarkImage, { tintColor: '#FFFFFF' }]}
            resizeMode="contain"
          />
          <KeyboardAvoidingView 
            style={styles.keyboardAvoid} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {activeBooking && (
              isBookingCardCollapsed ? (
                <TouchableOpacity 
                  style={styles.minimizedBookingBar} 
                  onPress={() => setIsBookingCardCollapsed(false)}
                >
                  <View style={styles.minimizedBookingLeft}>
                    <Text style={styles.minimizedBookingTitle}>
                      🔔 {chatLanguage === 'urdu' ? 'موجودہ بکنگ' : chatLanguage === 'roman_urdu' ? 'Active Booking' : 'Active Booking'}: {activeBooking.providerName}
                    </Text>
                    <View style={[
                      styles.statusBadgeMin, 
                      activeBooking.status === 'confirmed' && { backgroundColor: '#3B82F6' },
                      activeBooking.status === 'en_route' && { backgroundColor: '#8B5CF6' },
                      activeBooking.status === 'arrived' && { backgroundColor: '#F59E0B' },
                      activeBooking.status === 'completed' && { backgroundColor: '#10B981' },
                      activeBooking.status === 'disputed' && { backgroundColor: '#EF4444' },
                      activeBooking.status === 'refunded' && { backgroundColor: '#047857' },
                    ]}>
                      <Text style={styles.statusBadgeTextMin}>{activeBooking.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.expandText}>{chatLanguage === 'urdu' ? '[تفصیلات دیکھیں]' : '[Show Details]'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.activeBookingCard}>
                  <View style={styles.activeBookingHeader}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.activeBookingTitle}>
                          {chatLanguage === 'urdu' ? 'موجودہ بکنگ' : chatLanguage === 'roman_urdu' ? 'Active Booking' : 'Active Booking'}
                        </Text>
                        <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => setIsBookingCardCollapsed(true)}>
                          <Text style={styles.collapseText}>
                            {chatLanguage === 'urdu' ? '[تفصیلات چھپائیں]' : '[Hide Details]'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.activeBookingId}>ID: {activeBooking.id}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      activeBooking.status === 'confirmed' && { backgroundColor: '#3B82F6' },
                      activeBooking.status === 'en_route' && { backgroundColor: '#8B5CF6' },
                      activeBooking.status === 'arrived' && { backgroundColor: '#F59E0B' },
                      activeBooking.status === 'completed' && { backgroundColor: '#10B981' },
                      activeBooking.status === 'disputed' && { backgroundColor: '#EF4444' },
                      activeBooking.status === 'refunded' && { backgroundColor: '#047857' },
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {activeBooking.status === 'confirmed' && (chatLanguage === 'urdu' ? 'تصدیق شدہ' : chatLanguage === 'roman_urdu' ? 'Confirmed' : 'Confirmed')}
                        {activeBooking.status === 'en_route' && (chatLanguage === 'urdu' ? 'راستے میں' : chatLanguage === 'roman_urdu' ? 'En Route' : 'En Route')}
                        {activeBooking.status === 'arrived' && (chatLanguage === 'urdu' ? 'کام شروع' : chatLanguage === 'roman_urdu' ? 'In Progress' : 'In Progress')}
                        {activeBooking.status === 'completed' && (chatLanguage === 'urdu' ? 'مکمل شدہ' : chatLanguage === 'roman_urdu' ? 'Completed' : 'Completed')}
                        {activeBooking.status === 'disputed' && (chatLanguage === 'urdu' ? 'تنازعہ' : chatLanguage === 'roman_urdu' ? 'Disputed' : 'Disputed')}
                        {activeBooking.status === 'refunded' && (chatLanguage === 'urdu' ? 'رقم واپس' : chatLanguage === 'roman_urdu' ? 'Refunded' : 'Refunded')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activeBookingProvider}>
                    👨‍🔧 {activeBooking.providerName} • Rs {activeBooking.total}
                  </Text>
                  <Text style={styles.activeBookingTime}>
                    📅 {activeBooking.date} • {activeBooking.slot}
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View style={[
                      styles.progressBarFill, 
                      {
                        width: 
                          activeBooking.status === 'confirmed' ? '33%' :
                          activeBooking.status === 'en_route' ? '50%' :
                          activeBooking.status === 'arrived' ? '66%' : '100%',
                        backgroundColor:
                          activeBooking.status === 'confirmed' ? '#3B82F6' :
                          activeBooking.status === 'en_route' ? '#8B5CF6' :
                          activeBooking.status === 'arrived' ? '#F59E0B' :
                          activeBooking.status === 'disputed' ? '#EF4444' : '#10B981'
                      }
                    ]} />
                  </View>
                  <Text style={styles.simulatedTimeText}>
                    ⏰ Simulated Time: {new Date(Date.now() + simulatedTimeOffset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {activeBooking.status === 'confirmed' && getCanCancel() && (
                    <View style={styles.bookingActionRow}>
                      <TouchableOpacity style={[styles.bookingActionBtn, styles.cancelBtn]} onPress={handleCancelBooking}>
                        <Text style={styles.bookingActionBtnText}>❌ {chatLanguage === 'urdu' ? 'بکنگ منسوخ کریں' : 'Cancel Booking'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {activeBooking.status === 'completed' && (
                    <View style={styles.bookingActionRow}>
                      <TouchableOpacity style={[styles.bookingActionBtn, styles.ratingBtn]} onPress={handleRateService}>
                        <Text style={styles.bookingActionBtnText}>⭐ Rate Service</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.bookingActionBtn, styles.disputeBtn]} onPress={handleDisputeInitiate}>
                        <Text style={styles.bookingActionBtnText}>⚠️ Dispute / Issue</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.devToolsRow}>
                    <Text style={styles.devToolsLabel}>DEV CONTROLS:</Text>
                    <View style={styles.devToolsButtons}>
                      <TouchableOpacity style={styles.devBtn} onPress={() => setSimulatedTimeOffset(prev => prev + 60 * 60 * 1000)}>
                        <Text style={styles.devBtnText}>+1h</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.devBtn} onPress={() => setSimulatedTimeOffset(prev => prev + 2 * 60 * 60 * 1000)}>
                        <Text style={styles.devBtnText}>+2h</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.devBtn} onPress={() => setSimulatedTimeOffset(prev => prev + 5 * 60 * 60 * 1000)}>
                        <Text style={styles.devBtnText}>+5h</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.devBtn} onPress={() => setSimulatedTimeOffset(0)}>
                        <Text style={styles.devBtnText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )
            )}

            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map(msg => (
                <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot]}>
                  {msg.isTyping ? (
                    <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
                      <ActivityIndicator color="#10B981" size="small" />
                    </View>
                  ) : (
                    <View style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.botBubble]}>
                      {msg.sender === 'user' ? (
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.userGradient}>
                          <Text style={styles.userText}>{msg.text}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.botContent}>
                          <Text style={styles.botText}>{msg.text}</Text>
                          
                          {/* Chat interactive options (Location / Date / Time Slot) */}
                          {msg.type === 'location_select' && msg.options && (
                            <View style={styles.optionsContainer}>
                              {msg.options.map((opt, idx) => (
                                <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => selectLocation(opt)}>
                                  <Text style={styles.optionBtnText}>{opt}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {msg.type === 'date_select' && msg.options && (
                            <View style={styles.optionsContainer}>
                              {msg.options.map((opt, idx) => (
                                <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => selectDate(opt)}>
                                  <Text style={styles.optionBtnText}>📅 {opt}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {msg.type === 'timeslot_select' && msg.options && (
                            <View style={styles.optionsContainer}>
                              {msg.options.map((opt, idx) => (
                                <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => selectTimeSlot(opt)}>
                                  <Text style={styles.optionBtnText}>⏰ {opt}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {msg.type === 'dispute_select' && msg.options && (
                            <View style={styles.optionsContainer}>
                              {msg.options.map((opt, idx) => (
                                <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => handleDisputeResolve(opt)}>
                                  <Text style={styles.optionBtnText}>⚠️ {opt}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {msg.type === 'dispute_action_select' && msg.options && (
                            <View style={styles.optionsContainer}>
                              {msg.options.map((opt, idx) => (
                                <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => handleDisputeAction(opt)}>
                                  <Text style={styles.optionBtnText}>⚡ {opt}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {msg.type === 'fallback_select' && msg.options && (
                            <View style={styles.optionsContainer}>
                              {msg.options.map((opt, idx) => (
                                <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => handleFallbackSelect(opt)}>
                                  <Text style={styles.optionBtnText}>🔄 {opt}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {msg.type === 'refund_voucher' && msg.details && (
                            <View style={styles.refundVoucherCard}>
                              <LinearGradient colors={['#10B981', '#047857']} style={styles.refundVoucherGradient}>
                                <Text style={styles.refundVoucherTitle}>🛡️ Khidmat Recovery Voucher</Text>
                                <Text style={styles.refundVoucherId}>Booking ID: {msg.details.id}</Text>
                                
                                <View style={styles.refundDivider} />
                                
                                <View style={styles.refundDetailRow}>
                                  <Text style={styles.refundDetailLabel}>Provider Name:</Text>
                                  <Text style={styles.refundDetailValue}>{msg.details.providerName}</Text>
                                </View>
                                <View style={styles.refundDetailRow}>
                                  <Text style={styles.refundDetailLabel}>Refund Amount:</Text>
                                  <Text style={styles.refundDetailValueGreen}>Rs {msg.details.refundAmount}</Text>
                                </View>
                                <View style={styles.refundDetailRow}>
                                  <Text style={styles.refundDetailLabel}>Adjusted Total:</Text>
                                  <Text style={styles.refundDetailValue}>Rs {msg.details.adjustedTotal}</Text>
                                </View>
                                
                                <View style={styles.refundDivider} />
                                
                                <Text style={styles.refundCodeLabel}>PROMO VOUCHER CODE:</Text>
                                <Text style={styles.refundCode}>{msg.details.voucherCode}</Text>
                                <Text style={styles.refundStatus}>STATUS: REFUND SUCCESSFUL ✅</Text>
                              </LinearGradient>
                            </View>
                          )}

                          {msg.providers && (
                            <View style={styles.providersContainer}>
                              {msg.providers.map((p, idx) => (
                                <ProviderCard key={p.provider.id} match={p} isTop={idx === 0} onBook={() => handleBook(p)} />
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask for a service..."
                  placeholderTextColor="#9CA3AF"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={sendMessage}
                />
              </View>
              <TouchableOpacity style={styles.sendButtonContainer} onPress={sendMessage}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.sendButton}>
                  <Text style={styles.sendButtonText}>Send</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
      {/* --- BEAUTIFUL CUSTOM LOCATION MODAL POPUP --- */}
      {isCustomLocModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#064E3B', '#065F46']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 Custom Service Location</Text>
              <Text style={styles.modalSubtitle}>Specify exact details for proximity matching</Text>
            </LinearGradient>
            
            <ScrollView style={styles.modalForm} contentContainerStyle={{ paddingBottom: 24 }}>
              
              <Text style={styles.modalLabel}>1. Target City</Text>
              <View style={styles.cityButtonsContainer}>
                {(['Islamabad', 'Lahore', 'Karachi'] as const).map((city) => (
                  <TouchableOpacity 
                    key={city} 
                    style={[styles.citySelectBtn, customLocCity === city && styles.citySelectBtnActive]} 
                    onPress={() => setCustomLocCity(city)}
                  >
                    <Text style={[styles.citySelectBtnText, customLocCity === city && styles.citySelectBtnTextActive]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>2. Sector / Area (Matched with registry)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Clifton Block 5, Gulberg III, DHA Phase 5, F-11"
                placeholderTextColor="#9CA3AF"
                value={customLocArea}
                onChangeText={(val) => { setCustomLocArea(val); setCustomLocError(null); }}
              />
              <Text style={styles.hint}>Registry check: Must match the city's covered sectors (e.g. Johar Town, G-13)</Text>

              <Text style={styles.modalLabel}>3. House & Street details (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. House 45, Street 12-A"
                placeholderTextColor="#9CA3AF"
                value={customLocStreet}
                onChangeText={setCustomLocStreet}
              />

              {customLocError && (
                <Text style={styles.modalError}>⚠️ {customLocError}</Text>
              )}

              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmCustomLocation}>
                <Text style={styles.modalConfirmBtnText}>Confirm & Match Providers</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsCustomLocModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064E3B',
  },
  watermarkImage: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    top: '-10%',
    left: '10%',
    opacity: 0.05,
    transform: [{ rotate: '-15deg' }],
  },
  header: {
    padding: 16,
    paddingTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoIcon: {
    fontSize: 22,
    marginRight: 6,
  },
  aiBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  onlineText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 100,
  },
  messageWrapper: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperBot: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  userBubble: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderTopLeftRadius: 4,
  },
  userGradient: {
    padding: 14,
  },
  botContent: {
    padding: 14,
  },
  typingBubble: {
    padding: 16,
    width: 60,
    alignItems: 'center',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  botText: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 24,
  },
  providersContainer: {
    marginTop: 16,
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 60,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  sendButtonContainer: {
    marginLeft: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  sendButton: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  // --- AUTH CARD STYLES ---
  regScroll: {
    padding: 20,
    paddingBottom: 80,
    backgroundColor: '#022C22', // Patriotic dark green background
    minHeight: '100%',
  },
  regCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 40,
  },
  regHeaderGradient: {
    padding: 24,
    alignItems: 'center',
  },
  regCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  regCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    textAlign: 'center',
  },
  regForm: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 6,
  },
  regInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
  },
  hint: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  successText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  verifyBtn: {
    backgroundColor: '#064E3B',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  nadraProfileContainer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nadraTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 12,
  },
  nadraValue: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
    lineHeight: 20,
  },
  completeBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  switchAuthContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  switchAuthText: {
    color: '#6B7280',
    fontSize: 14,
  },
  switchAuthLink: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 14,
  },

  // --- MULTI-TURN CHAT OPTIONS ---
  optionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  optionBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  optionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  // --- BANNERS / SIMULATION POPUPS ---
  whatsappBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#25D366',
    borderRadius: 16,
    padding: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#128C7E',
  },
  whatsappText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  bannerCloseText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  pushNotification: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
  },
  pushTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
  },
  pushText: {
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#022C22',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#059669',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 4,
    textAlign: 'center',
  },
  modalForm: {
    padding: 20,
    maxHeight: 450,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
    marginTop: 16,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#064E3B',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#047857',
  },
  cityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  citySelectBtn: {
    flex: 1,
    backgroundColor: 'rgba(4, 120, 87, 0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  citySelectBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#34D399',
  },
  citySelectBtnText: {
    color: '#A7F3D0',
    fontWeight: '700',
    fontSize: 13,
  },
  citySelectBtnTextActive: {
    color: '#FFF',
  },
  modalConfirmBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalConfirmBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  modalCancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  modalCancelBtnText: {
    color: '#FCA5A5',
    fontWeight: '700',
    fontSize: 14,
  },
  modalError: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  headerTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  languageSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 44, 34, 0.6)',
    borderRadius: 20,
    padding: 3,
    marginTop: 12,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  langBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  langBtnText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '700',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },
  
  // --- ACTIVE BOOKING STICKY CARD STYLES ---
  activeBookingCard: {
    backgroundColor: 'rgba(2, 44, 34, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#059669',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },
  activeBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBookingTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeBookingId: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  activeBookingProvider: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  activeBookingTime: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  bookingActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  bookingActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBtn: {
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  disputeBtn: {
    backgroundColor: '#EF4444',
  },
  bookingActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  simulatedTimeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  devToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  devToolsLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '800',
  },
  devToolsButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  devBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  devBtnText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // --- MINIMIZED ACTIVE BOOKING STYLES ---
  minimizedBookingBar: {
    backgroundColor: 'rgba(2, 44, 34, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 99,
  },
  minimizedBookingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  minimizedBookingTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusBadgeMin: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeTextMin: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  expandText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  collapseText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // --- INTERACTIVE REFUND VOUCHER BUBBLE STYLES ---
  refundVoucherCard: {
    width: '100%',
    maxWidth: 320,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  refundVoucherGradient: {
    padding: 16,
  },
  refundVoucherTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  refundVoucherId: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  refundDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 10,
  },
  refundDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  refundDetailLabel: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '600',
  },
  refundDetailValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  refundDetailValueGreen: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '800',
  },
  refundCodeLabel: {
    color: '#A7F3D0',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  refundCode: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginVertical: 4,
  },
  refundStatus: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  }
});
