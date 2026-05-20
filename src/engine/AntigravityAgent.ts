import { Provider, providers } from '../data/mockData';
import { ParsedIntent, parseIntentWithAI, hasGeminiKey } from './gemini';

export interface AgentTrace {
  id: string;
  timestamp: Date;
  agentName: string;
  step: 'Understanding' | 'Matching' | 'Decision' | 'Pricing' | 'Simulation' | 'Fallback';
  message: string;
  details?: any;
}

export interface Quote {
  visitFee: number;
  distanceCost: number;
  urgencyAdjustment: number;
  complexityAdjustment: number;
  loyaltyDiscount: number;
  surgeCharge: number;
  total: number;
}

export interface MatchedProvider {
  provider: Provider;
  quote: Quote;
  matchScore: number;
  matchReasons: string[];
}

let traceListeners: ((traces: AgentTrace[]) => void)[] = [];
let traces: AgentTrace[] = [];

export const addTrace = (agentName: string, step: AgentTrace['step'], message: string, details?: any) => {
  const trace: AgentTrace = {
    id: Math.random().toString(36).substring(7),
    timestamp: new Date(),
    agentName,
    step,
    message,
    details
  };
  traces = [trace, ...traces];
  setTimeout(() => {
    traceListeners.forEach(listener => listener(traces));
  }, 0);
};

export const getTraces = () => [...traces];

export const subscribeToTraces = (listener: (traces: AgentTrace[]) => void) => {
  traceListeners.push(listener);
  return () => {
    traceListeners = traceListeners.filter(l => l !== listener);
  };
};

export const clearTraces = () => {
  traces = [];
  setTimeout(() => {
    traceListeners.forEach(listener => listener(traces));
  }, 0);
};

// 1. Identity Agent: Handles user registration and NADRA authorization
class IdentityAgent {
  private agentName = 'Identity Agent';

  verifyCNIC(cnic: string) {
    addTrace(this.agentName, 'Understanding', `Received CNIC Verification request for: ${cnic}`);
    addTrace(this.agentName, 'Understanding', 'Connecting to secure NADRA Identity database for verification...');
  }

  verifySecurityDetails(name: string, motherName: string, mobile: string) {
    addTrace(this.agentName, 'Understanding', `Initiated verification of security parameters for registration.`);
    addTrace(this.agentName, 'Understanding', `Verifying Citizen Name: "${name}" matches NADRA registered holder...`);
    addTrace(this.agentName, 'Understanding', `Verifying Mother's Maiden Name matches NADRA citizen registry...`);
    addTrace(this.agentName, 'Understanding', `Cross-referencing Mobile Number: ${mobile} with cellular carrier databases to verify SIM ownership against CNIC...`);
  }

  validationResult(success: boolean, message: string) {
    if (success) {
      addTrace(this.agentName, 'Decision', `Security validation passed successfully! Mobile SIM matches registered CNIC holder.`);
    } else {
      addTrace(this.agentName, 'Fallback', `Security validation failed: ${message}`);
    }
  }

  dispatchOTP(mobile: string) {
    addTrace(this.agentName, 'Simulation', `Dispatched mock OTP security code to cell: ${mobile}. Awaiting input.`);
  }

  verifyOTP(success: boolean) {
    if (success) {
      addTrace(this.agentName, 'Decision', `OTP successfully verified. Access token granted for password creation.`);
    } else {
      addTrace(this.agentName, 'Fallback', `Incorrect OTP code provided. Verification failed.`);
    }
  }

  registerUser(name: string, city: string, address: string, sec1?: string, sec2?: string) {
    addTrace(this.agentName, 'Decision', `Credentials locked! Account created successfully for citizen: ${name}.`);
  }
}

// 2. Routing Agent: Parses intent and handles NLP
class RoutingAgent {
  private agentName = 'Routing Agent';

  async parse(input: string): Promise<ParsedIntent> {
    addTrace(this.agentName, 'Understanding', `Analyzing user request: "${input}"`);

    let intent: ParsedIntent;
    
    if (hasGeminiKey()) {
      addTrace(this.agentName, 'Understanding', 'Routing to Google Gemini AI for deep intent extraction...');
      try {
        intent = await parseIntentWithAI(input);
      } catch (e) {
        addTrace(this.agentName, 'Fallback', 'Gemini API unavailable. Failing over to local heuristics.');
        intent = this.heuristicFallback(input);
      }
    } else {
      addTrace(this.agentName, 'Understanding', 'No API key detected. Using local NLP heuristic engine.');
      intent = this.heuristicFallback(input);
    }

    addTrace(this.agentName, 'Understanding', `Successfully extracted intent: ${intent.serviceType}`, intent);
    return intent;
  }

  private heuristicFallback(input: string): ParsedIntent {
    const lower = input.toLowerCase();
    let serviceType = '';
    
    if (lower.includes('ac') || lower.includes('cooling') || lower.includes('thanda') || lower.includes('اے سی') || lower.includes('اےسی') || lower.includes('کولنگ') || lower.includes('ٹھنڈا')) serviceType = 'AC Repair';
    else if (lower.includes('bijli') || lower.includes('light') || lower.includes('electrician') || lower.includes('wire') || lower.includes('بجلی') || lower.includes('الیکٹریشن') || lower.includes('تار') || lower.includes('لائٹ')) serviceType = 'Electrician';
    else if (lower.includes('pani') || lower.includes('plumber') || lower.includes('leak') || lower.includes('pipe') || lower.includes('motor') || lower.includes('پلمبر') || lower.includes('پانی') || lower.includes('لیک') || lower.includes('پائپ') || lower.includes('موٹر')) serviceType = 'Plumber';
    else if (lower.includes('wood') || lower.includes('carpenter') || lower.includes('lakri') || lower.includes('darwaza') || lower.includes('کارپینٹر') || lower.includes('بڑھئی') || lower.includes('لکڑی') || lower.includes('دروازہ')) serviceType = 'Carpenter';
    else if (lower.includes('gari') || /\bcar\b/i.test(lower) || lower.includes('mechanic') || lower.includes('start nahi') || lower.includes('میکینک') || lower.includes('گاڑی') || lower.includes('کار')) serviceType = 'Mechanic';
    else if (lower.includes('clean') || lower.includes('safai') || lower.includes('cleaner') || lower.includes('maid') || lower.includes('صفائی') || lower.includes('خادمہ') || lower.includes('صاف')) serviceType = 'House Cleaner';
    else if (lower.includes('paint') || lower.includes('rang') || lower.includes('colour') || lower.includes('painter') || lower.includes('پینٹر') || lower.includes('رنگ') || lower.includes('رنگساز')) serviceType = 'Painter';

    let urgency: 'high'|'medium'|'low' = 'medium';
    if (lower.includes('urgent') || lower.includes('abhi') || lower.includes('fori') || lower.includes('nahi kar raha') || lower.includes('jaldi') || lower.includes('emergency')) urgency = 'high';

    let isGreeting = false;
    let isThanks = false;
    let isOk = false;

    if (!serviceType) {
      if (
        lower.includes('asalam') || 
        lower.includes('salam') || 
        lower.includes('hi') || 
        lower.includes('hello') || 
        lower.includes('hey') || 
        lower.includes('aao') || 
        lower.includes('وعلیکم') || 
        lower.includes('السلام') ||
        lower.includes('ہیلو') ||
        lower.includes('سلام')
      ) {
        isGreeting = true;
      }
      else if (
        lower.includes('thank') || 
        lower.includes('shukriya') || 
        lower.includes('shukria') || 
        lower.includes('jazak') || 
        lower.includes('شکریہ') || 
        lower.includes('جزاک') || 
        lower.includes('مہربانی')
      ) {
        isThanks = true;
      }
      else if (
        lower.includes('ok') || 
        lower.includes('okay') || 
        lower.includes('theek') || 
        lower.includes('haan') || 
        lower.includes('yes') || 
        lower.includes('ji ') || 
        lower.trim() === 'ji' || 
        lower.includes('ٹھیک') || 
        lower.includes('جی ') || 
        lower.trim() === 'جی' || 
        lower.includes('ہاں')
      ) {
        isOk = true;
      }
    }

    let complexity: 'basic' | 'intermediate' | 'complex' = 'basic';
    if (
      lower.includes('compressor') || 
      lower.includes('wiring') || 
      lower.includes('complete') || 
      lower.includes('short circuit') || 
      lower.includes('rebuilding') || 
      lower.includes('overhaul') ||
      lower.includes('shart circuit') || 
      lower.includes('مکمل') || 
      lower.includes('کمپریسر') || 
      lower.includes('وائرنگ') || 
      lower.includes('شارٹ سرکٹ')
    ) {
      complexity = 'complex';
    } else if (
      lower.includes('gas') || 
      lower.includes('refilling') || 
      lower.includes('leak') || 
      lower.includes('faucet') || 
      lower.includes('socket') || 
      lower.includes('geyser') || 
      lower.includes('board') || 
      lower.includes('button') || 
      lower.includes('switch') || 
      lower.includes('گیزر') || 
      lower.includes('لیک') || 
      lower.includes('فٹ کرنا') || 
      lower.includes('گیس') || 
      lower.includes('بورڈ') || 
      lower.includes('بٹن') || 
      lower.includes('سوئچ')
    ) {
      complexity = 'intermediate';
    }

    const isPleasantry = isGreeting || isThanks || isOk;

    return {
      serviceType: serviceType || 'Unknown',
      location: 'Unknown',
      urgency,
      preferredTime: lower.includes('kal') ? 'Tomorrow' : 'Asap',
      priceSensitivity: lower.includes('budget') || lower.includes('sasta') || lower.includes('cheap') ? 'high' : 'medium',
      confidenceScore: serviceType ? 85 : 10,
      needsClarification: !serviceType && !isPleasantry,
      clarificationMessage: !serviceType && !isPleasantry ? 'Maazrat, kya aap bata sakte hain aapko konsi service chahiye? (Carpenter, Painter, House Cleaner, Plumber, AC Repair, Electrician)' : undefined,
      language: 'Mixed',
      isGreeting,
      isThanks,
      isOk,
      complexity
    };
  }
}

// 3. Matching Agent: Runs 6-factor algorithm, filtering by City and location
class MatchingAgent {
  private agentName = 'Matching Agent';

  findMatches(intent: ParsedIntent, userCity: 'Islamabad' | 'Lahore' | 'Karachi', confirmedLocation: string): MatchedProvider[] {
    addTrace(this.agentName, 'Matching', `Scanning marketplace in ${userCity} near ${confirmedLocation} for available ${intent.serviceType}s...`);
    
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normInput = normalize(confirmedLocation);

    const candidates = providers.filter(p => {
      const normLoc = normalize(p.location);
      const isLocMatch = normLoc.includes(normInput) || normInput.includes(normLoc);
      
      return (
        p.category.includes(intent.serviceType) && 
        p.city === userCity && 
        p.isAvailable &&
        isLocMatch
      );
    });
    
    if (candidates.length === 0) {
      addTrace(this.agentName, 'Fallback', `No providers found for ${intent.serviceType} in ${userCity}. Handing off to Recovery Agent.`);
      return [];
    }

    addTrace(this.agentName, 'Matching', `Found ${candidates.length} candidates in ${userCity}. Executing 6-factor matching algorithm...`);
    addTrace(this.agentName, 'Simulation', 'Provider workload balancing active: checking candidate daily hours to maintain fair earning opportunities.');
    addTrace(this.agentName, 'Simulation', `Demand forecasting: predicting high search query volume in ${confirmedLocation} for upcoming slots. Recommending peak utilization windows.`);

    const ranked = candidates.map(provider => {
      let score = 100;
      const reasons: string[] = [];

      let simulatedDistance = Math.floor(Math.random() * 5) + 1; 
      if (confirmedLocation.toLowerCase().includes(provider.location.toLowerCase())) {
        simulatedDistance = 0.8; 
        score += 15;
        reasons.push(`Direct match in ${provider.location}`);
      } else {
        reasons.push(`Located in ${provider.location}`);
      }

      if (simulatedDistance > 3) { score -= 10; reasons.push(`Distance (${simulatedDistance}km)`); }
      else { score += 10; reasons.push(`Proximity (${simulatedDistance}km)`); }

      if (provider.rating >= 4.5) { score += 20; reasons.push(`High rating (${provider.rating} ⭐)`); }
      else if (provider.rating < 4.0) { score -= 20; reasons.push(`Lower rating`); }

      if (provider.reliabilityScore > 90) { score += 15; reasons.push('Excellent on-time reliability'); }
      else if (provider.reliabilityScore < 70) { score -= 15; reasons.push('Low reliability history'); }

      if (provider.cancellationRate > 10) { score -= 25; reasons.push(`Cancellation risk`); }

      if (intent.priceSensitivity === 'high') {
        if (provider.baseRateHourly > 1200) { score -= 15; reasons.push('Over budget'); }
        else { score += 15; reasons.push('Budget-friendly'); }
      }

      // Complexity Matching Factor
      const comp = intent.complexity || 'basic';
      const exp = provider.experienceYears || 3;
      if (comp === 'complex') {
        if (exp >= 5) {
          score += 25;
          reasons.push(`Highly experienced for complex work (${exp} yrs exp)`);
        } else {
          score -= 30;
          reasons.push(`Under-experienced for complex work (${exp} yrs exp)`);
        }
      } else if (comp === 'intermediate') {
        if (exp >= 3) {
          score += 15;
          reasons.push(`Experienced for intermediate task (${exp} yrs exp)`);
        } else {
          score -= 10;
          reasons.push(`Low experience for intermediate task (${exp} yrs exp)`);
        }
      } else {
        if (exp < 3) {
          score += 10;
          reasons.push(`Junior provider preferred for basic task (${exp} yrs exp)`);
        } else {
          reasons.push(`Fully qualified for basic task (${exp} yrs exp)`);
        }
      }
      const quote = this.generateQuote(provider, intent, simulatedDistance);
      return { provider: { ...provider, distanceKm: simulatedDistance }, quote, matchScore: score, matchReasons: reasons };
    });

    ranked.sort((a, b) => b.matchScore - a.matchScore);

    ranked.forEach((r, idx) => {
      addTrace(this.agentName, 'Matching', `#${idx+1} ${r.provider.name} | Rate: Rs ${r.provider.baseRateHourly}/hr | Rating: ${r.provider.rating}⭐ | Score: ${r.matchScore} (${r.matchReasons.join(', ')})`);
    });

    if (ranked.length > 0) {
      const top = ranked[0];
      addTrace(this.agentName, 'Decision', `Selected ${top.provider.name} as best match with score ${top.matchScore} near ${confirmedLocation}.`);
    }

    return ranked;
  }

  generateQuote(provider: Provider, intent: ParsedIntent, distance: number): Quote {
    const visitFee = provider.baseRateHourly;
    const distanceCost = Math.round(distance * 50);
    const urgencyAdjustment = intent.urgency === 'high' ? 300 : 0;
    
    let complexityAdjustment = 0;
    const comp = intent.complexity || 'basic';
    if (comp === 'complex') complexityAdjustment = 500;
    else if (comp === 'intermediate') complexityAdjustment = 200;

    const demandSurgeRate = intent.urgency === 'high' ? 0.15 : 0;
    const surgeCharge = Math.round((visitFee + complexityAdjustment) * demandSurgeRate);

    const loyaltyDiscount = Math.min(150, Math.round(visitFee * 0.10));

    const total = visitFee + distanceCost + urgencyAdjustment + complexityAdjustment + surgeCharge - loyaltyDiscount;

    const fairnessMsg = `Pricing breakdown for ${provider.name}: Base: Rs ${visitFee} | Travel: Rs ${distanceCost} | Urgency: Rs ${urgencyAdjustment} | Complexity: Rs ${complexityAdjustment} | Surge: Rs ${surgeCharge} | Loyalty: -Rs ${loyaltyDiscount} = Total: Rs ${total}. ` +
      `[Fairness Analysis]: Provider gets fair compensation for specialized skills (Rs ${visitFee + complexityAdjustment + surgeCharge}), and user receives a loyalty discount (Rs ${loyaltyDiscount}) and proportional travel fee.`;

    addTrace('Pricing Agent', 'Pricing', fairnessMsg);

    return { 
      visitFee, 
      distanceCost, 
      urgencyAdjustment, 
      complexityAdjustment, 
      loyaltyDiscount, 
      surgeCharge, 
      total 
    };
  }
}

// 4. Booking Agent: Handles confirmation, time slots, scheduling, WhatsApp & Alerts
class BookingAgent {
  private agentName = 'Booking Agent';

  confirmLocationPrompt(addresses: string[]) {
    addTrace(this.agentName, 'Simulation', 'Requesting location confirmation from user addresses.');
  }

  confirmLocationSelected(location: string) {
    addTrace(this.agentName, 'Simulation', `Location confirmed by user: "${location}". Dispatching to Matching Agent.`);
  }

  confirmTimeSlotSelected(slot: string, providerName: string) {
    addTrace(this.agentName, 'Simulation', `Time slot reserved: ${slot} with ${providerName}.`);
  }

  simulateBooking(provider: Provider, quote: Quote, timeSlot: string, address: string) {
    addTrace(this.agentName, 'Simulation', `Initiating confirmation handshake with ${provider.name} for ${timeSlot}...`);
    
    const travelBuffer = Math.ceil((provider.distanceKm || 3) * 8);
    addTrace(this.agentName, 'Simulation', `Scheduling intelligence: Allocated ${travelBuffer}-minute travel buffer based on travel distance (${provider.distanceKm || 3}km).`);
    addTrace(this.agentName, 'Simulation', `Synchronized and updated provider ${provider.name}'s calendar slot.`);

    setTimeout(() => {
      const bookingId = 'BK-' + Math.floor(Math.random() * 10000);
      addTrace(this.agentName, 'Simulation', `Booking ${bookingId} Confirmed! Total Rs ${quote.total}.`, { amount: quote.total, slot: timeSlot });
      addTrace(this.agentName, 'Simulation', `WhatsApp Booking Notification dispatched successfully.`, { recipient: provider.name });
      addTrace(this.agentName, 'Simulation', `Scheduled 1-hour pre-arrival notification alert.`, { arrival: timeSlot });
      addTrace(this.agentName, 'Simulation', `Updated central transaction spreadsheet and mock SQL database logs for Booking ID ${bookingId}.`);
    }, 1000);
  }
}

// 5. Recovery Agent: Handles disputes, no-shows
class RecoveryAgent {
  private agentName = 'Recovery Agent';

  handleNoProvidersFound() {
    addTrace(this.agentName, 'Simulation', 'Initiated schedule retry queue. Will notify user when a provider becomes available.');
  }

  simulateDispute() {
    addTrace(this.agentName, 'Fallback', 'User disputed the final price after service. Intervening...', { issue: 'Price Disagreement' });
    setTimeout(() => {
      addTrace(this.agentName, 'Simulation', 'Analyzed reliability history. Issued 10% partial refund to user automatically.', { resolution: 'Refund Issued' });
    }, 2000);
  }
}

// Master Orchestrator: Facade that coordinates specialized agents
export class MasterOrchestrator {
  private identityAgent = new IdentityAgent();
  private routingAgent = new RoutingAgent();
  private matchingAgent = new MatchingAgent();
  private bookingAgent = new BookingAgent();
  private recoveryAgent = new RecoveryAgent();

  verifyCNIC(cnic: string) {
    this.identityAgent.verifyCNIC(cnic);
  }

  verifySecurityDetails(name: string, motherName: string, mobile: string) {
    this.identityAgent.verifySecurityDetails(name, motherName, mobile);
  }

  validationResult(success: boolean, message: string) {
    this.identityAgent.validationResult(success, message);
  }

  dispatchOTP(mobile: string) {
    this.identityAgent.dispatchOTP(mobile);
  }

  verifyOTP(success: boolean) {
    this.identityAgent.verifyOTP(success);
  }

  registerUser(name: string, city: string, address: string, sec1?: string, sec2?: string) {
    this.identityAgent.registerUser(name, city, address, sec1, sec2);
  }

  confirmLocationPrompt(addresses: string[]) {
    this.bookingAgent.confirmLocationPrompt(addresses);
  }

  confirmLocationSelected(location: string) {
    this.bookingAgent.confirmLocationSelected(location);
  }

  confirmTimeSlotSelected(slot: string, providerName: string) {
    this.bookingAgent.confirmTimeSlotSelected(slot, providerName);
  }

  async processRequest(input: string): Promise<ParsedIntent> {
    return this.routingAgent.parse(input);
  }

  matchProviders(intent: ParsedIntent, city: 'Islamabad' | 'Lahore' | 'Karachi', location: string): MatchedProvider[] {
    const matches = this.matchingAgent.findMatches(intent, city, location);
    if (matches.length === 0) {
      this.recoveryAgent.handleNoProvidersFound();
    }
    return matches;
  }

  simulateBooking(provider: Provider, quote: Quote, timeSlot: string, address: string) {
    this.bookingAgent.simulateBooking(provider, quote, timeSlot, address);
  }

  generateQuote(provider: Provider, intent: ParsedIntent, distance: number): Quote {
    return this.matchingAgent.generateQuote(provider, intent, distance);
  }

  simulateDispute() {
    this.recoveryAgent.simulateDispute();
  }
}

export const agent = new MasterOrchestrator();
