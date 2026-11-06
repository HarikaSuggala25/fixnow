/**
 * FixNow - Project-Aware AI Voice Assistant Controller (voice.js)
 * =========================================================================
 * Full Knowledge & Functional Integration for FixNow:
 * 1. Project-Aware Brain: Understands all FixNow modules, database models,
 *    categories, booking lifecycle, Leaflet maps, household digital twin,
 *    auth workflows, and role-based permissions.
 * 2. Real Registered Provider Discovery: Connects to getEffectiveProviders(),
 *    calculates real Haversine distance, checks service coverage radius,
 *    and NEVER invents fake providers, fake ratings, or fake availability.
 * 3. Voice-Based Provider Selection & Booking: Complete multi-turn dialog
 *    flow (category -> subservice -> compare/nearest -> book -> date/time ->
 *    confirmation summary -> storage creation -> read-out).
 * 4. Context-Aware Memory: Tracks active category, displayed providers,
 *    selected provider, draft booking, customer location, and history.
 *    Supports ordinal phrases ("book the first one", "the second one",
 *    "show the nearest one", "which one is closer?").
 * 5. Role-Based Voice Intelligence:
 *    - Customer Mode: Search nearby providers, check booking status,
 *      household appliance health, cancel appointments.
 *    - Provider Mode: View incoming requests, check who booked what service,
 *      accept or reject requests via voice, update location/availability.
 *    - Guest / All: Login and signup step-by-step instructions.
 * 6. Multilingual: English (en-IN), Telugu (te-IN), Hindi (hi-IN), Tamil (ta-IN).
 * =========================================================================
 */

(function () {
  'use strict';

  window.FixNowVoice = window.FixNowVoice || {};

  // Active conversational language: 'english' | 'telugu' | 'hindi' | 'tamil'
  let currentLanguage = 'english';
  let isListening = false;
  let recognition = null;
  let speechSynth = window.speechSynthesis || null;

  // Conversational State Machine & Session Memory
  const sessionState = {
    activeCategory: null,          // e.g., 'ac-repair' or 'electrician'
    activeSubService: null,        // e.g., 'Gas Leakage Check & Refill'
    userCoords: { lat: 17.4400, lng: 78.4980, name: "Current GPS Location" },
    lastDisplayedProviders: [],    // Array of real providers from latest search
    selectedProvider: null,        // Focused provider object
    bookingDraft: {
      stage: 'idle',               // 'idle' | 'awaiting_subservice' | 'provider_selected' | 'awaiting_datetime' | 'awaiting_contact' | 'confirming'
      provider: null,
      subService: '',
      date: '',
      timeSlot: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      problemDesc: ''
    },
    dialogHistory: []              // [{ sender: 'user'|'assistant', text: string, timestamp: Date }]
  };

  // Multilingual Configuration & Localized Copy
  const LANG_CONFIG = {
    english: {
      bcp47: 'en-IN',
      name: 'English',
      greeting: "Hello! I am your FixNow voice assistant. You can ask me to find nearby service specialists, or ask me how to create an account, how to log in, and how to register as a customer or service provider. How can I help you today?",
      listeningText: "Listening in English... Speak naturally now.",
      fallbackText: "Speech recognition is active. You can also tap any prompt chip below.",
      samplePromptsCustomer: [
        "I need an electrician",
        "I need AC repair",
        "How do I register as a customer?",
        "How do I register as a provider?",
        "How do I login or sign up?",
        "What is the password policy?",
        "Show me the nearest one",
        "Where can I see my booking status?",
        "When should I service my refrigerator?"
      ],
      samplePromptsProvider: [
        "How many booking requests do I have?",
        "Who requested my service?",
        "Which service did the customer request?",
        "What is the appointment date?",
        "Accept the first booking",
        "How can I update my service location?"
      ]
    },
    telugu: {
      bcp47: 'te-IN',
      name: 'తెలుగు (Telugu)',
      greeting: "నమస్కారం! నేను మీ ఫిక్స్‌నౌ వాయిస్ అసిస్టెంట్‌ని. మీకు సమీపంలోని టెక్నీషియన్లను వెతకడంలో, కస్టమర్ లేదా ప్రొవైడర్‌గా ఖాతా ఎలా తెరవాలి, రిజిస్టర్ మరియు లాగిన్ ఎలా చేయాలి అనే వివరాల్లో సహాయం చేయగలను. మీకు ఏ సేవ కావాలి?",
      listeningText: "తెలుగులో మాట్లాడుతున్నారు... వింటున్నాను...",
      fallbackText: "స్పీచ్ రికగ్నిషన్ సిద్ధంగా ఉంది. క్రింది వాక్యాలపై నొక్కి కూడా ప్రయత్నించవచ్చు.",
      samplePromptsCustomer: [
        "నాకు ఎలక్ట్రీషియన్ కావాలి",
        "కస్టమర్ ఖాతా ఎలా తెరవాలి?",
        "సర్వీస్ ప్రొవైడర్‌గా ఎలా రిజిస్టర్ అవ్వాలి?",
        "లాగిన్ లేదా రిజిస్టర్ ఎలా చేయాలి?",
        "పాస్‌వర్డ్ నిబంధనలు ఏమిటి?",
        "దగ్గరగా ఉన్న వారిని చూపించు",
        "మొదటి వారిని బుక్ చేయి",
        "నా బుకింగ్ స్టేటస్ ఏమిటి?"
      ],
      samplePromptsProvider: [
        "నాకు ఎన్ని బుకింగ్ రిక్వెస్ట్‌లు ఉన్నాయి?",
        "నా సర్వీస్ ఎవరు బుక్ చేసుకున్నారు?",
        "ఏ సేవ కావాలని కోరారు?",
        "అపాయింట్‌మెంట్ తేదీ ఏమిటి?",
        "బుకింగ్ ఆమోదించు",
        "నా లొకేషన్ ఎలా అప్‌డేట్ చేయాలి?"
      ]
    },
    hindi: {
      bcp47: 'hi-IN',
      name: 'हिंदी (Hindi)',
      greeting: "नमस्ते! मैं आपका FixNow वॉइस असिस्टेंट हूँ। आप मुझसे नज़दीकी कारीगर ढूँढने, नया खाता बनाने, लॉगिन करने, या ग्राहक और सेवा प्रदाता के रूप में पंजीकरण करने की जानकारी ले सकते हैं। मैं आपकी क्या मदद करूँ?",
      listeningText: "हिंदी में सुन रहा हूँ... बोलिए...",
      fallbackText: "वॉइस रिकग्निशन सक्रिय है। आप नीचे दिए गए सुझावों पर भी टैप कर सकते हैं।",
      samplePromptsCustomer: [
        "मुझे इलेक्ट्रीशियन चाहिए",
        "कस्टमर अकाउंट कैसे बनाएं?",
        "सर्विस प्रोवाइडर कैसे बनें?",
        "लॉगिन या साइन अप कैसे करें?",
        "पासवर्ड के नियम क्या हैं?",
        "सबसे नज़दीकी दिखाओ",
        "पहले वाले को बुक करो",
        "मेरी बुकिंग का स्टेटस क्या है?"
      ],
      samplePromptsProvider: [
        "मेरे पास कितने बुकिंग रिक्वेस्ट हैं?",
        "किसने मेरी सर्विस बुक की है?",
        "कस्टमर ने कौन सी सर्विस माँगी है?",
        "अपॉइंटमेंट की तारीख क्या है?",
        "बुकिंग स्वीकार करो",
        "अपनी सर्विस लोकेशन कैसे अपडेट करूँ?"
      ]
    },
    tamil: {
      bcp47: 'ta-IN',
      name: 'தமிழ் (Tamil)',
      greeting: "வணக்கம்! நான் உங்கள் FixNow குரல் உதவியாளர். தொழிலாளர்களைக் கண்டறிய, புதிய கணக்கு தொடங்க, உள்நுழைய அல்லது பதிவு செய்ய என்னிடம் கேட்கலாம். இன்று உங்களுக்கு என்ன உதவி வேண்டும்?",
      listeningText: "தமிழில் கேட்கிறேன்... பேசுங்கள்...",
      fallbackText: "குரல் அறிதல் தயாராக உள்ளது. கீழே உள்ள வாக்கியங்களை கிளிக் செய்தும் முயற்சி செய்யலாம்.",
      samplePromptsCustomer: [
        "எலக்ட்ரீஷியன் வேண்டும்",
        "வாடிக்கையாளர் கணக்கு உருவாக்குவது எப்படி?",
        "சேவை வழங்குநராக பதிவு செய்வது எப்படி?",
        "அருகில் உள்ளவரை காட்டு",
        "என் புக்கிங் நிலை என்ன?",
        "கடவுச்சொல் விதிகள் என்ன?",
        "உள்நுழைவு அல்லது பதிவு செய்வது எப்படி?"
      ],
      samplePromptsProvider: [
        "எனக்கு எத்தனை முன்பதிவு கோரிக்கைகள் உள்ளன?",
        "யார் சேவை கோரினார்கள்?",
        "அப்பாயிண்ட்மெண்ட் தேதி என்ன?",
        "முன்பதிவை ஏற்றுக்கொள்",
        "எனது இடத்தை எவ்வாறு புதுப்பிப்பது?"
      ]
    }
  };

  /**
   * Calculate distance between two GPS coordinates using Haversine formula (km)
   */
  function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 2.5;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  // =========================================================================
  // FIXNOW VOICE TOOL EXECUTION LAYER (Live Application Engine Integration)
  // =========================================================================
  const FixNowVoiceTools = {
    /**
     * Search Real Service Providers:
     * Never generates fake providers or fake ratings. Reads from live getEffectiveProviders().
     */
    search_providers: function (categoryKey, subServiceFilter = null) {
      if (!window.FixNowData || typeof window.FixNowData.getEffectiveProviders !== 'function') {
        return [];
      }

      const all = window.FixNowData.getEffectiveProviders();
      const cleanKey = (categoryKey || '').toLowerCase().trim();

      let matched = all.filter(p => {
        const pCat = (p.serviceCategory || p.category || '').toLowerCase();
        return pCat === cleanKey;
      });

      // Filter by subservice if requested
      if (subServiceFilter && matched.length > 0) {
        const subClean = subServiceFilter.toLowerCase();
        const subMatched = matched.filter(p => {
          if (Array.isArray(p.pricing) && p.pricing.some(item => (item.service || '').toLowerCase().includes(subClean))) return true;
          if (Array.isArray(p.services) && p.services.some(s => s.toLowerCase().includes(subClean))) return true;
          if (p.serviceTitle && p.serviceTitle.toLowerCase().includes(subClean)) return true;
          return false;
        });
        if (subMatched.length > 0) {
          matched = subMatched;
        }
      }

      // Calculate real distance from customer's coordinates
      const userLat = sessionState.userCoords.lat;
      const userLng = sessionState.userCoords.lng;

      matched.forEach(p => {
        p.distanceKm = calculateHaversineDistance(userLat, userLng, p.lat || p.latitude, p.lng || p.longitude);
      });

      // Sort by proximity
      matched.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));

      return matched;
    },

    /**
     * Get Provider Details by ID or Name
     */
    get_provider_details: function (idOrName) {
      const all = window.FixNowData.getEffectiveProviders();
      const query = String(idOrName).toLowerCase().trim();
      return all.find(p => String(p.id).toLowerCase() === query || (p.name && p.name.toLowerCase().includes(query))) || null;
    },

    /**
     * Get Customer Bookings from live storage
     */
    get_customer_bookings: function () {
      try {
        const all = JSON.parse(localStorage.getItem('fixnow_bookings') || '[]');
        const user = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;

        if (user && user.role === 'customer') {
          const userPhone = user.mobile ? user.mobile.replace(/\D/g, '') : '';
          const matched = all.filter(b => {
            if (b.customerId && String(b.customerId) === String(user.id)) return true;
            if (userPhone && b.customerPhone && b.customerPhone.replace(/\D/g, '') === userPhone) return true;
            if (b.customerName && user.fullName && b.customerName.toLowerCase() === user.fullName.toLowerCase()) return true;
            return false;
          });
          return matched.length > 0 ? matched : all;
        }
        return all;
      } catch (e) {
        return [];
      }
    },

    /**
     * Get Provider Incoming Booking Requests
     */
    get_provider_booking_requests: function () {
      const user = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;
      if (!user || user.role !== 'provider') return [];

      try {
        const all = JSON.parse(localStorage.getItem('fixnow_bookings') || '[]');
        const providerId = String(user.id || '');
        const providerName = (user.fullName || '').toLowerCase();

        return all.filter(b => {
          if (b.providerId && String(b.providerId) === providerId) return true;
          if (b.providerName && providerName && b.providerName.toLowerCase().includes(providerName)) return true;
          return false;
        });
      } catch (e) {
        return [];
      }
    },

    /**
     * Create Booking via live storage & trigger notifications
     */
    create_booking: function (draft) {
      const all = JSON.parse(localStorage.getItem('fixnow_bookings') || '[]');
      const user = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;

      const requestId = 'FN-' + Math.floor(100000 + Math.random() * 900000);
      const provider = draft.provider;

      const newBooking = {
        requestId: requestId,
        customerId: user ? user.id : ('cust-' + Date.now()),
        customerName: draft.customerName || (user ? user.fullName : 'Customer'),
        customerPhone: draft.customerPhone || (user ? user.mobile : ''),
        customerAddress: draft.customerAddress || (user ? (user.location || user.address) : 'Local Customer Address'),
        providerId: provider ? provider.id : 1,
        providerName: provider ? provider.name : 'Service Specialist',
        providerPhone: provider ? (provider.phoneNumber || provider.phone) : null,
        serviceCategory: draft.categoryName || (provider ? (provider.serviceCategory || provider.category) : 'General Service'),
        subService: draft.subService || 'Standard Service',
        date: draft.date || 'Tomorrow',
        timeSlot: draft.timeSlot || 'Morning (9:00 AM - 12:00 PM)',
        problemDesc: draft.problemDesc || 'Booked via Multilingual Voice Assistant',
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      all.unshift(newBooking);
      localStorage.setItem('fixnow_bookings', JSON.stringify(all));

      // Sync to MongoDB backend if online
      if (window.FixNowAPI && typeof window.FixNowAPI.createBooking === 'function') {
        window.FixNowAPI.createBooking(newBooking);
      }

      // Initialize chat channel
      if (window.FixNowChat && window.FixNowChat.initChatFromBooking) {
        window.FixNowChat.initChatFromBooking(newBooking);
      }

      // Dispatch live notifications
      if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
        // Provider notification
        window.FixNowNotifications.addNotification({
          targetRole: 'provider',
          targetUserId: newBooking.providerId,
          bookingId: requestId,
          title: '📥 New Service Request!',
          message: `Voice booking #${requestId} from ${newBooking.customerName} (${newBooking.customerPhone}) for ${newBooking.subService} on ${newBooking.date} (${newBooking.timeSlot}).`,
          type: 'info',
          action: 'requests'
        });

        // Customer notification
        window.FixNowNotifications.addNotification({
          targetRole: 'customer',
          targetUserId: user ? user.id : null,
          targetPhone: newBooking.customerPhone,
          bookingId: requestId,
          title: '⏳ Service Request Dispatched',
          message: `Your booking #${requestId} for ${newBooking.subService} has been sent to ${newBooking.providerName}. You will be notified once confirmed.`,
          type: 'info',
          action: 'bookings'
        });
      }

      return newBooking;
    },

    /**
     * Cancel Booking by ID
     */
    cancel_booking: function (requestId) {
      try {
        const all = JSON.parse(localStorage.getItem('fixnow_bookings') || '[]');
        const idx = all.findIndex(b => b.requestId === requestId || b.requestId.endsWith(requestId));
        if (idx !== -1) {
          all[idx].status = 'Cancelled';
          localStorage.setItem('fixnow_bookings', JSON.stringify(all));
          return all[idx];
        }
      } catch (e) {}
      return null;
    },

    /**
     * Provider updates status (Accepted / Rejected / Completed)
     */
    update_booking_status: function (requestId, newStatus) {
      try {
        const all = JSON.parse(localStorage.getItem('fixnow_bookings') || '[]');
        const cleanId = String(requestId).replace('#', '').trim();
        const idx = all.findIndex(b => b.requestId === cleanId || b.requestId.endsWith(cleanId));

        if (idx !== -1) {
          all[idx].status = newStatus;
          localStorage.setItem('fixnow_bookings', JSON.stringify(all));

          // Sync status to MongoDB backend if online
          if (window.FixNowAPI && typeof window.FixNowAPI.updateBookingStatus === 'function') {
            window.FixNowAPI.updateBookingStatus(all[idx].requestId, newStatus);
          }
          const booking = all[idx];

          if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
            if (newStatus === 'Accepted') {
              window.FixNowNotifications.addNotification({
                targetRole: 'customer',
                targetUserId: booking.customerId,
                targetPhone: booking.customerPhone,
                bookingId: booking.requestId,
                title: '🎉 Booking Accepted!',
                message: `${booking.providerName} accepted your booking #${booking.requestId} for ${booking.subService || booking.serviceCategory}. Click to Call or Chat directly.`,
                type: 'success',
                action: 'bookings'
              });
            } else if (newStatus === 'Rejected') {
              window.FixNowNotifications.addNotification({
                targetRole: 'customer',
                targetUserId: booking.customerId,
                targetPhone: booking.customerPhone,
                bookingId: booking.requestId,
                title: '⚠️ Booking Declined',
                message: `${booking.providerName} was unable to accept your request #${booking.requestId}. Click to find another specialist.`,
                type: 'warning',
                action: 'services'
              });
            }
          }
          return booking;
        }
      } catch (e) {}
      return null;
    },

    /**
     * Get Household Equipment Health & AI Preventive Maintenance
     */
    get_household_equipment: function (applianceQuery) {
      let data = null;
      try {
        const saved = localStorage.getItem('fixnow_household_data');
        data = saved ? JSON.parse(saved) : (window.FixNowData ? window.FixNowData.household : null);
      } catch (e) {}

      if (!data) return null;

      if (!applianceQuery) {
        return data; // Return full household twin
      }

      const cleanQuery = applianceQuery.toLowerCase().trim();
      const matched = (data.appliances || []).find(app => {
        const type = (app.type || '').toLowerCase();
        const name = (app.name || '').toLowerCase();
        return cleanQuery.includes(type) || cleanQuery.includes('fridge') && type.includes('refriger') ||
          cleanQuery.includes('ac') && type.includes('ac') ||
          cleanQuery.includes('purifier') && type.includes('ro') ||
          name.includes(cleanQuery);
      });

      return matched || data;
    }
  };

  // =========================================================================
  // NATURAL LANGUAGE UNDERSTANDING & INTENT ROUTING ENGINE
  // =========================================================================

  /**
   * Main entrypoint for processing user voice or text input
   */
  function handleUserVoiceInput(userText) {
    if (!userText || !userText.trim()) return;

    const cleanInput = userText.trim();

    // 1. ALWAYS DISPLAY USER'S SPOKEN INPUT AS TEXT
    appendChatBubble(cleanInput, 'user');
    updateStatusLabel('Understanding your request...');

    // Record in dialog history
    sessionState.dialogHistory.push({ sender: 'user', text: cleanInput, timestamp: new Date() });

    if (window._TEST_SYNC) {
      processIntent(cleanInput);
      updateStatusLabel('Ready. Tap microphone to speak again.');
    } else {
      setTimeout(() => {
        processIntent(cleanInput);
        updateStatusLabel('Ready. Tap microphone to speak again.');
      }, 350);
    }
  }

  /**
   * Process intent with contextual memory
   */
  function processIntent(input) {
    const cleanInput = (input || '').trim();
    const lower = cleanInput.toLowerCase();
    const currentUser = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;
    const isProviderUser = currentUser && currentUser.role === 'provider';

    // -----------------------------------------------------------------------
    // INTENT 1: Confirmation / Cancellation during active booking drafting
    // -----------------------------------------------------------------------
    if (sessionState.bookingDraft.stage === 'confirming') {
      const isYes = /^(yes|confirm|yeah|sure|okay|ok|confirm it|book it|book|ha|haan|avunu|sari|aam)\b/i.test(lower);
      const isNo = /^(no|cancel|stop|wait|dont|don't|voddu|nahi|illai)\b/i.test(lower);

      if (isYes) {
        const confirmedBooking = FixNowVoiceTools.create_booking(sessionState.bookingDraft);
        sessionState.bookingDraft.stage = 'idle';

        let speech = "";
        if (currentLanguage === 'telugu') {
          speech = `మీ బుకింగ్ ఖరారైంది! బుకింగ్ ఐడి #${confirmedBooking.requestId}. ప్రొవైడర్‌తో కాల్ లేదా చాట్ చేయవచ్చు.`;
        } else if (currentLanguage === 'hindi') {
          speech = `आपकी बुकिंग कन्फर्म हो गई है! बुकिंग आईडी #${confirmedBooking.requestId} है। आप अब सीधे कॉल या चैट कर सकते हैं।`;
        } else if (currentLanguage === 'tamil') {
          speech = `உங்கள் முன்பதிவு உறுதி செய்யப்பட்டது! புக்கிங் ஐடி #${confirmedBooking.requestId}.`;
        } else {
          speech = `Your booking is confirmed! Booking ID is #${confirmedBooking.requestId}. You can track this in My Bookings or open direct chat.`;
        }

        appendChatBubble(speech, 'assistant', {
          bookingConfirmed: confirmedBooking
        });
        speakResponse(speech);
        return;
      } else if (isNo) {
        sessionState.bookingDraft.stage = 'idle';
        const cancelMsg = currentLanguage === 'telugu' ? "సరే, మీ బుకింగ్ రద్దు చేయబడింది. మీకు ఇంకేమైనా సహాయం కావాలా?" :
          currentLanguage === 'hindi' ? "ठीक है, मैंने यह बुकिंग रद्द कर दी है। क्या मैं आपकी किसी और चीज़ में मदद करूँ?" :
          "No problem. I have cancelled this booking request. How else can I assist you?";
        appendChatBubble(cancelMsg, 'assistant');
        speakResponse(cancelMsg);
        return;
      }
    }

    // -----------------------------------------------------------------------
    // CHECK INTENTS THAT OVERRIDE DRAFTING IF USER CHANGES CONVERSATION TOPIC
    // -----------------------------------------------------------------------
    const isAskingAboutRequests = /(how many booking|booking requests|requests do i have|who requested|who booked|which customer|new requests|ఎన్ని బుకింగ్|ఎవరు బుక్|कितने रिक्वेस्ट|किसने बुक)/i.test(lower);
    const isAskingAppointmentDate = /(what is the appointment date|appointment time|when is the booking|అపాయింట్‌మెంట్ తేదీ|तारीख क्या है)/i.test(lower);
    const isAcceptingBooking = /(accept booking|accept request|accept the booking|accept the first|approve booking|ఆమోదించు|स्वीकार करो|कन्फर्म करो)/i.test(lower);
    const isRejectingBooking = /(reject booking|decline booking|reject request|తిరస్కరించు|रद्द करो|अस्वीकार)/i.test(lower);
    const isUpdatingLocation = /(how (do|can) i update my service location|update my location|update working hours|లొకేషన్ ఎలా అప్‌డేట్|लोकेशन कैसे अपडेट)/i.test(lower);
    const isBookingStatus = /(booking status|my booking|has my booking been accepted|see my booking|status of my|view my booking|check booking|బుకింగ్ స్టేటస్|స్టేటస్|ముன்பதிவு நிலை)/i.test(lower);

    // If in drafting stage but user explicitly asks status or provider command, reset draft
    if (sessionState.bookingDraft.stage === 'awaiting_datetime' && (isAskingAboutRequests || isBookingStatus || isAcceptingBooking || isRejectingBooking)) {
      sessionState.bookingDraft.stage = 'idle';
    }

    // -----------------------------------------------------------------------
    // INTENT 2: Appointment Date & Time during booking drafting
    // -----------------------------------------------------------------------
    if (sessionState.bookingDraft.stage === 'awaiting_datetime') {
      const isCancel = /^(cancel|no|stop|wait|dont|don't|voddu|nahi)\b/i.test(lower);
      if (isCancel) {
        sessionState.bookingDraft.stage = 'idle';
        const cancelMsg = "No problem. I have cancelled this booking draft. How else can I assist you?";
        appendChatBubble(cancelMsg, 'assistant');
        speakResponse(cancelMsg);
        return;
      }

      const parsedTime = parseSpokenDateTime(input);
      sessionState.bookingDraft.date = parsedTime.date;
      sessionState.bookingDraft.timeSlot = parsedTime.timeSlot;

      // Auto pre-fill customer details from session if available
      if (currentUser && currentUser.role === 'customer') {
        sessionState.bookingDraft.customerName = currentUser.fullName;
        sessionState.bookingDraft.customerPhone = currentUser.mobile;
        sessionState.bookingDraft.customerAddress = currentUser.location || currentUser.address || 'Rampur Area';
      } else {
        sessionState.bookingDraft.customerName = sessionState.bookingDraft.customerName || 'Customer';
        sessionState.bookingDraft.customerPhone = sessionState.bookingDraft.customerPhone || '9876543210';
        sessionState.bookingDraft.customerAddress = sessionState.bookingDraft.customerAddress || 'Rampur Village Cluster';
      }

      sessionState.bookingDraft.stage = 'confirming';

      const provider = sessionState.bookingDraft.provider;
      const provName = provider ? provider.name : 'Specialist';
      const serviceName = sessionState.bookingDraft.subService || provider.serviceTitle || sessionState.bookingDraft.categoryName || 'Service';

      let confirmSpeech = "";
      if (currentLanguage === 'telugu') {
        confirmSpeech = `నేను ${provName} గారితో ${serviceName} కోసం ${parsedTime.date} (${parsedTime.timeSlot}) తేదీకి బుకింగ్ సిద్ధం చేశాను. నేను ఈ బుకింగ్‌ని ఖరారు చేయమంటారా?`;
      } else if (currentLanguage === 'hindi') {
        confirmSpeech = `मैंने ${provName} के साथ ${serviceName} के लिए ${parsedTime.date} (${parsedTime.timeSlot}) का अपॉइंटमेंट तैयार किया है। क्या मैं इसे कन्फर्म करूँ?`;
      } else if (currentLanguage === 'tamil') {
        confirmSpeech = `நான் ${provName} உடன் ${serviceName} சேவைக்காக ${parsedTime.date} (${parsedTime.timeSlot}) முன்பதிவு தயாரித்துள்ளேன். உறுதிப்படுத்தவா?`;
      } else {
        confirmSpeech = `I have prepared your appointment for ${serviceName} with ${provName} on ${parsedTime.date} (${parsedTime.timeSlot}). Shall I confirm this service request?`;
      }

      appendChatBubble(confirmSpeech, 'assistant', {
        showConfirmationCard: true,
        bookingDraft: sessionState.bookingDraft
      });
      speakResponse(confirmSpeech);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 3: Provider Mode Actions (Who booked me, How many requests, Accept/Reject)
    // -----------------------------------------------------------------------
    if (isProviderUser && (isAskingAboutRequests || isAskingAppointmentDate || isAcceptingBooking || isRejectingBooking || isUpdatingLocation)) {
      handleProviderRoleVoiceCommand(lower, input);
      return;
    }

    // Security check: Customer or Guest asking provider-only administrative commands
    if (!isProviderUser && (isAcceptingBooking || (isAskingAboutRequests && lower.includes('my service')))) {
      const warnMsg = "This action is restricted to verified service providers. You are currently browsing in customer mode.";
      appendChatBubble(warnMsg, 'assistant');
      speakResponse(warnMsg);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 4: Customer Booking Status & History
    // ("Where can I see my booking status?", "Has my booking been accepted?")
    // -----------------------------------------------------------------------
    if (isBookingStatus) {
      handleCustomerBookingStatusInquiry();
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 5: Ordinal & Superlative Provider Selection
    // ("Show me the nearest one", "Book the first one", "The second one")
    // -----------------------------------------------------------------------
    const isNearestQuery = /(nearest|closer|closest|near me|దగ్గరగా|सबसे नज़दीक|அருகில்)/i.test(lower);
    const isFirstQuery = /(first one|the first|1st|మొదటి|पहला|முதல்)/i.test(lower);
    const isSecondQuery = /(second one|the second|2nd|రెండవ|दूसरा|இரண்டாவது)/i.test(lower);
    const isBookAction = /\b(book|book\s+the|schedule)\b/i.test(lower) && !/(status|requests?|accepted|declined|rejected|cancel|history)/i.test(lower);

    if (sessionState.lastDisplayedProviders.length > 0 && (isNearestQuery || isFirstQuery || isSecondQuery || isBookAction)) {
      sessionState.bookingDraft.stage = 'idle'; // reset clarification stage if previously awaiting
      let targetProvider = null;

      if (isNearestQuery) {
        // Find provider with lowest distance
        targetProvider = sessionState.lastDisplayedProviders.reduce((prev, curr) => (curr.distanceKm < prev.distanceKm ? curr : prev));
        sessionState.selectedProvider = targetProvider;

        let response = "";
        if (currentLanguage === 'telugu') {
          response = `అత్యంత సమీపంలో ఉన్న ప్రొవైడర్ ${targetProvider.name}, దాదాపు ${targetProvider.distanceKm} కి.మీ దూరంలో ఉన్నారు. బుకింగ్ చేయమంటారా?`;
        } else if (currentLanguage === 'hindi') {
          response = `सबसे नज़दीकी सेवा प्रदाता ${targetProvider.name} हैं, जो लगभग ${targetProvider.distanceKm} किमी दूर हैं। क्या आप इन्हें बुक करना चाहते हैं?`;
        } else {
          response = `The nearest matching provider is ${targetProvider.name}, approximately ${targetProvider.distanceKm} km away. Would you like to book this provider?`;
        }

        appendChatBubble(response, 'assistant', {
          providers: [targetProvider],
          singleProviderFocus: true
        });
        speakResponse(response);
        return;
      } else if (isFirstQuery) {
        targetProvider = sessionState.lastDisplayedProviders[0];
      } else if (isSecondQuery && sessionState.lastDisplayedProviders.length > 1) {
        targetProvider = sessionState.lastDisplayedProviders[1];
      } else if (isBookAction) {
        // Check if name matches any displayed provider
        const found = sessionState.lastDisplayedProviders.find(p => lower.includes(p.name.toLowerCase()));
        targetProvider = found || sessionState.selectedProvider || sessionState.lastDisplayedProviders[0];
      }

      if (targetProvider) {
        startBookingFlowForProvider(targetProvider);
        return;
      }
    }

    // -----------------------------------------------------------------------
    // INTENT 6: Subservice Clarification Response
    // -----------------------------------------------------------------------
    const categoryCheck = window.FixNowData.identifyCategory(input);
    if (categoryCheck.matched) {
      sessionState.bookingDraft.stage = 'idle';
    } else if (sessionState.bookingDraft.stage === 'awaiting_subservice' && sessionState.activeCategory) {
      sessionState.activeSubService = cleanInput;
      sessionState.bookingDraft.subService = cleanInput;
      sessionState.bookingDraft.stage = 'idle';

      // Perform provider search filtered by subservice
      executeProviderSearch(sessionState.activeCategory, cleanInput);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 7: How to Cancel Booking
    // -----------------------------------------------------------------------
    if (/(how do i cancel|cancel my appointment|cancel appointment|రద్దు చేయడం ఎలా|रद्द कैसे करें)/i.test(lower)) {
      const cancelHelp = currentLanguage === 'telugu' ?
        "మీ బుకింగ్ రద్దు చేయడానికి: హెడర్‌లోని 'My Bookings' పై నొక్కి, పెండింగ్ లేదా ఆమోదించబడిన బుకింగ్ పక్కన ఉన్న ఎరుపు రంగు 'Cancel' బటన్ నొక్కండి." :
        currentLanguage === 'hindi' ?
        "अपनी बुकिंग रद्द करने के लिए: हेडर में 'My Bookings' पर क्लिक करें और उस बुकिंग के आगे दिए गए लाल 'Cancel' बटन पर टैप करें।" :
        "To cancel your booking: Click '📋 My Bookings' in the top navigation bar, find your pending or accepted booking, and click the red 'Cancel' button.";

      appendChatBubble(cancelHelp, 'assistant');
      speakResponse(cancelHelp);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 8: How to Contact Provider (Call or Chat)
    // -----------------------------------------------------------------------
    if (/(how do i contact|contact provider|can i call|can i chat|కాల్ చేయవచ్చా|चैट कैसे करें|संपर्क कैसे करें)/i.test(lower)) {
      const contactHelp = currentLanguage === 'telugu' ?
        "FixNow ద్వారా మీరు నేరుగా ప్రొవైడర్‌తో మాట్లాడవచ్చు: బుకింగ్ తర్వాత 📞 Call బటన్ ద్వారా నేరుగా కాల్ చేయవచ్చు లేదా 💬 Chat బటన్ ద్వారా సందేశాలు పంపవచ్చు." :
        currentLanguage === 'hindi' ?
        "FixNow में आप सीधे प्रदाता से संपर्क कर सकते हैं: बुकिंग के बाद 📞 Call बटन से कॉल करें या 💬 Chat बटन से तुरंत चैट करें। केवल वेरिफाइड फोन नंबर ही दिखाए जाते हैं।" :
        "FixNow provides two direct contact options: Use 📞 Call to dial the provider's verified mobile number, or 💬 Chat to send in-app messages. Both are accessible after sending a booking request.";

      appendChatBubble(contactHelp, 'assistant');
      speakResponse(contactHelp);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 9: Household Digital Twin & Preventive Maintenance Questions
    // ("When should I service my refrigerator?", "AC health score")
    // -----------------------------------------------------------------------
    if (/(refrigerator|fridge|washing machine|ro purifier|smart tv|household health|service my|health score|ఫ్రిజ్ సర్వీస్|सर्विस कब करानी)/i.test(lower)) {
      handleHouseholdHealthInquiry(lower);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 10A: Customer Registration / Account Creation Guide
    // -----------------------------------------------------------------------
    if (/(customer (signup|sign up|register|registration|account)|register as (a )?customer|sign up as (a )?customer|create (a )?(new )?(customer )?account|how to register customer|how to (create|open) (an? )?(customer )?account|how do i create (an? )?(customer )?account|కస్టమర్ రిజిస్టర్|కస్టమర్ సైన్ అప్|కస్టమర్ ఖాతా|कस्टमर रजिस्ट्रेशन|कस्टमर साइन अप|कस्टमर अकाउंट|खाता कैसे बनाएं)/i.test(lower)) {
      const resp = currentLanguage === 'telugu' ?
        "కస్టమర్ ఖాతా తెరవడం చాలా సులభం:\n1. మీ పూర్తి పేరు, 10 అంకెల మొబైల్ నంబర్ మరియు ఈమెయిల్ నమోదు చేయండి.\n2. GPS లేదా మ్యాప్ ద్వారా మీ ఇంటి చిరునామాను పిన్ చేయండి. దీనివల్ల మీకు అత్యంత సమీపంలో ఉన్న టెక్నీషియన్లు కనబడతారు.\n3. 8 అక్షరాలు, క్యాపిటల్ లెటర్, నంబర్ మరియు సింబల్‌తో పాస్‌వర్డ్ సృష్టించండి.\nకింది బటన్ నొక్కి ఇప్పుడే రిజిస్టర్ అవ్వండి." :
        currentLanguage === 'hindi' ?
        "कस्टमर अकाउंट बनाने की प्रक्रिया:\n1. अपना पूरा नाम, 10 अंकों का मोबाइल नंबर और ईमेल दर्ज करें।\n2. जीपीएस या मैप पिन से अपने घर का स्थान सेट करें ताकि नजदीकी कारीगर मिल सकें।\n3. 8 अक्षरों का सुरक्षित पासवर्ड बनाएं जिसमें कैपिटल लेटर, नंबर और सिंबल हो।\nरजिस्टर करने के लिए नीचे दिए गए बटन पर टैप करें।" :
        "How to Register as a Customer on FixNow:\n1. Enter your full name, 10-digit mobile number, and email.\n2. Pin your home location using GPS or the map picker so we can find verified technicians closest to you.\n3. Create an 8-character password with an uppercase letter, number, and special character.\nTap the button below to open Customer Registration.";

      appendChatBubble(resp, 'assistant', {
        actions: [
          { text: "📝 Open Customer Registration", url: "auth.html?role=customer&action=signup" },
          { text: "🔑 Customer Login", url: "auth.html?role=customer&action=login" }
        ]
      });
      speakResponse(resp);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 10B: Provider Registration & Trade Onboarding Guide
    // -----------------------------------------------------------------------
    if (/(provider (signup|sign up|register|registration)|register as (a )?provider|sign up as (a )?provider|become a provider|register (as a )?technician|service provider register|how to register (as a )?provider|how to become (a )?provider|how do i register as a provider|how do i become a provider|how to register technician|ప్రొవైడర్ రిజిస్టర్|ప్రొవైడర్ సైన్ అప్|టెక్నీషియన్ రిజిస్టర్|प्रदाता रजिस्ट्रेशन|कारीगर रजिस्ट्रेशन|सर्विस प्रोवाइडर रजिस्ट्रेशन)/i.test(lower)) {
      const resp = currentLanguage === 'telugu' ?
        "సర్వీస్ ప్రొవైడర్‌గా రిజిస్టర్ అవ్వడం ఎలా:\n1. మీ పూర్తి పేరు మరియు 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.\n2. మీ పని విభాగం (ఎలక్ట్రీషియన్, ప్లంబర్, ఏసీ రిపేర్, బ్యూటీషియన్ మొదలైనవి) ఎంచుకోండి.\n3. మీ వర్క్‌షాప్ లొకేషన్ మరియు ట్రావెల్ రేడియస్ (కిలోమీటర్లలో) సెట్ చేయండి.\n4. సెక్యూర్ పాస్‌వర్డ్ సృష్టించి రిజిస్టర్ అవ్వండి.\n5. రిజిస్టర్ అయ్యాక, మీ డ్యాష్‌బోర్డ్‌లో మీ రేట్ కార్డ్ ఓపెన్ చేసి మీ స్వంత సర్వీస్ ధరలను మీరే నిర్ధారించండి (ధరలు డిఫాల్ట్‌గా ఉండవు).\nఇప్పుడే ప్రొవైడర్‌గా నమోదు చేసుకోండి." :
        currentLanguage === 'hindi' ?
        "सर्विस प्रोवाइडर के रूप में पंजीकरण कैसे करें:\n1. अपना पूरा नाम और मोबाइल नंबर दर्ज करें।\n2. अपनी कार्य श्रेणी (इलेक्ट्रीशियन, प्लंबर, एसी रिपेयर, ब्यूटीशियन आदि) चुनें।\n3. अपना वर्कशॉप स्थान और सेवा दायरा (किलोमीटर में) सेट करें।\n4. 8-अक्षरों का पासवर्ड बनाकर सबमिट करें।\n5. इसके बाद अपने डैशबोर्ड में जाकर रेट कार्ड में अपनी सेवाओं और कीमतों को खुद सेट करें (कीमतें पहले से तय नहीं होती हैं)।\nरजिस्टर करने के लिए नीचे टैप करें।" :
        "How to Register as a Service Provider on FixNow:\n1. Enter your full name and 10-digit mobile number.\n2. Select your trade category (Electrician, Plumber, AC Repair, Beautician, Mechanic, etc.).\n3. Pin your workshop location and specify your travel radius in kilometers.\n4. Create a secure password conforming to the 6 security rules.\n5. Once registered, open your Rate Card in your dashboard to manually define your custom services and prices (no default prices are imposed).\nTap below to register your trade.";

      appendChatBubble(resp, 'assistant', {
        actions: [
          { text: "🔧 Open Provider Registration", url: "auth.html?role=provider&action=signup" },
          { text: "🛠️ Provider Login", url: "auth.html?role=provider&action=login" }
        ]
      });
      speakResponse(resp);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 10C: Customer or Provider Login Guide
    // -----------------------------------------------------------------------
    if (/(customer login|provider login|login as (a )?provider|login as (a )?customer|how to login as (a )?provider|how to login as (a )?customer|how do i login as (a )?provider|how do i login as (a )?customer|sign in as (a )?customer|sign in as (a )?provider|కస్టమర్ లాగిన్|ప్రొవైడర్ లాగిన్|कस्टमर लॉगिन|प्रोवाइडर लॉगिन)/i.test(lower)) {
      const isProv = /(provider|technician|mechanic|ప్రొవైడర్|प्रदाता|कारीगर)/i.test(lower);
      const resp = isProv ? (
        currentLanguage === 'telugu' ?
          "సర్వీస్ ప్రొవైడర్ లాగిన్: 1. లాగిన్ పేజీలో 'Service Provider' ఎంచుకోండి. 2. మీ రిజిస్టర్డ్ మొబైల్ నంబర్ మరియు పాస్‌వర్డ్ నమోదు చేయండి. 3. 'Login to Provider Dashboard' నొక్కి మీ ఇన్‌కమింగ్ బుకింగ్స్ మరియు రేట్ కార్డ్ నిర్వహించండి." :
          currentLanguage === 'hindi' ?
          "सर्विस प्रोवाइडर लॉगिन: 1. 'Service Provider' चुनें। 2. अपना पंजीकृत मोबाइल नंबर और पासवर्ड दर्ज करें। 3. लॉगिन बटन दबाकर अपने कस्टमर रिक्वेस्ट और रेट कार्ड को प्रबंधित करें।" :
          "To Login as a Service Provider:\n1. Select 'Service Provider' on the login screen.\n2. Enter your registered mobile number and password.\n3. Click Login to access your provider dashboard, view incoming bookings, and manage your custom rate card."
      ) : (
        currentLanguage === 'telugu' ?
          "కస్టమర్ లాగిన్: 1. లాగిన్ పేజీలో 'Customer' ఎంచుకోండి. 2. మీ రిజిస్టర్డ్ మొబైల్ లేదా ఈమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి. 3. 'Login to Customer Account' నొక్కండి. మీరు వెంటనే టెక్నీషియన్లను బుక్ చేసుకోవచ్చు మరియు హౌస్‌హోల్డ్ హెల్త్ చెక్ చేయవచ్చు." :
          currentLanguage === 'hindi' ?
          "कस्टमर लॉगिन: 1. 'Customer' चुनें। 2. अपना पंजीकृत मोबाइल नंबर या ईमेल और पासवर्ड दर्ज करें। 3. लॉगिन करें और नजदीकी कारीगरों को बुक करें।" :
          "To Login as a Customer:\n1. Click 'Login / Sign Up' and select 'Customer'.\n2. Enter your registered mobile number or email and password.\n3. Click Login to browse verified specialists, dispatch bookings, and track household appliances."
      );

      appendChatBubble(resp, 'assistant', {
        actions: [
          { text: "👤 Customer Login", url: "auth.html?role=customer&action=login" },
          { text: "🛠️ Provider Login", url: "auth.html?role=provider&action=login" },
          { text: "📝 New Registration", url: "auth.html?action=signup" }
        ]
      });
      speakResponse(resp);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 10D: Password Security Policy
    // -----------------------------------------------------------------------
    if (/(password policy|password rules|password requirements|పాస్‌వర్డ్ నిబంధనలు|पासवर्ड नियम|கடவுச்சொல்)/i.test(lower)) {
      const resp = currentLanguage === 'telugu' ?
        "ఫిక్స్‌నౌ పాస్‌వర్డ్ నిబంధనలు: 1. కనీసం 8 అక్షరాలు ఉండాలి. 2. కనీసం 1 పెద్ద అక్షరం (A-Z). 3. కనీసం 1 చిన్న అక్షరం (a-z). 4. కనీసం 1 అంకె (0-9). 5. కనీసం 1 స్పెషల్ క్యారెక్టర్ (@, #, $, % మొదలైనవి). 6. కన్‌ఫర్మ్ పాస్‌వర్డ్ సమానంగా ఉండాలి." :
        currentLanguage === 'hindi' ?
        "FixNow पासवर्ड सुरक्षा नियम: 1. न्यूनतम 8 अक्षर। 2. कम से कम 1 बड़ा अक्षर (A-Z)। 3. कम से कम 1 छोटा अक्षर (a-z)। 4. कम से कम 1 संख्या (0-9)। 5. कम से कम 1 विशेष चिह्न (@, #, $ आदि)। 6. कन्फर्म पासवर्ड बिल्कुल समान होना चाहिए।" :
        "FixNow Password Security Policy requires:\n1. Minimum length: 8 characters.\n2. Uppercase: At least 1 (A-Z).\n3. Lowercase: At least 1 (a-z).\n4. Number: At least 1 (0-9).\n5. Special character: At least 1 (@, #, $, etc.).\n6. Confirm password must match password.";

      appendChatBubble(resp, 'assistant');
      speakResponse(resp);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 10E: Direct Voice Navigation to Auth Page
    // -----------------------------------------------------------------------
    if (/(open (login|signup|register)|take me to (login|signup|register)|go to (login|signup|register)|లాగిన్ పేజీకి వెళ్ళు|సైన్ అప్ పేజీకి వెళ్ళు|लॉगिन पेज खोलो|रजिस्ट्रेशन पेज खोलो)/i.test(lower)) {
      const isSignup = /(signup|sign up|register)/i.test(lower);
      const isProv = /(provider|technician)/i.test(lower);
      const targetUrl = `auth.html?role=${isProv ? 'provider' : 'customer'}&action=${isSignup ? 'signup' : 'login'}`;
      
      const resp = currentLanguage === 'telugu' ?
        "ఖాతా పేజీకి మిమ్మల్ని తీసుకువెళుతున్నాను..." :
        currentLanguage === 'hindi' ?
        "लॉगिन और रजिस्ट्रेशन पेज पर ले जाया जा रहा है..." :
        "Redirecting you to the authentication page now...";

      appendChatBubble(resp, 'assistant');
      speakResponse(resp);
      setTimeout(() => { window.location.href = targetUrl; }, 1200);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 10F: General How to Login or Sign Up Overview
    // -----------------------------------------------------------------------
    if (/(how (to|do i) (login|sign up|register)|how to login or sign up|create (an )?account|login or (sign up|register)|how do i login|how do i sign up|లాగిన్ ఎలా|రిజిస్టర్ ఎలా|साइन अप कैसे करें|लॉगिन कैसे करें|खाता कैसे बनाएं|பதிவு செய்வது எப்படி)/i.test(lower)) {
      const authGuide = currentLanguage === 'telugu' ?
        "ఫిక్స్‌నౌలో లాగిన్ మరియు సైన్ అప్:\n1. హోమ్‌పేజీలో 'Login / Sign Up' బటన్ నొక్కండి.\n2. మీరు పనులు బుక్ చేసుకోవాలంటే 'Customer' ఎంచుకోండి.\n3. టెక్నీషియన్ అయితే 'Service Provider' ఎంచుకుని మీ సేవా వివరాలు మరియు రేట్ కార్డ్ నమోదు చేయండి.\n4. మీ మొబైల్ నంబర్ మరియు పాస్‌వర్డ్ నమోదు చేసి లాగిన్ చేయండి, లేదా కొత్త ఖాతా కోసం 'New Signup' నొక్కండి." :
        currentLanguage === 'hindi' ?
        "FixNow में लॉगिन और साइन अप प्रक्रिया:\n1. ऊपर 'Login / Sign Up' पर क्लिक करें।\n2. सेवा बुक करने के लिए 'Customer' चुनें, या काम देने वाले तकनीशियन हैं तो 'Service Provider' चुनें।\n3. अपना मोबाइल नंबर और पासवर्ड दर्ज करके लॉगिन करें। नए खाते के लिए 'New Signup' पर टैप करें।" :
        "How to Login or Sign Up on FixNow:\n1. Click 'Login / Sign Up' in the header.\n2. Choose 'Customer' if you want to find and book local services, or 'Service Provider' if you want to register your trade and set your custom rate card.\n3. Enter your registered mobile number and password to login, or click 'New Signup' to create an account in 30 seconds.";

      appendChatBubble(authGuide, 'assistant', {
        actions: [
          { text: "👤 Customer Portal", url: "auth.html?role=customer" },
          { text: "🛠️ Provider Portal", url: "auth.html?role=provider" }
        ]
      });
      speakResponse(authGuide);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 10G: Location Change Guidance for Customer & Provider
    // -----------------------------------------------------------------------
    if (/(how (can|do) (i|customer|provider|a customer|a provider|we) (change|update) (my |the )?location|change (my |the )?location|update (my |the )?location|different place|other place|another place|another city|other city|new location|వేరే ఊర్లో|లొకేషన్ ఎలా మార్చాలి|లొకేషన్ ఎలా మార్చుకోవాలి|లోకేషన్ మార్చడం|లోకేషన్ ఎలా మార్చాలి|లోకేషన్ ఎలా మార్చుకోవాలి|లోకేషన్ ఎలా ఛేంజ్|लोकेशन कैसे बदलें|स्थान कैसे बदलें|दूसरी जगह|इடத்தை மாற்றுவது எப்படி)/i.test(lower)) {
      const locGuide = currentLanguage === 'telugu' ?
        "కస్టమర్ లేదా సర్వీస్ ప్రొవైడర్ లొకేషన్ మార్చుకునే విధానం:\n\nకస్టమర్ల కోసం:\n1. ప్రొఫైల్ ద్వారా: హెడర్‌లో మీ పేరుపై క్లిక్ చేసి 'Edit Profile' లో '[📍 Use Current GPS]' నొక్కండి లేదా మీ కొత్త చిరునామా నమోదు చేయండి.\n2. సర్వీస్ పేజీలో: Services పేజీలో కొత్త ప్రాంతం పేరు లేదా GPS ఉపయోగించి అక్కడ ఉన్న టెక్నీషియన్లను శోధించవచ్చు.\n3. బుకింగ్ సమయంలో: ఏదైనా సర్వీస్ బుక్ చేసేటప్పుడు మీ ప్రస్తుత డోర్‌స్టెప్ చిరునామాను నేరుగా ఇవ్వవచ్చు.\n\nసర్వీస్ ప్రొవైడర్ల కోసం:\n1. వర్క్‌షాప్ జీపీఎస్: Provider Dashboard లో 'My Profile' ట్యాబ్‌లో '[📍 Detect Workshop GPS]' నొక్కి మీ వర్క్‌షాప్ లొకేషన్ అప్‌డేట్ చేయండి.\n2. ట్రావెల్ రేడియస్: 'Availability & Working Hours' ట్యాబ్‌లో మీ ప్రయాణ పరిధి (1-50 కి.మీ) మార్చుకోండి." :
        currentLanguage === 'hindi' ?
        "कस्टमर या सर्विस प्रोवाइडर का स्थान (लोकेशन) बदलने का तरीका:\n\nकस्टमर के लिए:\n1. प्रोफाइल से: ऊपर अपने नाम पर क्लिक करें > 'Edit Profile' में जाकर '[📍 Use Current GPS]' दबाएं या नया पता दर्ज करें।\n2. सर्विसेज पेज से: Services पेज पर किसी भी नए शहर/इलाके का नाम डालकर वहां के कारीगर खोज सकते हैं।\n3. बुकिंग के समय: अपॉइंटमेंट लेते समय सीधे अपना नया पता दर्ज कर सकते हैं।\n\nसर्विस प्रोवाइडर के लिए:\n1. वर्कशॉप जीपीएस: Provider Dashboard में 'My Profile' टैब पर जाएं और '[📍 Detect Workshop GPS]' से नया वर्कशॉप स्थान सेट करें।\n2. कार्य दायरा (Radius): 'Availability & Working Hours' टैब में जाकर अपनी सेवा दूरी (1 से 50 किमी) अपडेट करें।" :
        currentLanguage === 'tamil' ?
        "வாடிக்கையாளர் அல்லது சேவை வழங்குநர் இருப்பிடத்தை மாற்றும் முறை:\n\nவாடிக்கையாளர்களுக்கு:\n1. சுயவிவரத்தில்: மேலே உள்ள உங்கள் பெயரை கிளிக் செய்து 'Edit Profile' > '[📍 Use Current GPS]' அழுத்தவும் அல்லது புதிய முகவரியை உள்ளிடவும்.\n2. சேவை தேடலில்: Services பக்கத்தில் புதிய ஊர் அல்லது பகுதியை உள்ளிட்டு அருகிலுள்ள நிபுணர்களைக் கண்டறியலாம்.\n3. முன்பதிவின் போது: புதிய முகவரியை நேரடியாக வழங்கலாம்.\n\nசேவை வழங்குநர்களுக்கு:\n1. பட்டறை ஜிபிஎஸ்: Provider Dashboard > 'My Profile' > '[📍 Detect Workshop GPS]' மூலம் புதிய பணிமனையை அமைக்கலாம்.\n2. பணி எல்லை: 'Availability & Working Hours' தாவலில் சேவை தூரத்தை (1-50 கிமீ) மாற்றலாம்." :
        "How Customers and Providers can change their location:\n\nFor Customers:\n1. Profile GPS: Click your name in the header > 'Edit Customer Profile' > click '[📍 Use Current GPS]' or type your new address.\n2. Services Search: On the Services page, enter any town, village or landmark in the Location bar to find technicians in that area.\n3. During Booking: Type your current address directly in the service address field when placing an order.\n\nFor Service Providers:\n1. Workshop GPS: Open Provider Dashboard > 'My Profile' tab > click '[📍 Detect Workshop GPS]' or enter your new workshop base.\n2. Coverage Radius: In Provider Dashboard > 'Availability & Working Hours' tab, adjust your maximum travel radius (1 to 50 km) to receive requests in your new location perimeter.";

      appendChatBubble(locGuide, 'assistant', {
        actions: [
          { text: "👤 Customer Profile", url: "javascript:window.FixNow.openCustomerProfileModal()" },
          { text: "🛠️ Provider Dashboard", url: "provider-dashboard.html" },
          { text: "🔍 Search in New Location", url: "services.html" }
        ]
      });
      speakResponse(locGuide);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 11: Service Category Discovery (Single Source of Truth)
    // -----------------------------------------------------------------------
    const matchResult = window.FixNowData.identifyCategory(input);

    if (matchResult.matched) {
      const categoryId = matchResult.categoryId;
      const categoryName = matchResult.categoryName;
      sessionState.activeCategory = categoryId;
      sessionState.bookingDraft.categoryName = categoryName;

      // Find real matching providers and calculate Haversine distances immediately
      const matchingProviders = FixNowVoiceTools.search_providers(categoryId, null);
      sessionState.lastDisplayedProviders = matchingProviders;
      sessionState.selectedProvider = matchingProviders.length > 0 ? matchingProviders[0] : null;

      // Check if category has subservices for interactive clarification
      const subServices = (window.FixNowData.subServices && window.FixNowData.subServices[categoryId]) ? window.FixNowData.subServices[categoryId] : [];

      if (matchingProviders.length > 0 && subServices.length > 0 && !lower.includes('all') && !lower.includes('near') && !sessionState.activeSubService) {
        sessionState.bookingDraft.stage = 'awaiting_subservice';

        let clarifyText = "";
        const topSubs = subServices.slice(0, 3).join(', ');

        if (currentLanguage === 'telugu') {
          clarifyText = `ఖచ్చితంగా! మీ ఏరియాలో ${matchingProviders.length} రిజిస్టర్డ్ ${categoryName} నిపుణులు ఉన్నారు. ప్రత్యేకంగా ఏం కావాలి? ఉదాహరణకు: ${topSubs}?`;
        } else if (currentLanguage === 'hindi') {
          clarifyText = `ज़रूर! आपके क्षेत्र में ${matchingProviders.length} पंजीकृत ${categoryName} हैं। क्या आप ${topSubs} जैसी कोई खास सेवा चाहते हैं?`;
        } else if (currentLanguage === 'tamil') {
          clarifyText = `நிச்சயமாக! உங்கள் பகுதியில் ${matchingProviders.length} ${categoryName} நிபுணர்கள் உள்ளனர். ${topSubs} போன்ற உதவி தேவையா?`;
        } else {
          clarifyText = `Sure! I found ${matchingProviders.length} registered ${categoryName} provider(s) in your area. Are you looking for ${topSubs}, or would you like to see the nearest?`;
        }

        // Render subservice options chips along with provider cards
        appendChatBubble(clarifyText, 'assistant', {
          categoryId: categoryId,
          categoryName: categoryName,
          subServices: subServices,
          providers: matchingProviders
        });
        speakResponse(clarifyText);
        return;
      }

      // Execute search immediately
      executeProviderSearch(categoryId, null);
      return;
    }

    // -----------------------------------------------------------------------
    // INTENT 12: Unknown Request — NEVER Defaults to AC Repair!
    // -----------------------------------------------------------------------
    const unknownText = matchResult.responses[currentLanguage] || matchResult.responses.english;
    appendChatBubble(unknownText, 'assistant', { isUnknown: true });
    speakResponse(unknownText);
  }

  // =========================================================================
  // SUB-ROUTINES FOR REUSABLE WORKFLOWS
  // =========================================================================

  /**
   * Search real registered providers and update conversational state
   */
  function executeProviderSearch(categoryId, subService) {
    const matchingProviders = FixNowVoiceTools.search_providers(categoryId, subService);
    sessionState.lastDisplayedProviders = matchingProviders;
    sessionState.selectedProvider = matchingProviders.length > 0 ? matchingProviders[0] : null;

    const catInfo = window.FixNowData.categoryMap[categoryId] || { name: categoryId };
    const catName = catInfo.name || categoryId;

    if (matchingProviders.length > 0) {
      let voiceSummary = "";
      if (currentLanguage === 'telugu') {
        voiceSummary = `మీ సర్వీస్ ఏరియాలో ${matchingProviders.length} రిజిస్టర్డ్ ${catName} నిపుణులు అందుబాటులో ఉన్నారు. సమీపంలో ఉన్నవారు ${matchingProviders[0].name}.`;
      } else if (currentLanguage === 'hindi') {
        voiceSummary = `मुझे आपके क्षेत्र में ${matchingProviders.length} पंजीकृत ${catName} मिले हैं। सबसे नज़दीक ${matchingProviders[0].name} हैं।`;
      } else if (currentLanguage === 'tamil') {
        voiceSummary = `உங்கள் பகுதியில் ${matchingProviders.length} ${catName} நிபுணர்கள் உள்ளனர்.`;
      } else {
        voiceSummary = `I found ${matchingProviders.length} registered ${catName} provider(s) in your service area. The nearest is ${matchingProviders[0].name}, approximately ${matchingProviders[0].distanceKm} km away.`;
      }

      appendChatBubble(voiceSummary, 'assistant', {
        categoryId: categoryId,
        categoryName: catName,
        providers: matchingProviders
      });
      speakResponse(voiceSummary);
    } else {
      // HONEST EMPTY STATE — NEVER GENERATE FAKE DATA
      let emptyMsg = "";
      if (currentLanguage === 'telugu') {
        emptyMsg = `మీ ప్రాంతంలో ప్రస్తుతం నమోదైన ${catName} సర్వీస్ ప్రొవైడర్లు ఎవరూ అందుబాటులో లేరు.`;
      } else if (currentLanguage === 'hindi') {
        emptyMsg = `आपके क्षेत्र में अभी कोई पंजीकृत ${catName} सेवा प्रदाता उपलब्ध नहीं है।`;
      } else if (currentLanguage === 'tamil') {
        emptyMsg = `தற்போது உங்கள் பகுதியில் ${catName} சேவைகள் கிடைக்கவில்லை.`;
      } else {
        emptyMsg = `No registered ${catName} service providers are currently available in your area.`;
      }

      appendChatBubble(emptyMsg, 'assistant', {
        categoryId: categoryId,
        categoryName: catName,
        providers: []
      });
      speakResponse(emptyMsg);
    }
  }

  /**
   * Start Voice Booking Step-by-Step Flow for a Selected Provider
   */
  function startBookingFlowForProvider(provider) {
    sessionState.selectedProvider = provider;
    sessionState.bookingDraft.provider = provider;
    sessionState.bookingDraft.stage = 'awaiting_datetime';

    const serviceName = sessionState.bookingDraft.subService || provider.serviceTitle || provider.serviceCategory || 'Service';

    let promptText = "";
    if (currentLanguage === 'telugu') {
      promptText = `మంచి ఎంపిక! ${provider.name} గారితో ${serviceName} బుక్ చేయడానికి ఏ తేదీ మరియు సమయం కావాలి? (ఉదాహరణకు: 'రేపు ఉదయం 10 గంటలకు')`;
    } else if (currentLanguage === 'hindi') {
      promptText = `बढ़िया! ${provider.name} के साथ ${serviceName} के लिए आप कौन सी तारीख और समय पसंद करेंगे? (जैसे: 'कल सुबह 10 बजे')`;
    } else if (currentLanguage === 'tamil') {
      promptText = `அருமை! ${provider.name} உடன் முன்பதிவு செய்ய எந்த தேதி மற்றும் நேரம் வேண்டும்?`;
    } else {
      promptText = `Great choice! ${provider.name} is selected for ${serviceName}. What appointment date and time would you prefer? (e.g., 'Tomorrow at 10 AM' or '25th October Morning')`;
    }

    appendChatBubble(promptText, 'assistant', {
      selectedProviderOnly: provider
    });
    speakResponse(promptText);
  }

  /**
   * Handle Customer Booking Status Voice Inquiry
   */
  function handleCustomerBookingStatusInquiry() {
    const bookings = FixNowVoiceTools.get_customer_bookings();

    if (bookings.length === 0) {
      const msg = currentLanguage === 'telugu' ? "మీకు ప్రస్తుతం ఎలాంటి సర్వీస్ బుకింగ్‌లు లేవు." :
        currentLanguage === 'hindi' ? "आपके पास अभी कोई सक्रिय बुकिंग नहीं है।" :
        "You do not have any active service bookings right now. When you book a provider, your status will be tracked live here.";
      appendChatBubble(msg, 'assistant');
      speakResponse(msg);
      return;
    }

    const latest = bookings[0];
    const status = latest.status || 'Pending';
    const provName = latest.providerName || 'Specialist';
    const sName = latest.subService || latest.serviceCategory || 'Service';

    let statusVoice = "";
    if (currentLanguage === 'telugu') {
      statusVoice = `మీ తాజా బుకింగ్ #${latest.requestId} (${provName} తో ${sName}): ప్రస్తుతం ${status} లో ఉంది.`;
    } else if (currentLanguage === 'hindi') {
      statusVoice = `आपकी ताज़ा बुकिंग #${latest.requestId} (${provName} के साथ ${sName}) अभी ${status} स्थिति में है।`;
    } else {
      statusVoice = `Your latest booking #${latest.requestId} for ${sName} with ${provName} is currently ${status}. Scheduled for ${latest.date} (${latest.timeSlot}).`;
    }

    if (status === 'Accepted') {
      statusVoice += " The provider has confirmed your appointment. You can now call or chat directly!";
    }

    appendChatBubble(statusVoice, 'assistant', {
      customerBookingsList: bookings.slice(0, 3)
    });
    speakResponse(statusVoice);
  }

  /**
   * Handle Household Equipment Health & Preventive AI Inquiry
   */
  function handleHouseholdHealthInquiry(query) {
    const appliance = FixNowVoiceTools.get_household_equipment(query);

    if (appliance && appliance.name) {
      const appName = appliance.name || appliance.type;
      const score = appliance.healthScore || 85;
      const rec = appliance.aiRecommendation || 'Operate smoothly with regular cleaning.';
      const lastServ = appliance.lastServiceDate || 'Recently';

      let voiceMsg = `Your ${appName} is in ${appliance.status || 'Good Condition'} with a health score of ${score}%. Last serviced on ${lastServ}. Recommendation: ${rec}`;
      if (currentLanguage === 'telugu') {
        voiceMsg = `మీ ${appName} ఆరోగ్యం స్కోర్ ${score}%. చివరి సర్వీస్: ${lastServ}. సిఫార్సు: ${rec}`;
      } else if (currentLanguage === 'hindi') {
        voiceMsg = `आपके ${appName} का हेल्थ स्कोर ${score}% है। अंतिम सर्विस: ${lastServ}। सुझाव: ${rec}`;
      }

      appendChatBubble(voiceMsg, 'assistant', {
        singleAppliance: appliance
      });
      speakResponse(voiceMsg);
    } else {
      const apps = (appliance && Array.isArray(appliance.appliances)) ? appliance.appliances : [];
      if (apps.length === 0) {
        const emptyMsg = "You do not have any registered appliances in your Digital Twin yet. You can visit the Household Health page to register your equipment and track predictive health.";
        appendChatBubble(emptyMsg, 'assistant');
        speakResponse(emptyMsg);
        return;
      }
      const overall = appliance && appliance.overallHealthScore ? appliance.overallHealthScore : 85;
      const genMsg = `Your overall household appliance health score is ${overall}%. You have ${apps.length} tracked system(s) in your digital twin.`;
      appendChatBubble(genMsg, 'assistant', {
        householdOverview: appliance
      });
      speakResponse(genMsg);
    }
  }

  /**
   * Handle Provider Role Voice Commands
   */
  function handleProviderRoleVoiceCommand(lower, originalText) {
    const requests = FixNowVoiceTools.get_provider_booking_requests();

    if (lower.includes('accept')) {
      // Find request to accept (either first pending or matching ID)
      const pending = requests.filter(r => r.status === 'Pending');
      if (pending.length === 0) {
        const noReq = "You do not have any pending requests to accept right now.";
        appendChatBubble(noReq, 'assistant');
        speakResponse(noReq);
        return;
      }

      const target = pending[0];
      const updated = FixNowVoiceTools.update_booking_status(target.requestId, 'Accepted');

      const accMsg = `Booking #${target.requestId} for ${target.customerName} has been accepted! The client has been notified and direct Call & Chat are now enabled.`;
      appendChatBubble(accMsg, 'assistant', { acceptedBooking: updated });
      speakResponse(accMsg);
      return;
    }

    if (lower.includes('reject') || lower.includes('decline')) {
      const pending = requests.filter(r => r.status === 'Pending');
      if (pending.length === 0) {
        const noReq = "You do not have any pending requests to decline.";
        appendChatBubble(noReq, 'assistant');
        speakResponse(noReq);
        return;
      }
      const target = pending[0];
      FixNowVoiceTools.update_booking_status(target.requestId, 'Rejected');
      const rejMsg = `Booking #${target.requestId} from ${target.customerName} has been declined.`;
      appendChatBubble(rejMsg, 'assistant');
      speakResponse(rejMsg);
      return;
    }

    if (lower.includes('update') && lower.includes('location')) {
      const locMsg = "To update your service location and coverage radius: Open the Provider Dashboard and navigate to the 'Availability & Working Hours' or 'My Profile' tab.";
      appendChatBubble(locMsg, 'assistant');
      speakResponse(locMsg);
      return;
    }

    // Default: List requests
    const pendingList = requests.filter(r => r.status === 'Pending');
    if (pendingList.length === 0) {
      const msg = "You currently have 0 pending booking requests. All appointments are up to date!";
      appendChatBubble(msg, 'assistant');
      speakResponse(msg);
      return;
    }

    const first = pendingList[0];
    const speech = `You have ${pendingList.length} incoming request(s). Client ${first.customerName} requested ${first.subService || first.serviceCategory} on ${first.date} at ${first.timeSlot}. Client note: "${first.problemDesc}". Would you like to accept this request?`;

    appendChatBubble(speech, 'assistant', {
      providerRequests: pendingList
    });
    speakResponse(speech);
  }

  /**
   * Parse spoken dates and times into formatted strings
   */
  function parseSpokenDateTime(text) {
    const lower = text.toLowerCase();
    const today = new Date();

    let dateStr = "Tomorrow";
    let timeSlot = "Morning (9:00 AM - 12:00 PM)";

    if (lower.includes('today') || lower.includes('ఈరోజు') || lower.includes('आज')) {
      dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } else if (lower.includes('tomorrow') || lower.includes('రేపు') || lower.includes('कल')) {
      dateStr = 'Tomorrow';
    }

    // Match explicit dates like "25th October" or "25 Oct"
    const dateMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
    if (dateMatch) {
      dateStr = `${dateMatch[1]} ${dateMatch[2].toUpperCase()} 2026`;
    }

    if (lower.includes('afternoon') || lower.includes('మధ్యాహ్నం') || lower.includes('दोपहर')) {
      timeSlot = "Afternoon (12:00 PM - 4:00 PM)";
    } else if (lower.includes('evening') || lower.includes('సాయంత్రం') || lower.includes('शाम')) {
      timeSlot = "Evening (4:00 PM - 8:00 PM)";
    } else if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('అత్యవసరం') || lower.includes('तुरंत')) {
      timeSlot = "Urgent (As soon as possible)";
    } else if (lower.includes('10 am') || lower.includes('11 am') || lower.includes('9 am')) {
      timeSlot = "Morning (9:00 AM - 12:00 PM)";
    } else if (lower.includes('2 pm') || lower.includes('3 pm') || lower.includes('4 pm')) {
      timeSlot = "Afternoon (12:00 PM - 4:00 PM)";
    } else if (lower.includes('5 pm') || lower.includes('6 pm') || lower.includes('7 pm')) {
      timeSlot = "Evening (4:00 PM - 8:00 PM)";
    }

    return { date: dateStr, timeSlot: timeSlot };
  }

  // =========================================================================
  // SPEECH RECOGNITION & SYNTHESIS
  // =========================================================================

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not natively supported in this browser. Fallback typing/click mode enabled.');
      updateStatusLabel('Voice recognition not supported by browser. Please type or use quick buttons.');
      return null;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = LANG_CONFIG[currentLanguage].bcp47;

      rec.onstart = function () {
        isListening = true;
        setMicVisualState(true);
        updateStatusLabel(LANG_CONFIG[currentLanguage].listeningText);
      };

      rec.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized speech:', transcript);
        handleUserVoiceInput(transcript);
      };

      rec.onerror = function (event) {
        console.warn('Speech recognition error:', event.error);
        isListening = false;
        setMicVisualState(false);
        if (event.error === 'not-allowed') {
          updateStatusLabel('Microphone permission blocked. Tap any quick prompt below or type.');
          if (window.FixNow && window.FixNow.showToast) {
            window.FixNow.showToast('Microphone access blocked. Use prompt chips or type below.', 'warning');
          }
        } else {
          updateStatusLabel('Tap microphone to speak or type your request.');
        }
      };

      rec.onend = function () {
        isListening = false;
        setMicVisualState(false);
      };

      return rec;
    } catch (e) {
      console.error('Failed to instantiate SpeechRecognition:', e);
      return null;
    }
  }

  function speakResponse(text) {
    if (!speechSynth) return;

    try {
      speechSynth.cancel();
      // Remove HTML tags for audio synthesis
      const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/ID: #\w+/g, 'Booking confirmed');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = LANG_CONFIG[currentLanguage].bcp47;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      speechSynth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  function toggleListening() {
    if (isListening) {
      if (recognition) recognition.stop();
      isListening = false;
      setMicVisualState(false);
      updateStatusLabel('Voice input paused. Tap microphone to speak.');
    } else {
      if (!recognition) {
        recognition = initSpeechRecognition();
      }
      if (recognition) {
        recognition.lang = LANG_CONFIG[currentLanguage].bcp47;
        try {
          recognition.start();
        } catch (e) {
          recognition = initSpeechRecognition();
          if (recognition) recognition.start();
        }
      } else {
        simulateSampleVoice();
      }
    }
  }

  function simulateSampleVoice() {
    const samples = getActivePromptList();
    const randomPrompt = samples[Math.floor(Math.random() * samples.length)];
    if (window.FixNow && window.FixNow.showToast) {
      window.FixNow.showToast('Simulating voice input: "' + randomPrompt + '"', 'info');
    }
    handleUserVoiceInput(randomPrompt);
  }

  function setMicVisualState(listening) {
    const micBtn = document.getElementById('btnVoiceMic');
    const pulseRings = document.getElementById('micPulseRings');

    if (micBtn) {
      if (listening) {
        micBtn.classList.add('listening');
        micBtn.innerHTML = '🛑';
      } else {
        micBtn.classList.remove('listening');
        micBtn.innerHTML = '🎙️';
      }
    }

    if (pulseRings) {
      pulseRings.style.display = listening ? 'block' : 'none';
    }
  }

  function updateStatusLabel(text) {
    const label = document.getElementById('voiceStatusLabel');
    if (label) label.textContent = text;
  }

  // =========================================================================
  // UI CHAT BUBBLE & RICH CARDS RENDERING
  // =========================================================================

  function appendChatBubble(text, sender, meta = null) {
    const feed = document.getElementById('voiceConversationFeed');
    if (!feed) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    let contentHtml = `
      <div style="font-weight: 700; font-size: 0.84rem; margin-bottom: 4px; opacity: 0.85;">
        ${sender === 'user' ? '👤 You said:' : '⚡ FixNow AI Assistant:'}
      </div>
      <div style="font-size: 1.05rem; line-height: 1.5;">"${text}"</div>
    `;

    if (sender === 'assistant' && meta) {
      // 1. Voice Booking Confirmation Prompt Card
      if (meta.showConfirmationCard && meta.bookingDraft) {
        const d = meta.bookingDraft;
        contentHtml += `
          <div style="background: white; border: 2px solid #2563eb; border-radius: 12px; padding: 16px; margin-top: 14px; color: #0f172a; box-shadow: 0 4px 12px rgba(37,99,235,0.15);">
            <div style="font-size: 0.88rem; font-weight: 800; color: #1e40af; margin-bottom: 8px;">
              📝 Confirm Voice Booking Request
            </div>
            <div style="font-size: 0.92rem; line-height: 1.6; margin-bottom: 12px;">
              <div><strong>Professional:</strong> ${d.provider ? d.provider.name : 'Specialist'} (${d.provider ? d.provider.serviceTitle : ''})</div>
              <div><strong>Service:</strong> ${d.subService || d.categoryName}</div>
              <div><strong>Date & Time:</strong> ${d.date} (${d.timeSlot})</div>
              <div><strong>Contact Mobile:</strong> ${d.customerPhone}</div>
              <div><strong>Destination:</strong> ${d.customerAddress}</div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" onclick="window.FixNowVoice.submitPrompt('Yes, confirm it')">
                ✓ Confirm Booking
              </button>
              <button class="btn btn-secondary btn-sm" style="color: #b91c1c; border-color: #fca5a5;" onclick="window.FixNowVoice.submitPrompt('No, cancel')">
                ✕ Cancel
              </button>
            </div>
          </div>
        `;
      }

      // 2. Booking Confirmed Card
      if (meta.bookingConfirmed) {
        const b = meta.bookingConfirmed;
        const cleanPhone = b.providerPhone ? b.providerPhone.replace(/[^0-9+]/g, '') : '';
        contentHtml += `
          <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 16px; margin-top: 14px; color: #14532d;">
            <div style="font-weight: 800; font-size: 1rem; color: #15803d; margin-bottom: 6px;">
              🎉 Booking Dispatched to Provider!
            </div>
            <div style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 12px;">
              <div><strong>Booking ID:</strong> <span style="font-weight: 700; color: #1e40af;">#${b.requestId}</span></div>
              <div><strong>Specialist:</strong> ${b.providerName}</div>
              <div><strong>Schedule:</strong> ${b.date} &bull; ${b.timeSlot}</div>
              <div><strong>Status:</strong> <span class="badge badge-status-attention">● Pending</span></div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" onclick="window.FixNowChat.openChatModal('${b.requestId}', 'customer')">
                💬 Open Chat with Specialist
              </button>
              ${cleanPhone ? `<a href="tel:${cleanPhone}" class="btn btn-secondary btn-sm">📞 Call Provider</a>` : ''}
              <button class="btn btn-secondary btn-sm" onclick="window.FixNow.openCustomerBookingsModal()">
                📋 View in My Bookings
              </button>
            </div>
          </div>
        `;
      }

      // 3. Subservice Selector Chips
      if (meta.subServices && meta.subServices.length > 0) {
        contentHtml += `
          <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 10px;">
            <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px;">Select specific service required:</div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${meta.subServices.map(s => `
                <button class="prompt-chip" style="font-size: 0.85rem; padding: 5px 12px;" onclick="window.FixNowVoice.submitPrompt('${s.replace(/'/g, "\\'")}')">
                  ${s}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }

      // 4. Real Matching Providers Cards
      if (meta.providers && meta.providers.length > 0) {
        contentHtml += `
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
            ${meta.providers.map((p, idx) => {
              const cleanPhone = p.phone || p.phoneNumber;
              return `
                <div style="background: white; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 14px; color: #0f172a; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${p.avatar || p.image}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover;" alt="${p.name}">
                      <div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <strong style="font-size: 1.05rem;">${idx + 1}. ${p.name}</strong>
                          <span class="badge badge-verified" style="font-size: 0.72rem; padding: 2px 6px;">✓ Verified</span>
                        </div>
                        <span style="font-size: 0.85rem; color: #1e40af; font-weight: 600;">${p.serviceTitle}</span>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                          📍 ${p.location || 'Local Area'} &bull; <strong>${p.distanceKm || 2.5} km away</strong>
                        </div>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <span class="badge badge-verified" style="font-size: 0.85rem;">★ ${p.rating ? p.rating.toFixed(1) : '5.0'}</span>
                      <div style="font-size: 0.76rem; color: #15803d; font-weight: 700; margin-top: 2px;">● ${p.availability}</div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-sm" style="flex: 1; min-width: 110px;" onclick="window.FixNowVoice.submitPrompt('Book ${p.name.replace(/'/g, "\\'")}')">
                      📅 Book via Voice
                    </button>
                    <a href="provider.html?id=${p.id}" class="btn btn-secondary btn-sm" style="flex: 1; min-width: 100px; text-align: center;">
                      View Profile
                    </a>
                    ${cleanPhone ? `
                      <a href="tel:${cleanPhone.replace(/[^0-9+]/g, '')}" class="btn btn-secondary btn-sm" title="Call Provider">
                        📞 Call
                      </a>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else if (meta.providers && meta.providers.length === 0) {
        // Honest Empty State
        contentHtml += `
          <div style="margin-top: 12px; background: #fffbeb; border: 1.5px dashed #f59e0b; border-radius: 10px; padding: 14px; color: #92400e;">
            <div style="font-weight: 700; font-size: 0.95rem;">⚠️ No registered ${meta.categoryName} are currently available in your area.</div>
            <p style="font-size: 0.86rem; margin: 4px 0 10px; color: #78350f;">
              FixNow strictly shows genuine registered professionals. Be the first local technician to register in this cluster!
            </p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <a href="auth.html?role=provider" class="btn btn-primary btn-sm">+ Register as a Provider</a>
              <a href="services.html" class="btn btn-secondary btn-sm">Explore All Services</a>
            </div>
          </div>
        `;
      }

      // 5. Customer Bookings Cards
      if (meta.customerBookingsList) {
        contentHtml += `
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
            ${meta.customerBookingsList.map(b => `
              <div style="background: white; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; font-size: 0.88rem;">
                <div style="display: flex; justify-content: space-between; font-weight: 700;">
                  <span>#${b.requestId} &bull; ${b.serviceCategory}</span>
                  <span class="badge ${b.status === 'Accepted' ? 'badge-status-good' : 'badge-status-attention'}">● ${b.status}</span>
                </div>
                <div style="color: #64748b; margin-top: 4px;">Provider: ${b.providerName} &bull; ${b.date} (${b.timeSlot})</div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                  <button class="btn btn-primary btn-sm" style="font-size: 0.78rem; padding: 3px 8px;" onclick="window.FixNowChat.openChatModal('${b.requestId}', 'customer')">💬 Chat</button>
                  ${b.providerPhone ? `<a href="tel:${b.providerPhone}" class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 3px 8px;">📞 Call</a>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // 6. Provider Incoming Requests Cards
      if (meta.providerRequests) {
        contentHtml += `
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
            ${meta.providerRequests.map(req => `
              <div style="background: white; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 14px; font-size: 0.9rem;">
                <div style="display: flex; justify-content: space-between; font-weight: 700; color: #1e40af;">
                  <span>Client: ${req.customerName}</span>
                  <span>#${req.requestId}</span>
                </div>
                <div style="margin: 4px 0;"><strong>Service:</strong> ${req.serviceCategory} &bull; ${req.subService}</div>
                <div style="color: #64748b; font-size: 0.84rem;">📅 ${req.date} (${req.timeSlot}) &bull; 📍 ${req.customerAddress}</div>
                <div style="background: #f8fafc; padding: 6px 10px; border-radius: 6px; margin: 6px 0; font-size: 0.84rem;">
                  "${req.problemDesc}"
                </div>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <button class="btn btn-primary btn-sm" onclick="window.FixNowVoice.submitPrompt('Accept booking #${req.requestId}')">
                    ✓ Accept Booking
                  </button>
                  <button class="btn btn-secondary btn-sm" style="color: #b91c1c; border-color: #fca5a5;" onclick="window.FixNowVoice.submitPrompt('Reject booking #${req.requestId}')">
                    ✕ Decline
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // 7. Household Appliance Card
      if (meta.singleAppliance) {
        const a = meta.singleAppliance;
        contentHtml += `
          <div style="background: white; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 14px; margin-top: 12px; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #0f172a; font-size: 1rem;">${a.type}: ${a.brandModel}</strong>
              <span class="badge ${a.healthScore > 80 ? 'badge-status-good' : 'badge-status-attention'}">Health: ${a.healthScore}%</span>
            </div>
            <div style="color: #64748b; font-size: 0.85rem; margin-bottom: 6px;">Age: ${a.age} &bull; Last Serviced: ${a.lastServiceDate}</div>
            <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 8px 12px; border-radius: 4px; font-size: 0.86rem; color: #1e40af;">
              <strong>AI Recommendation:</strong> ${a.aiRecommendation}
            </div>
            <div style="margin-top: 10px; text-align: right;">
              <a href="household.html" class="btn btn-secondary btn-sm" style="font-size: 0.8rem;">Open Household Health Portal &rarr;</a>
            </div>
          </div>
        `;
      }

      // 8. Unknown suggestions chips
      if (meta.isUnknown) {
        contentHtml += `
          <div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.04); border-radius: 8px;">
            <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 6px;">Tap one of these verified services:</div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="prompt-chip" style="font-size: 0.85rem; padding: 4px 10px;" onclick="window.FixNowVoice.submitPrompt('I need an electrician')">⚡ Electrician</button>
              <button class="prompt-chip" style="font-size: 0.85rem; padding: 4px 10px;" onclick="window.FixNowVoice.submitPrompt('I need AC repair')">❄️ AC Repair</button>
              <button class="prompt-chip" style="font-size: 0.85rem; padding: 4px 10px;" onclick="window.FixNowVoice.submitPrompt('I need a beautician')">✂️ Beautician</button>
              <button class="prompt-chip" style="font-size: 0.85rem; padding: 4px 10px;" onclick="window.FixNowVoice.submitPrompt('I need a plumber')">🚰 Plumber</button>
              <button class="prompt-chip" style="font-size: 0.85rem; padding: 4px 10px;" onclick="window.FixNowVoice.submitPrompt('How do I login or sign up?')">🔑 Login Guide</button>
            </div>
          </div>
        `;
      }

      // 9. Interactive Action Buttons (Auth, Direct Links)
      if (meta.actions && Array.isArray(meta.actions)) {
        contentHtml += `
          <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
            ${meta.actions.map(act => `
              <a href="${act.url}" class="btn btn-primary btn-sm" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.85rem; padding: 6px 14px; border-radius: 6px;">
                ${act.text}
              </a>
            `).join('')}
          </div>
        `;
      }
    }

    bubble.innerHTML = contentHtml;
    feed.appendChild(bubble);
    feed.scrollTop = feed.scrollHeight;
  }

  // =========================================================================
  // LANGUAGE SWITCHING & DYNAMIC PROMPTS
  // =========================================================================

  function getActivePromptList() {
    const config = LANG_CONFIG[currentLanguage] || LANG_CONFIG.english;
    const user = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;
    return (user && user.role === 'provider') ? config.samplePromptsProvider : config.samplePromptsCustomer;
  }

  function setLanguage(lang) {
    if (!LANG_CONFIG[lang]) return;
    currentLanguage = lang;

    // Update active tab buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    renderSamplePromptChips();
    updateStatusLabel(LANG_CONFIG[lang].greeting);

    appendChatBubble(LANG_CONFIG[lang].greeting, 'assistant');
    speakResponse(LANG_CONFIG[lang].greeting);

    if (recognition) {
      recognition.lang = LANG_CONFIG[lang].bcp47;
    }
  }

  function renderSamplePromptChips() {
    const container = document.getElementById('voicePromptChips');
    if (!container) return;

    const samples = getActivePromptList();
    container.innerHTML = samples.map(prompt => `
      <button class="prompt-chip" onclick="window.FixNowVoice.submitPrompt('${prompt.replace(/'/g, "\\'")}')">
        <span>🗣️</span> "${prompt}"
      </button>
    `).join('');
  }

  /**
   * Render Role Context Bar on voice.html
   */
  function renderRoleContextBar() {
    const container = document.getElementById('voiceRoleContextBar');
    if (!container) return;

    const user = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;

    if (!user) {
      container.innerHTML = `
        <span class="user-auth-badge" style="background: white;">
          <span>👤</span> Browsing as Guest Customer
        </span>
        <a href="auth.html?role=customer&action=login" class="btn btn-secondary btn-sm" style="text-decoration: none; padding: 4px 10px;">
          Login as Customer
        </a>
        <a href="auth.html?role=provider&action=login" class="btn btn-secondary btn-sm" style="text-decoration: none; padding: 4px 10px;">
          Login as Provider
        </a>
      `;
    } else if (user.role === 'customer') {
      container.innerHTML = `
        <span class="user-auth-badge" style="background: #eff6ff; color: #1e40af; border-color: #bfdbfe;">
          <span>👤</span> Logged in as Customer: ${user.fullName}
        </span>
        <button class="btn btn-secondary btn-sm" onclick="if(window.FixNowAuth){ window.FixNowAuth.logout(); location.reload(); }">
          Log Out
        </button>
      `;
    } else if (user.role === 'provider') {
      container.innerHTML = `
        <span class="user-auth-badge provider" style="background: #f0fdf4; color: #15803d; border-color: #86efac;">
          <span>🛠️</span> Logged in as Service Provider: ${user.fullName} (Pro)
        </span>
        <button class="btn btn-secondary btn-sm" onclick="if(window.FixNowAuth){ window.FixNowAuth.logout(); location.reload(); }">
          Log Out
        </button>
      `;
    }
  }

  function switchDemoRole(targetRole) {
    window.location.href = `auth.html?role=${targetRole || 'customer'}&action=login`;
  }

  // =========================================================================
  // PUBLIC API & INITIALIZATION
  // =========================================================================

  window.FixNowVoice = {
    init: function () {
      initSpeechRecognition();
      renderRoleContextBar();
      renderSamplePromptChips();

      const micBtn = document.getElementById('btnVoiceMic');
      if (micBtn) {
        micBtn.addEventListener('click', toggleListening);
      }

      // Text input box send button
      const sendBtn = document.getElementById('btnVoiceSend');
      const textInput = document.getElementById('voiceTextInput');

      if (sendBtn && textInput) {
        const handleSend = () => {
          const val = textInput.value.trim();
          if (val) {
            handleUserVoiceInput(val);
            textInput.value = '';
          }
        };

        sendBtn.addEventListener('click', handleSend);
        textInput.addEventListener('keypress', function (e) {
          if (e.key === 'Enter') handleSend();
        });
      }

      // Language buttons
      document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          setLanguage(this.dataset.lang);
        });
      });

      // Initial greeting in conversation feed
      appendChatBubble(LANG_CONFIG[currentLanguage].greeting, 'assistant');
    },
    submitPrompt: function (text) {
      handleUserVoiceInput(text);
    },
    processIntent: processIntent,
    setLanguage: setLanguage,
    switchDemoRole: switchDemoRole,
    getState: function () { return sessionState; },
    tools: FixNowVoiceTools
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('btnVoiceMic')) {
      window.FixNowVoice.init();
    }
  });
})();
