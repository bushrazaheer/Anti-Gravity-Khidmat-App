import { addTrace } from './AntigravityAgent';

// --- CALLMEBOT CONFIG (requires one-time WhatsApp activation) ---
const CALLMEBOT_API_KEY = process.env.EXPO_PUBLIC_CALLMEBOT_API_KEY || '';
const CALLMEBOT_PHONE   = process.env.EXPO_PUBLIC_CALLMEBOT_PHONE   || '+923312933020';

// --- GREEN API CONFIG (requires QR scan once on green-api.com) ---
const GREEN_API_INSTANCE = process.env.EXPO_PUBLIC_GREEN_API_INSTANCE || '';
const GREEN_API_TOKEN    = process.env.EXPO_PUBLIC_GREEN_API_TOKEN    || '';

/**
 * Format message with premium branding header for "Khidmat 24/7 AI Services"
 */
export const formatBrandedMessage = (text: string): string => {
  return `🤖 *KHIDMAT 24/7 AI SERVICES*\n*Patriotic Service Delivery Platform*\n🇵🇰 -----------------------------------\n\n${text}`;
};

/** Convert local PK number to international without + */
const toInternational = (phone: string): string => {
  let clean = phone.trim().replace(/[-\s]/g, '');
  if (clean.startsWith('0')) clean = '92' + clean.substring(1);
  else if (clean.startsWith('+')) clean = clean.substring(1);
  return clean;
};

/**
 * Try Green API first (QR-scan based, most reliable), then fall back to CallMeBot.
 * Both require one-time developer setup only — the end-user does nothing.
 */
export const sendWhatsAppNotification = async (rawText: string): Promise<boolean> => {
  const formattedText = formatBrandedMessage(rawText);

  // ── TIER 1: Green API (scan QR once on green-api.com — free 500 msgs/month) ──
  if (GREEN_API_INSTANCE && GREEN_API_TOKEN) {
    const chatId = toInternational(CALLMEBOT_PHONE) + '@c.us';
    const url = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE}/sendMessage/${GREEN_API_TOKEN}`;

    addTrace('WhatsApp Agent', 'Simulation', `[Green API] Dispatching to chatId: ${chatId}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: formattedText }),
      });
      const data = await response.json();
      if (response.ok && data.idMessage) {
        addTrace('WhatsApp Agent', 'Decision', `[Green API] ✅ Message delivered! idMessage: ${data.idMessage}`);
        return true;
      } else {
        addTrace('WhatsApp Agent', 'Fallback', `[Green API] ⚠️ Error: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      addTrace('WhatsApp Agent', 'Fallback', `[Green API] Network error: ${e.message || e}`);
    }
  }

  // ── TIER 2: CallMeBot (activate once via WhatsApp message) ──
  if (CALLMEBOT_API_KEY && CALLMEBOT_API_KEY.trim() !== '') {
    let cleanPhone = CALLMEBOT_PHONE.trim().replace(/[-\s]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '+92' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(formattedText)}&apikey=${encodeURIComponent(CALLMEBOT_API_KEY)}`;

    addTrace('WhatsApp Agent', 'Simulation', `[CallMeBot] Attempting delivery to: ${cleanPhone}`);

    try {
      const response = await fetch(url);
      const body = await response.text();
      if (response.ok && !body.includes('APIKey is invalid') && !body.includes('error')) {
        addTrace('WhatsApp Agent', 'Decision', `[CallMeBot] ✅ Message sent successfully!`);
        return true;
      } else {
        addTrace('WhatsApp Agent', 'Fallback', `[CallMeBot] ⚠️ Response: ${body.substring(0, 200)}`);
      }
    } catch (e: any) {
      addTrace('WhatsApp Agent', 'Fallback', `[CallMeBot] Network error: ${e.message || e}`);
    }
  }

  addTrace('WhatsApp Agent', 'Simulation', 'No active WhatsApp gateway configured. Use wa.me redirect instead.');
  return false;
};

/**
 * Generates an interactive wa.me link as a demo/manual fallback
 */
export const getWhatsAppRedirectUrl = (rawText: string): string => {
  const formattedText = formatBrandedMessage(rawText);
  const cleanPhone = toInternational(CALLMEBOT_PHONE);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedText)}`;
};
