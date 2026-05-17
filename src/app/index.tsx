import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Head from 'expo-router/head';
import { agent, MatchedProvider, addTrace } from '@/engine/AntigravityAgent';
import { ProviderCard } from '@/components/ProviderCard';
import { NadraDatabase, NadraRecord, RegisteredUsers, UserCredential } from '@/data/mockData';

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
  type?: 'text' | 'location_select' | 'timeslot_select' | 'date_select';
  options?: string[];
}

type AuthMode = 'login' | 'reg_cnic' | 'reg_details' | 'reg_otp' | 'reg_password' | 'chat';

export default function HomeScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('login'); // Default is Login

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
      setMessages([
        { 
          id: 'm1', 
          sender: 'bot', 
          text: `Assalam o Alaikum, ${userProfile.name}! Khidmat 24/7 AI Service Orchestrator me aapka khush amdeed.\n\nAapki profile successfully login ho chuki hai. registered shehar: ${userProfile.city}.\n\nAaj aapko kis kisam ki service chahiye? (e.g. "I need a Carpenter", "House Cleaner chahiye", "Painter jaldi bheinjein")` 
        }
      ]);
    }
  }, [userProfile, authMode]);

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

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    const input = inputText;
    setInputText('');

    const typingId = 'typing_' + Date.now();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    // Step 1: Parse Intent
    const intent = await agent.processRequest(input);
    setMessages(prev => prev.filter(m => m.id !== typingId));

    if (intent.needsClarification) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: intent.clarificationMessage || 'Maazrat, kya aap thoda wazeh kar sakte hain?' }]);
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
      id: 'loc_' + Date.now(),
      sender: 'bot',
      text: `[Booking Agent] Aapki request ${intent.serviceType} ke liye hai. Please service ki location confirm karein:`,
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
      id: Date.now().toString(),
      sender: 'user',
      text: `Confirmed Location: ${location}`
    }]);

    const typingId = 'typing_' + Date.now();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));

      const targetCity = (customCity || userProfile.city) as 'Islamabad' | 'Lahore' | 'Karachi';
      const targetArea = customArea || location;

      // Match Providers Near Location
      const matches = agent.matchProviders(currentIntent, targetCity, targetArea);

      if (matches.length === 0) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          sender: 'bot', 
          text: `Maazrat, hum bohot sharminda hain par aapke bataye hue location "${location}" me abhi hamara koi ${currentIntent.serviceType} dastyab nahi hai. Insha'Allah hum jald hi aapke area me apni services shuru karenge!` 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          sender: 'bot', 
          text: `Humne aapke location ke mutabiq providers dhoond liye hain (AI Match Confidence: ${currentIntent.confidenceScore}%):`,
          providers: matches
        }]);
      }
    }, 1000);
  };


  const handleBook = (provider: MatchedProvider) => {
    setSelectedProvider(provider);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text: `Book ${provider.provider.name}`
    }]);

    // Generate Dynamic Date Options (Today, Tomorrow, Day after)
    const today = new Date();
    const todayStr = `Today (${today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`;
    
    const tom = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomStr = `Tomorrow (${tom.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`;
    
    const dayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dayAfterStr = `Day after (${dayAfter.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`;

    setMessages(prev => [...prev, {
      id: 'date_' + Date.now(),
      sender: 'bot',
      text: `[Booking Agent] Please select your preferred arrival Date for ${provider.provider.name}:`,
      type: 'date_select',
      options: [todayStr, tomStr, dayAfterStr]
    }]);
  };

  const selectDate = (dateOption: string) => {
    setSelectedDate(dateOption);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text: `Selected Date: ${dateOption}`
    }]);

    const typingId = 'typing_' + Date.now();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));

      // Calculate slots based on Date selection and current local time
      const today = new Date();
      const isToday = dateOption.startsWith('Today');
      
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
          .map(s => s.label);
      } else {
        availableSlots = allSlots.map(s => s.label);
      }

      if (availableSlots.length === 0) {
        setMessages(prev => [...prev, {
          id: 'time_fail_' + Date.now(),
          sender: 'bot',
          text: `[Booking Agent] Maazrat, aaj ke din ke liye ab koi time slot available nahi hai (minimum 2 hours advance booking ki zaroorat hai).\n\nPlease select another date from the options above or schedule for tomorrow/day after.`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: 'time_' + Date.now(),
          sender: 'bot',
          text: `[Booking Agent] Please select your preferred arrival time slot for ${selectedProvider?.provider.name} on ${dateOption}:`,
          type: 'timeslot_select',
          options: availableSlots
        }]);
      }
    }, 800);
  };

  const selectTimeSlot = (slot: string) => {
    if (!selectedProvider || !userProfile) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      text: `Selected Time Slot: ${slot}`
    }]);

    agent.confirmTimeSlotSelected(slot, selectedProvider.provider.name);
    const typingId = 'typing_' + Date.now();
    setMessages(prev => [...prev, { id: typingId, sender: 'bot', text: '', isTyping: true }]);

    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      
      // Step 5: Simulate Booking Handshake
      agent.simulateBooking(selectedProvider.provider, selectedProvider.quote, `${selectedDate} at ${slot}`, selectedLocation);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: `🎉 Shabaash! Aapki booking ${selectedProvider.provider.name} ke sath confirm ho chuki hai for ${selectedDate} (${slot}).\n\n✅ WhatsApp message aur status details bhej diye gaye hain.`
      }]);

      // WhatsApp Message Mock
      setWhatsappBanner({
        visible: true,
        text: `🟢 WhatsApp Confirmation\nTo: ${userProfile.name} (${userProfile.mobile})\nYour Khidmat booking for ${currentIntent.serviceType} with ${selectedProvider.provider.name} is confirmed for ${selectedDate} at ${slot} at ${selectedLocation}. Total: Rs ${selectedProvider.quote.total}.`
      });

      // 1hr Push Notification Mock
      setTimeout(() => {
        setPushNotification({
          visible: true,
          text: `🔔 Khidmat Notification (1hr before)\nReminder: ${selectedProvider.provider.name} (${currentIntent.serviceType}) is scheduled to arrive at your address in 1 hour!`
        });
      }, 3500);

    }, 1500);
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
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🌙</Text>
          <Text style={styles.headerTitle}>Khidmat 24/7</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Antigravity Active</Text>
        </View>
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
                placeholder="e.g. 0300-1234567"
                placeholderTextColor="#9CA3AF"
                value={regMobile}
                onChangeText={(val) => { setRegMobile(val); setRegError(null); }}
                keyboardType="phone-pad"
              />
              <Text style={styles.hint}> Must match the mobile registered against this CNIC (e.g. Imran: 0300-1234567)</Text>

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
  }
});
