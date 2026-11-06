/**
 * FixNow - Mock Database, Shared Data Store & Central Category Intelligence
 * =========================================================================
 * Provides:
 * 1. FIXNOW_CATEGORY_MAP: Unified keyword, synonym, and intent mapping for
 *    Voice Assistant, Search Bar, and Category Filtering.
 * 2. identifyCategory(text): Single source of truth for natural language
 *    understanding across English, Telugu, and Tamil.
 * 3. Curated Demo Providers: 5 realistic, clearly tagged demo technicians.
 * 4. getEffectiveProviders(): Combines demo data with user-registered providers
 *    from localStorage.
 * 5. Household Digital Twin: Equipment logs, health score, and AI risk analysis.
 * =========================================================================
 */

// === 1. UNIFIED SERVICE CATEGORY MAPPING ===
const FIXNOW_CATEGORY_MAP = {
  "beautician": {
    id: "beautician",
    name: "Beautician",
    displayTitle: "Beautician / Salon",
    singular: "beautician",
    icon: "✂️",
    count: 0,
    desc: "Doorstep beauty parlour, haircut, makeup, facial & bridal grooming",
    keywords: [
      "beautician", "beauty", "beauty parlour", "beauty parlor", "salon", "makeup",
      "haircut", "hair styling", "hair style", "bridal makeup", "facial", "waxing",
      "threading", "pedicure", "manicure", "mehendi", "grooming", "skin care",
      "hairdresser", "parlour", "parlor",
      // Telugu
      "బ్యూటీషియన్", "పార్లర్", "మేకప్", "హెయిర్‌కట్", "ఫేషియల్", "బ్యూటీ", "పెళ్ళి మేకప్",
      // Hindi
      "ब्यूटीशियन", "पार्लर", "मेकअप", "हेयरकट", "फेशियल", "दुल्हन मेकअप", "ब्यूटी", "सैलून", "हेयर स्टाइल",
      // Tamil
      "பியூட்டீசியன்", "அழகு நிலையம்", "மேக்கப்", "ஹேர்கட்", "அழகு கலைஞர்"
    ],
    responses: {
      english: "I can help you find a beautician near you. Opening beautician services.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న బ్యూటీషియన్ సేవలను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी ब्यूटीशियन सेवाएँ ढूँढने में मदद करूँगा।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள பியூட்டீசியன் சேவைகளைக் காண்பிக்கிறேன்."
    }
  },
  "ac-repair": {
    id: "ac-repair",
    name: "AC Repair",
    displayTitle: "AC Repair Specialist",
    singular: "AC repair technician",
    icon: "❄️",
    count: 0,
    desc: "Foam jet cleaning, gas refill, capacitor check & split AC installation",
    keywords: [
      "ac", "air conditioner", "air conditioning", "ac repair", "ac service", "cooling problem",
      "split ac", "window ac", "gas refill", "compressor", "ac cooling", "ac mechanic", "duct",
      "ac not cooling", "ac not working", "repair my ac",
      // Telugu
      "ఏసీ", "ఎయిర్ కండీషనర్", "కూలింగ్", "గ్యాస్", "ఏసీ రిపేర్", "ఏసీ సర్వీస్", "ఏసీ పనిచేయడం లేదు",
      // Hindi
      "एसी", "एयर कंडीशनर", "कूलिंग", "गैस रिफिल", "एसी रिपेयर", "एसी सर्विस", "एसी काम नहीं कर रहा", "एसी मैकेनिक",
      // Tamil
      "ஏசி", "குளிர்ச்சி", "ஏர் கண்டிஷனர்", "ஏசி பழுது", "ஏசி வேலை செய்யவில்லை"
    ],
    responses: {
      english: "I understand. You need AC repair. I'll show nearby AC repair services.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న ఏసీ రిపేర్ నిపుణులను చూపిస్తున్నాను.",
      hindi: "मैं समझ गया। आपको एसी रिपेयर की ज़रूरत है। मैं नज़दीकी एसी सर्विस दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள ஏசி பழுதுபார்க்கும் சேவைகளைக் காண்பிக்கிறேன்."
    }
  },
  "electrician": {
    id: "electrician",
    name: "Electrician",
    displayTitle: "Senior Electrician",
    singular: "electrician",
    icon: "⚡",
    count: 0,
    desc: "Short-circuit diagnosis, fan fitting, inverter wiring & MCB switchboards",
    keywords: [
      "electrician", "electrical", "wiring", "switch", "fan", "light", "current",
      "fuse", "short circuit", "mcb", "inverter", "power trip", "power problem",
      "tubelight", "meter", "electrical repair", "ceiling fan", "switchboard",
      // Telugu
      "ఎలక్ట్రీషియన్", "కరెంట్", "వైరింగ్", "ఫ్యాన్", "ఇన్వర్టర్", "స్విచ్", "ఫ్యూజ్", "కరెంట్ పోయింది",
      // Hindi
      "इलेक्ट्रीशियन", "बिजली", "वायरिंग", "पंखा", "स्विच", "शॉर्ट सर्किट", "इन्वर्टर", "फ्यूज", "लाइट खराब", "बिजली मिस्त्री",
      // Tamil
      "எலக்ட்ரீஷியன்", "மின்சாரம்", "மின்விசிறி", "வயரிங்", "சுவிட்ச்", "மின்சார பிரச்சனை"
    ],
    responses: {
      english: "Sure. I'll show nearby electricians.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న ఎలక్ట్రీషియన్లను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी इलेक्ट्रीशियन दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள எலக்ட்ரீஷியன்களைக் காண்பிக்கிறேன்."
    }
  },
  "plumber": {
    id: "plumber",
    name: "Plumber",
    displayTitle: "Master Plumber",
    singular: "plumber",
    icon: "🚰",
    count: 0,
    desc: "Tap leakage, pipe blockage, booster pump repairs & Sintex tank cleaning",
    keywords: [
      "plumber", "plumbing", "water leakage", "pipe", "tap", "drain", "drainage",
      "water tank", "leak", "flush", "water leak", "sintex", "pipe leakage", "pipe broken",
      "tap leaking", "tap repair", "bathroom leakage",
      // Telugu
      "ప్లంబర్", "నీళ్లు", "పైప్", "ట్యాప్", "లీకేజ్", "వాటర్ ట్యాంక్", "పైప్ పగిలింది",
      // Hindi
      "प्लंबर", "नल", "पाइप", "लीकेज", "पानी की टंकी", "टैंक सफाई", "नल टपक रहा", "पानी लीक", "प्लंबिंग",
      // Tamil
      "பிளம்பர்", "தண்ணீர்", "குழாய்", "கசிவு", "நீர் கசிவு", "குழாய் பழுது"
    ],
    responses: {
      english: "Sure. I'll show nearby plumbers.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న ప్లంబర్లను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी प्लंबर दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள பிளம்பர்களைக் காண்பிக்கிறேன்."
    }
  },
  "mechanic": {
    id: "mechanic",
    name: "Mechanic",
    displayTitle: "Two-Wheeler & Auto Mechanic",
    singular: "mechanic",
    icon: "🔧",
    count: 0,
    desc: "Bike repair, roadside puncture, carburettor tuning & oil service",
    keywords: [
      "mechanic", "bike repair", "car repair", "vehicle repair", "motorcycle", "scooter",
      "puncture", "engine", "bike service", "broke down", "breakdown", "bike", "auto mechanic",
      "two wheeler", "bike broke down", "tyre puncture", "bike not starting",
      // Telugu
      "మెకానిక్", "బైక్", "పంక్చర్", "మోటార్ సైకిల్", "వాహనం", "ఆటో", "బైక్ స్టార్ట్ అవ్వట్లేదు",
      // Hindi
      "मैकेनिक", "बाइक", "गाड़ी", "पंचर", "मोटरसाइकिल", "स्कूटर", "ब्रेकडाउन", "बाइक खराब", "गाड़ी रिपेयर",
      // Tamil
      "மெக்கானிக்", "பைக்", "பஞ்சர்", "வாகனம்", "இருசக்கர வாகனம்", "பைக் பழுது"
    ],
    responses: {
      english: "Sure. I'll show nearby mechanics.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న మెకానిక్ సేవలను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी मैकेनिक दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள மெக்கானிக் சேவைகளைக் காண்பிக்கிறேன்."
    }
  },
  "refrigerator": {
    id: "refrigerator",
    name: "Refrigerator Repair",
    displayTitle: "Refrigerator Technician",
    singular: "refrigerator technician",
    icon: "🧊",
    count: 0,
    desc: "Cooling coils, compressor check, gas top-up & defrost timers",
    keywords: [
      "refrigerator", "fridge", "freezer", "fridge repair", "not cooling", "defrost",
      "refrigerator repair", "cooling box", "ice box", "refrigerator not cooling", "fridge not cooling",
      // Telugu
      "ఫ్రిజ్", "రిఫ్రిజిరేటర్", "కూలింగ్ అవ్వట్లేదు", "ఫ్రిజ్ రిపేర్",
      // Hindi
      "फ्रिज", "रेफ्रिजरेटर", "कूलिंग नहीं हो रही", "फ्रिज रिपेयर", "फ्रीजर", "फ्रिज खराब",
      // Tamil
      "பிரிட்ஜ்", "குளிரூட்டி", "பிரிட்ஜ் பழுது", "குளிர்ச்சி இல்லை"
    ],
    responses: {
      english: "Sure. I'll show nearby refrigerator repair services.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న రిఫ్రిజిరేటర్ రిపేర్ నిపుణులను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी फ्रिज रिपेयर सेवाएँ दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள பிரிட்ஜ் பழுதுபார்க்கும் சேவைகளைக் காண்பிக்கிறேன்."
    }
  },
  "washing-machine": {
    id: "washing-machine",
    name: "Washing Machine Repair",
    displayTitle: "Washing Machine Specialist",
    singular: "washing machine technician",
    icon: "🧺",
    count: 0,
    desc: "Motor belt, drum vibration balancing, drain pump errors & PCB boards",
    keywords: [
      "washing machine", "washer", "dryer", "drum", "drain pump", "spin",
      "washing machine repair", "washing machine not spinning", "clothes washer",
      // Telugu
      "వాషింగ్ మెషిన్", "బట్టలు ఉతికే యంత్రం", "డ్రమ్", "వాషింగ్ మెషిన్ రిపేర్",
      // Hindi
      "वाशिंग मशीन", "कपड़े धोने की मशीन", "ड्रम", "वाशिंग मशीन रिपेयर", "वाशर",
      // Tamil
      "வாஷிங் மெஷின்", "துணி துவைக்கும் இயந்திரம்", "வாஷிங் மெஷின் பழுது"
    ],
    responses: {
      english: "Sure. I'll show nearby washing machine repair services.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న వాషింగ్ మెషిన్ రిపేర్ నిపుణులను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी वाशिंग मशीन रिपेयर सेवाएँ दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள வாஷிங் மெஷின் சேவைகளைக் காண்பிக்கிறேன்."
    }
  },
  "tv-repair": {
    id: "tv-repair",
    name: "TV Repair",
    displayTitle: "LED TV & Electronics Tech",
    singular: "TV technician",
    icon: "📺",
    count: 0,
    desc: "LED screen backlight, audio diagnosis, power board & wall mounting",
    keywords: [
      "tv", "television", "tv repair", "led tv", "lcd", "screen", "display",
      "smart tv", "motherboard", "sound problem", "backlight", "tv screen",
      // Telugu
      "టీవీ", "టెలివిజన్", "టీవీ రిపేర్", "టీవీ స్క్రీన్",
      // Hindi
      "टीवी", "टेलीविजन", "टीवी रिपेयर", "एलईडी टीवी", "स्मार्ट टीवी", "स्क्रीन खराब",
      // Tamil
      "டிவி", "தொலைக்காட்சி", "டிவி பழுது", "டிவி திரை"
    ],
    responses: {
      english: "Sure. I'll show nearby TV repair technicians.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న టీవీ టెక్నీషియన్లను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी टीवी टेक्नीशियन दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள டிவி பழுதுபார்க்கும் சேவைகளைக் காண்பிக்கிறேன்."
    }
  },
  "ro-water": {
    id: "ro-water",
    name: "RO / Water Purifier",
    displayTitle: "RO Water Purifier Specialist",
    singular: "RO technician",
    icon: "💧",
    count: 0,
    desc: "Filter replacement, membrane check, water flow & TDS testing",
    keywords: [
      "ro", "water purifier", "ro repair", "ro service", "filter replacement",
      "water filter", "purifier", "tds", "kent ro", "drinking water filter", "purifier repair",
      // Telugu
      "వాటర్ ప్యూరిఫైయర్", "ఆర్ ఓ", "ఫిల్టర్", "నీళ్ల ఫిల్టర్", "ఆర్ ఓ సర్వీస్",
      // Hindi
      "आरओ", "वाटर प्यूरीफायर", "फिल्टर", "पानी का फिल्टर", "आरओ सर्विस", "आरओ रिपेयर", "केंट आरओ",
      // Tamil
      "ஆர்ஓ", "தண்ணீர் சுத்திகரிப்பு", "குடிநீர் வடிகட்டி", "ஆர்ஓ பழுது"
    ],
    responses: {
      english: "Sure. I'll show nearby RO water purifier services.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న వాటర్ ప్యూరిఫైయర్ సేవలను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी आरओ वाटर प्यूरीफायर सेवाएँ दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள ஆர்ஓ தண்ணீர் சுத்திகரிப்பு சேவைகளைக் காண்பிக்கிறேன்."
    }
  },
  "painter": {
    id: "painter",
    name: "Painter",
    displayTitle: "Professional House Painter",
    singular: "painter",
    icon: "🎨",
    count: 0,
    desc: "Interior emulsion, exterior weather coats, terrace waterproofing",
    keywords: [
      "painter", "paint", "painting", "wall painting", "whitewash", "waterproofing",
      "paint my house", "house painting", "emulsion", "color paint", "home paint",
      // Telugu
      "పెయింటర్", "రంగులు", "సున్నం", "ఇంటి పెయింటింగ్",
      // Hindi
      "पेंटर", "पुताई", "पेंटिंग", "दीवार पेंटिंग", "सफेदी", "कलर", "घर की पुताई", "वाटरप्रूफिंग",
      // Tamil
      "பெயிண்டர்", "வண்ணம்", "வீட்டு பெயிண்டிங்"
    ],
    responses: {
      english: "I can help you find a house painter near you. Opening painter services.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న పెయింటర్లను చూపిస్తున్నాను.",
      hindi: "मैं आपके नज़दीकी पेंटर ढूँढने में मदद करूँगा। पेंटर सेवाएँ खोली जा रही हैं।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள பெயிண்டர்களைக் காண்பிக்கிறேன்."
    }
  },
  "carpenter": {
    id: "carpenter",
    name: "Carpenter",
    displayTitle: "Master Carpenter",
    singular: "carpenter",
    icon: "🪚",
    count: 0,
    desc: "Door planing, Godrej lock fitting, wardrobe repairs & wooden furniture",
    keywords: [
      "carpenter", "carpentry", "woodwork", "furniture", "door repair", "window",
      "lock", "godrej lock", "cupboard", "table", "chair repair", "wood",
      // Telugu
      "కార్పెంటర్", "వడ్రంగి", "చెక్క పని", "తలుపు రిపేర్",
      // Hindi
      "कारपेंटर", "बढ़ई", "फर्नीचर", "दरवाजा", "ताला", "अलमारी", "लकड़ी का काम",
      // Tamil
      "தச்சர்", "மரவேலை", "கதவு பழுது"
    ],
    responses: {
      english: "Sure. I'll show nearby carpenters.",
      telugu: "ఖచ్చితంగా. మీకు దగ్గరలో ఉన్న కార్పెంటర్లను చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं आपके नज़दीकी बढ़ई/कारपेंटर दिखाता हूँ।",
      tamil: "நிச்சயமாக. உங்களுக்கு அருகில் உள்ள தச்சர்களைக் காண்பிக்கிறேன்."
    }
  },
  "labourer": {
    id: "labourer",
    name: "Labourer",
    displayTitle: "Local Helper / Labourer",
    singular: "labourer",
    icon: "👷",
    count: 0,
    desc: "Heavy lifting, farm harvest help, house shifting & grain bag loading",
    keywords: [
      "labourer", "laborer", "labour", "labor", "helper", "heavy lifting", "shifting",
      "loading", "farm worker", "daily wage", "coolie", "unloading",
      // Telugu
      "కూలీ", "హెల్పర్", "బస్తాలు", "వ్యవసాయ కూలీ",
      // Hindi
      "मजदूर", "कुली", "लेबर", "सामान उठाना", "हेल्पर", "शिफ्टिंग", "बोरी उठाना", "दिहाड़ी",
      // Tamil
      "தொழிலாளி", "உதவியாளர்", "சுமை தூக்குபவர்"
    ],
    responses: {
      english: "Sure. I'll show available local helpers and labourers.",
      telugu: "ఖచ్చితంగా. మీకు అందుబాటులో ఉన్న కూలీల సమాచారం చూపిస్తున్నాను.",
      hindi: "ज़रूर, मैं उपलब्ध स्थानीय मजदूर और हेल्पर दिखाता हूँ।",
      tamil: "நிச்சயமாக. கிடைக்கக்கூடிய தொழிலாளர்களின் விவரங்களைக் காண்பிக்கிறேன்."
    }
  }
};

/**
 * Single Source of Truth: Identify Service Category from natural spoken or written text.
 * Normalized matching handles synonyms, natural sentences, and multilingual phrases.
 * If unmatched, returns matched: false with a clarification prompt — NEVER defaults to AC repair!
 */
function identifyCategory(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return getUnknownCategoryResult();
  }

  // Normalize query: lowercase, replace punctuation with spaces, trim
  const normalized = rawQuery.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return getUnknownCategoryResult();
  }

  let bestMatch = null;
  let longestMatchLength = 0;

  for (const [catId, catInfo] of Object.entries(FIXNOW_CATEGORY_MAP)) {
    for (const kw of catInfo.keywords) {
      const cleanKw = kw.toLowerCase().trim();
      // Match whole word or exact phrase boundary
      const regex = new RegExp("(?:^|\\s)" + cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "(?:$|\\s)", "i");
      if (regex.test(normalized)) {
        if (cleanKw.length > longestMatchLength) {
          longestMatchLength = cleanKw.length;
          bestMatch = {
            matched: true,
            categoryId: catId,
            categoryName: catInfo.name,
            displayTitle: catInfo.displayTitle,
            singular: catInfo.singular,
            responses: catInfo.responses
          };
        }
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  // Fallback if not recognized: NEVER DEFAULT TO AC REPAIR!
  return getUnknownCategoryResult();
}

function getUnknownCategoryResult() {
  return {
    matched: false,
    categoryId: null,
    categoryName: null,
    singular: null,
    responses: {
      english: "I didn't understand the service you need. Please say something like: 'I need a plumber', 'I need an electrician', 'I need a beautician', or 'I need AC repair'.",
      telugu: "మీకు ఏ సేవ కావాలో అర్థం కాలేదు. దయచేసి 'నాకు ప్లంబర్ కావాలి', 'ఎలక్ట్రీషియన్ కావాలి', 'బ్యూటీషియన్ కావాలి', లేదా 'ఏసీ రిపేర్ కావాలి' అని చెప్పండి.",
      hindi: "मुझे समझ नहीं आया कि आपको कौन सी सेवा चाहिए। कृपया कहें जैसे: 'मुझे प्लंबर चाहिए', 'इलेक्ट्रीशियन चाहिए', 'ब्यूटीशियन चाहिए' या 'एसी रिपेयर चाहिए'।",
      tamil: "உங்களுக்கு என்ன சேவை தேவை என்று புரியவில்லை. தயவுசெய்து 'பிளம்பர் வேண்டும்', 'எலக்ட்ரீஷியன் வேண்டும்', 'பியூட்டீசியன் வேண்டும்', அல்லது 'ஏசி பழுதுபார்க்க வேண்டும்' என்று சொல்லுங்கள்."
    }
  };
}

// === 2. SERVICE PROVIDERS DATA STORE ===
// Zero default providers. Only real user-registered providers from localStorage are displayed.
const FIXNOW_DEMO_PROVIDERS = [];

/**
 * Returns all active providers:
 * Returns authentic registered service providers saved in localStorage under 'fixnow_users' with role: 'provider'.
 * If no providers have registered yet, returns an empty array.
 */
function getEffectiveProviders() {
  const providers = [...FIXNOW_DEMO_PROVIDERS];
  try {
    const rawUsers = localStorage.getItem('fixnow_users');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const registeredPros = users.filter(u => u.role === 'provider');

      registeredPros.forEach((pro, idx) => {
        providers.push({
          id: pro.id || ('reg-' + idx),
          name: pro.fullName,
          serviceCategory: pro.serviceCategory || "other",
          category: pro.serviceCategory || "other",
          serviceTitle: pro.serviceTitle || (pro.serviceCategory ? pro.serviceCategory.replace('-', ' ').toUpperCase() + ' Specialist' : 'Service Specialist'),
          rating: pro.rating || 5.0,
          reviewCount: pro.reviewsCount || 0,
          reviewsCount: pro.reviewsCount || 0,
          distanceKm: 2.5,
          experience: pro.experienceYears || 5,
          experienceYears: pro.experienceYears || 5,
          availability: pro.availability === 'available' ? 'Available Today' : (pro.availability === 'busy' ? 'Busy on Site' : 'Unavailable'),
          verified: true,
          isDemo: false,
          isTestAccount: false,
          phone: pro.phoneNumber || pro.mobile || null,
          phoneNumber: pro.phoneNumber || pro.mobile || null,
          location: pro.serviceLocation || pro.address || "Local Area",
          locationName: pro.serviceLocation || pro.address || "Local Area",
          latitude: pro.latitude !== undefined ? pro.latitude : (17.4400 + (idx * 0.003)),
          longitude: pro.longitude !== undefined ? pro.longitude : (78.4980 + (idx * 0.003)),
          lat: pro.latitude !== undefined ? pro.latitude : (17.4400 + (idx * 0.003)),
          lng: pro.longitude !== undefined ? pro.longitude : (78.4980 + (idx * 0.003)),
          serviceRadius: pro.serviceRadius || 10,
          image: pro.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces",
          avatar: pro.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces",
          description: pro.shortDescription || "Registered local service professional.",
          about: pro.shortDescription || "Registered local service professional.",
          languages: ["Telugu", "English"],
          services: Array.isArray(pro.servicesOffered) ? pro.servicesOffered : [],
          pricing: Array.isArray(pro.pricing) ? pro.pricing : [],
          media: [],
          reviews: []
        });
      });
    }
  } catch (e) {
    console.warn("Could not read registered providers from localStorage:", e);
  }
  return providers;
}

// === 3. HOUSEHOLD DIGITAL TWIN DATA STORE ===
// Zero default appliances. Customers add their real home equipment dynamically to compute live predictive health scores.
const FIXNOW_HOUSEHOLD_DATA = {
  overallHealthScore: 0,
  lastAuditDate: null,
  appliances: []
};

// === 4. SERVICE SUB-SERVICES CATALOG ===
const FIXNOW_SUB_SERVICES = {
  "beautician": [
    "Hair Wash",
    "Herbal Glow Facial",
    "Haircut & Deep Conditioning",
    "Bridal Mehendi & Makeup",
    "Threading & Organic Waxing",
    "General Doorstep Salon"
  ],
  "ac-repair": [
    "Complete AC Foam Jet Cleaning",
    "Gas Leakage Check & Refill (R32 / R410)",
    "Compressor Capacitor Replacement",
    "Uninstallation & Re-installation",
    "General AC Inspection"
  ],
  "plumber": [
    "Tap Leakage Repair",
    "Pipe Blockage Clearing",
    "Booster Pump Repair",
    "Water Tank Cleaning",
    "Bathroom Sanitary Fitting"
  ],
  "electrician": [
    "Switchboard & MCB Repair",
    "Ceiling Fan Fitting",
    "Short Circuit Diagnosis",
    "Inverter Wiring & Battery Check",
    "Appliance Power Point Installation"
  ],
  "mechanic": [
    "Two-Wheeler General Service",
    "Brake Overhaul & Cable Replacement",
    "Carburetor / Injector Cleaning",
    "Chain Sprocket Lubrication",
    "Emergency Breakdown Assistance"
  ],
  "refrigerator": [
    "Cooling Issue & Gas Refill",
    "Compressor Check",
    "Thermostat Replacement",
    "Door Gasket Seal Replacement"
  ],
  "washing-machine": [
    "Drum Spin & Vibration Check",
    "Drain Pump Repair",
    "Motor Belt Replacement",
    "PCB Motherboard Service"
  ],
  "ro-water": [
    "Filter Cartridge Replacement",
    "RO Membrane Check & TDS Tuning",
    "Booster Pump Repair",
    "UV Lamp Replacement"
  ],
  "painter": [
    "Interior Wall Emulsion",
    "Exterior Weatherproofing Coat",
    "Terrace Waterproofing",
    "Wood & Metal Enamel Polish"
  ],
  "carpenter": [
    "Door Planing & Godrej Lock Fitting",
    "Modular Kitchen Hinge Repair",
    "Wardrobe & Cupboard Fitting",
    "Custom Furniture Repair"
  ],
  "labourer": [
    "House Shifting & Heavy Lifting",
    "Farm Harvest Helper",
    "Loading & Unloading Grain Bags",
    "Debris & Demolition Helper"
  ]
};

// === 5. GLOBAL OBJECT EXPORT ===
window.FixNowData = {
  categoryMap: FIXNOW_CATEGORY_MAP,
  categories: Object.values(FIXNOW_CATEGORY_MAP),
  subServices: FIXNOW_SUB_SERVICES,
  identifyCategory: identifyCategory,
  providers: FIXNOW_DEMO_PROVIDERS,
  getEffectiveProviders: getEffectiveProviders,
  household: FIXNOW_HOUSEHOLD_DATA
};
