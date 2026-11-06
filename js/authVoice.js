/**
 * FixNow - Multilingual Authentication Voice Assistant Guide (authVoice.js)
 * =========================================================================
 * Comprehensive voice assistance for Customer & Provider login/registration:
 * - Guides users step-by-step through role selection, login, and registration.
 * - Dynamic field-by-field audio hints when focusing on inputs (Name, Mobile, Password, GPS, Category).
 * - Supports English (en-IN), Telugu (te-IN), Hindi (hi-IN), and Tamil (ta-IN).
 * - Full Speech-to-Text command recognition: "Login", "Register", "Customer", "Provider", "Password", "Location", etc.
 * =========================================================================
 */

(function () {
  'use strict';

  let currentLang = 'en'; // 'en' | 'te' | 'hi' | 'ta'
  let isSpeaking = false;
  let recognition = null;
  let isListening = false;

  const AUTH_VOICE_SCRIPTS = {
    roleSelection: {
      en: "Welcome to FixNow. Please select your account type: Choose 'I am a Customer' if you need home repairs, or 'I am a Service Provider' if you want to offer your trade skills. You can also say 'Customer' or 'Provider'.",
      te: "ఫిక్స్‌నౌకి స్వాగతం. మీ ఖాతా రకాన్ని ఎంచుకోండి: మీకు ప్లంబర్ లేదా ఏసీ రిపేర్ వంటి పనులు కావాలంటే 'కస్టమర్' ఎంచుకోండి. మీరు పనులు చేసే టెక్నీషియన్ అయితే 'సర్వీస్ ప్రొవైడర్' ఎంచుకోండి. 'కస్టమర్' లేదా 'ప్రొవైడర్' అని కూడా చెప్పవచ్చు.",
      hi: "FixNow में आपका स्वागत है। कृपया अपना खाता प्रकार चुनें: यदि आपको मरम्मत कार्य कराना है तो 'Customer' चुनें। यदि आप एक तकनीशियन हैं और अपनी सेवा देना चाहते हैं तो 'Service Provider' चुनें। आप 'Customer' या 'Provider' भी बोल सकते हैं।",
      ta: "பிக்ஸ்நௌ-விற்கு வரவேற்கிறோம். உங்களுக்கு வீட்டு பழுதுபார்க்கும் சேவைகள் தேவைப்பட்டால் 'வாடிக்கையாளர்' என்பதைத் தேர்ந்தெடுக்கவும். நீங்கள் சேவை வழங்கும் தொழிலாளி எனில் 'சேவை வழங்குநர்' என்பதைத் தேர்ந்தெடுக்கவும்."
    },
    customerLogin: {
      en: "Customer Login: Enter your registered mobile number or email address, enter your password, and click the Login button. If you do not have an account yet, click 'New Customer Signup' or say 'Register' to create a free account.",
      te: "కస్టమర్ లాగిన్: మీ రిజిస్టర్డ్ మొబైల్ నంబర్ లేదా ఈమెయిల్, మరియు పాస్‌వర్డ్ నమోదు చేసి 'లాగిన్' బటన్ నొక్కండి. మీకు ఖాతా లేకపోతే, 'న్యూ కస్టమర్ సైన్ అప్' నొక్కండి లేదా 'రిజిస్టర్' అని చెప్పండి.",
      hi: "कस्टमर लॉगिन: अपना पंजीकृत मोबाइल नंबर या ईमेल और पासवर्ड दर्ज करके 'Login' बटन पर टैप करें। यदि आपके पास खाता नहीं है, तो 'New Customer Signup' पर क्लिक करें या 'Register' बोलें।",
      ta: "வாடிக்கையாளர் உள்நுழைவு: உங்கள் பதிவு செய்த மொபைல் எண் அல்லது மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிட்டு உள்நுழையவும். புதிய கணக்கு தொடங்க 'ரிஜிஸ்டர்' என்று சொல்லவும்."
    },
    customerSignup: {
      en: "Customer Registration: 1. Enter your full name. 2. Enter your 10-digit mobile number and email. 3. Click 'Use Current GPS' or pin your home on the map. 4. Create an 8-character password. Click 'Create Free Customer Account' when ready.",
      te: "కస్టమర్ రిజిస్ట్రేషన్: 1. మీ పూర్తి పేరు నమోదు చేయండి. 2. 10 అంకెల మొబైల్ నంబర్ మరియు ఈమెయిల్ ఇవ్వండి. 3. మీ ఇంటి అడ్రస్ లేదా 'Use GPS' నొక్కండి. 4. కనీసం 8 అక్షరాలతో పాస్‌వర్డ్ సృష్టించండి. తర్వాత 'Create Free Account' నొక్కండి.",
      hi: "कस्टमर पंजीकरण: 1. अपना पूरा नाम दर्ज करें। 2. 10 अंकों का मोबाइल नंबर और ईमेल दें। 3. 'Use GPS' पर टैप करें या अपना पता पिन करें। 4. 8 अक्षरों का पासवर्ड बनाएं। फिर 'Create Free Account' पर क्लिक करें।",
      ta: "வாடிக்கையாளர் பதிவு: 1. உங்கள் முழு பெயர். 2. 10 இலக்க மொபைல் எண் மற்றும் மின்னஞ்சல். 3. ஜிபிஎஸ் முகவரி. 4. 8 இலக்க கடவுச்சொல் உள்ளிட்டு கணக்கு தொடங்கவும்."
    },
    providerLogin: {
      en: "Service Provider Login: Enter your registered 10-digit mobile number and password, then click Login to access your Provider Dashboard, incoming customer service requests, and rate card.",
      te: "సర్వీస్ ప్రొవైడర్ లాగిన్: మీ రిజిస్టర్డ్ మొబైల్ నంబర్ మరియు పాస్‌వర్డ్ నమోదు చేసి 'లాగిన్' బటన్ నొక్కండి. మీ డ్యాష్‌బోర్డ్, కస్టమర్ రిక్వెస్ట్‌లు మరియు రేట్ కార్డ్ ఓపెన్ అవుతాయి.",
      hi: "सर्विस प्रोवाइडर लॉगिन: अपना पंजीकृत 10 अंकों का मोबाइल नंबर और पासवर्ड दर्ज करें। इसके बाद लॉगिन बटन दबाकर अपने कस्टमर बुकिंग और रेट कार्ड को देखें।",
      ta: "சேவை வழங்குநர் உள்நுழைவு: உங்கள் பதிவு செய்த மொபைல் எண் மற்றும் கடவுச்சொல்லை உள்ளிட்டு உள்நுழையவும். உங்கள் டேஷ்போர்டை அணுகலாம்."
    },
    providerSignup: {
      en: "Provider Registration: 1. Enter your name and mobile number. 2. Select your trade category like Electrician or Plumber. 3. Set your service area and travel radius. 4. Pin your workshop on the map. 5. Create a password. You can set custom prices in your rate card after registration.",
      te: "ప్రొవైడర్ రిజిస్ట్రేషన్: 1. మీ పేరు మరియు మొబైల్ నంబర్ నమోదు చేయండి. 2. మీ పని విభాగం (ఎలక్ట్రీషియన్, ప్లంబర్, ఏసీ రిపేర్) ఎంచుకోండి. 3. సర్వీస్ లొకేషన్ మరియు ట్రావెల్ రేడియస్ సెట్ చేయండి. 4. పాస్‌వర్డ్ సృష్టించండి. రిజిస్టర్ అయ్యాక మీ రేట్ కార్డులో ధరలను మీరే నిర్ణయించుకోవచ్చు.",
      hi: "सर्विस प्रोवाइडर पंजीकरण: 1. अपना नाम और मोबाइल नंबर दर्ज करें। 2. अपनी कार्य श्रेणी (इलेक्ट्रीशियन, प्लंबर आदि) चुनें। 3. अपनी कार्य सीमा और सेवा दायरा सेट करें। 4. पासवर्ड बनाएं। पंजीकरण के बाद आप अपने रेट कार्ड में अपनी कीमतें खुद निर्धारित कर सकते हैं।",
      ta: "சேவை வழங்குநர் பதிவு: உங்கள் பெயர், மொபைல் எண், சேவை வகை, பணி அனுபவம் மற்றும் முகவரியை உள்ளிட்டு பதிவு செய்யவும்."
    },
    passwordPolicy: {
      en: "Password Security Rules: Must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one special character like @ or #.",
      te: "పాస్‌వర్డ్ నిబంధనలు: కనీసం 8 అక్షరాలు ఉండాలి. ఒక పెద్ద అక్షరం, ఒక చిన్న అక్షరం, ఒక నంబర్ మరియు ఒక స్పెషల్ సింబల్ (@, #, $ వంటివి) తప్పనిసరి.",
      hi: "पासवर्ड सुरक्षा नियम: पासवर्ड कम से कम 8 अक्षरों का होना चाहिए, जिसमें कम से कम एक बड़ा अक्षर, एक छोटा अक्षर, एक नंबर और एक विशेष चिह्न (@, #, $ आदि) होना अनिवार्य है।",
      ta: "கடவுச்சொல் விதிகள்: குறைந்தது 8 எழுத்துக்கள், ஒரு பெரிய எழுத்து, ஒரு சிறிய எழுத்து, ஒரு எண் மற்றும் ஒரு சிறப்பு குறியீடு இருக்க வேண்டும்."
    }
  };

  // Field-specific contextual voice tips
  const FIELD_GUIDE_SCRIPTS = {
    custSignupName: {
      en: "Enter your full name so service technicians know who to address when they arrive.",
      te: "మీ పూర్తి పేరు నమోదు చేయండి. టెక్నీషియన్లు వచ్చినప్పుడు మిమ్మల్ని సంప్రదించడానికి ఇది అవసరం.",
      hi: "अपना पूरा नाम दर्ज करें ताकि तकनीशियन आपके पते पर पहुँचकर आपसे संपर्क कर सकें।"
    },
    custSignupMobile: {
      en: "Enter your 10-digit mobile number. You will receive booking notifications and direct calls from specialists.",
      te: "మీ 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి. దీనికి బుకింగ్ నోటిఫికేషన్లు మరియు కాల్స్ వస్తాయి.",
      hi: "अपना 10 अंकों का मोबाइल नंबर दर्ज करें। इसी पर बुकिंग अपडेट और तकनीशियन के कॉल आएँगे।"
    },
    custSignupEmail: {
      en: "Enter your email address to receive digital booking confirmations and repair receipts.",
      te: "మీ ఈమెయిల్ అడ్రస్ నమోదు చేయండి. డిజిటల్ రిసిప్ట్‌ల కోసం ఇది ఉపయోగపడుతుంది.",
      hi: "अपना ईमेल पता दर्ज करें ताकि आपको डिजिटल इनवॉइस और रसीद मिल सके।"
    },
    custLocAddress: {
      en: "Enter your village, town, or landmark, or click 'Use Current GPS' to automatically locate your doorstep.",
      te: "మీ గ్రామం లేదా వీధి పేరు నమోదు చేయండి, లేదా నేరుగా 'Use Current GPS' నొక్కండి.",
      hi: "अपने गाँव, शहर या लैंडमार्क का नाम दर्ज करें, या 'Use Current GPS' बटन दबाएं।"
    },
    custSignupPass: {
      en: "Create a password of at least 8 characters with an uppercase letter, a number, and a symbol.",
      te: "కనీసం 8 అక్షరాలు, క్యాపిటల్ లెటర్, నంబర్ మరియు స్పెషల్ క్యారెక్టర్‌తో పాస్‌వర్డ్ సృష్టించండి.",
      hi: "कम से कम 8 अक्षरों का पासवर्ड बनाएं जिसमें बड़ा अक्षर, नंबर और सिंबल शामिल हो।"
    },
    custSignupPassConfirm: {
      en: "Re-enter the exact same password to confirm.",
      te: "ధృవీకరించడానికి అదే పాస్‌వర్డ్‌ను మళ్ళీ నమోదు చేయండి.",
      hi: "पुष्टि करने के लिए वही पासवर्ड दोबारा दर्ज करें।"
    },
    provSignupName: {
      en: "Enter your professional name or workshop business trade name.",
      te: "మీ పేరు లేదా మీ షాపు లేదా వర్క్‌షాప్ పేరు నమోదు చేయండి.",
      hi: "अपना पेशेवर नाम या वर्कशॉप का व्यावसायिक नाम दर्ज करें।"
    },
    provSignupMobile: {
      en: "Enter your 10-digit mobile number. Customers in your service radius will call you directly on this number.",
      te: "మీ 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి. కస్టమర్లు నేరుగా ఈ నంబర్‌కే కాల్ చేస్తారు.",
      hi: "अपना 10 अंकों का मोबाइल नंबर दर्ज करें। ग्राहक सीधे इसी नंबर पर आपको कॉल करेंगे।"
    },
    provSignupCategory: {
      en: "Select your primary trade category, such as Electrician, Plumber, AC Repair, Beautician, or Mechanic.",
      te: "మీరు చేసే ప్రధాన పనిని ఎంచుకోండి: ఎలక్ట్రీషియన్, ప్లంబర్, ఏసీ రిపేర్, బ్యూటీషియన్ లేదా మెకానిక్.",
      hi: "अपनी मुख्य कार्य श्रेणी चुनें, जैसे कि इलेक्ट्रीशियन, प्लंबर, एसी रिपेयर, ब्यूटीशियन या मैकेनिक।"
    },
    provTravelRadius: {
      en: "Select your travel radius in kilometers. You will only receive customer booking requests within this area.",
      te: "మీ ప్రయాణ దూరాన్ని (కిలోమీటర్లలో) ఎంచుకోండి. ఈ పరిధిలోనే మీకు పనులు వస్తాయి.",
      hi: "अपना सेवा दायरा (किलोमीटर में) चुनें। आपको केवल इसी क्षेत्र के कस्टमर रिक्वेस्ट मिलेंगे।"
    },
    provAddress: {
      en: "Enter your workshop or home address, or click 'Use Current GPS' to pinpoint your base location on the map.",
      te: "మీ వర్క్‌షాప్ లేదా ఇంటి అడ్రస్ నమోదు చేయండి, లేదా 'Use Current GPS' నొక్కండి.",
      hi: "अपने वर्कशॉप का पता दर्ज करें, या 'Use Current GPS' पर टैप करें।"
    },
    provSignupPass: {
      en: "Create a secure password with at least 8 characters, an uppercase letter, a number, and a symbol.",
      te: "8 అక్షరాలు, పెద్ద అక్షరం, నంబర్ మరియు సింబల్‌తో పాస్‌వర్డ్ సృష్టించండి.",
      hi: "8 अक्षरों का सुरक्षित पासवर्ड बनाएं जिसमें बड़ा अक्षर, नंबर और सिंबल हो।"
    }
  };

  /**
   * Determine current active form context on auth.html
   */
  function getCurrentAuthContext() {
    const roleView = document.getElementById('roleSelectionView');
    const custView = document.getElementById('customerAuthView');
    const provView = document.getElementById('providerAuthView');

    if (roleView && roleView.style.display !== 'none') {
      return 'roleSelection';
    }

    if (custView && custView.style.display !== 'none') {
      const loginForm = document.getElementById('customerLoginForm');
      return (loginForm && loginForm.style.display !== 'none') ? 'customerLogin' : 'customerSignup';
    }

    if (provView && provView.style.display !== 'none') {
      const loginForm = document.getElementById('providerLoginForm');
      return (loginForm && loginForm.style.display !== 'none') ? 'providerLogin' : 'providerSignup';
    }

    return 'customerLogin';
  }

  /**
   * Update the guide text in UI based on current view and language
   */
  function updateGuideText(speakAfterUpdate = false, customText = null) {
    let text = customText;
    if (!text) {
      const context = getCurrentAuthContext();
      const scripts = AUTH_VOICE_SCRIPTS[context] || AUTH_VOICE_SCRIPTS.customerLogin;
      text = scripts[currentLang] || scripts.en;
    }

    const textEl = document.getElementById('authVoiceSpeechContent');
    if (textEl) {
      textEl.textContent = text;
    }

    if (speakAfterUpdate) {
      speakText(text);
    }
  }

  /**
   * Speech Synthesis (Text to Speech)
   */
  function speakText(text) {
    if (!('speechSynthesis' in window)) {
      if (window.FixNow && window.FixNow.showToast) {
        window.FixNow.showToast('Audio synthesis not supported by this browser.', 'warning');
      }
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    if (currentLang === 'te') {
      utterance.lang = 'te-IN';
      utterance.rate = 0.9;
    } else if (currentLang === 'hi') {
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
    } else if (currentLang === 'ta') {
      utterance.lang = 'ta-IN';
      utterance.rate = 0.9;
    } else {
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
    }

    utterance.onstart = function () {
      isSpeaking = true;
      togglePlayStopButtons(true);
    };

    utterance.onend = function () {
      isSpeaking = false;
      togglePlayStopButtons(false);
    };

    utterance.onerror = function () {
      isSpeaking = false;
      togglePlayStopButtons(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    togglePlayStopButtons(false);
  }

  function togglePlayStopButtons(speaking) {
    const playBtn = document.getElementById('btnPlayAuthVoice');
    const stopBtn = document.getElementById('btnStopAuthVoice');
    if (playBtn) {
      playBtn.innerHTML = speaking ? '<span>🔊</span> Playing Guide...' : '<span>🔊</span> Listen to Voice Guide';
      if (speaking) playBtn.classList.add('btn-success');
      else playBtn.classList.remove('btn-success');
    }
    if (stopBtn) {
      stopBtn.style.display = speaking ? 'inline-flex' : 'none';
    }
  }

  /**
   * Set Active Language
   */
  function setLanguage(lang, autoSpeak = true) {
    currentLang = lang;

    const btns = {
      en: document.getElementById('btnAuthLangEn'),
      te: document.getElementById('btnAuthLangTe'),
      hi: document.getElementById('btnAuthLangHi'),
      ta: document.getElementById('btnAuthLangTa')
    };

    Object.entries(btns).forEach(([k, btn]) => {
      if (btn) {
        if (k === lang) {
          btn.classList.add('active-lang', 'btn-primary');
          btn.classList.remove('btn-secondary');
        } else {
          btn.classList.remove('active-lang', 'btn-primary');
          btn.classList.add('btn-secondary');
        }
      }
    });

    updateGuideText(autoSpeak);
  }

  /**
   * Speech Recognition (Speech to Text)
   */
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = function () {
      isListening = true;
      const micBtn = document.getElementById('btnMicAuthVoice');
      if (micBtn) {
        micBtn.innerHTML = '<span>🎙️</span> Listening... Speak now';
        micBtn.style.background = '#dc2626';
        micBtn.style.color = 'white';
      }
      showTranscriptRow('Listening...');
    };

    rec.onresult = function (event) {
      const transcript = event.results[0][0].transcript.trim();
      handleVoiceCommand(transcript);
    };

    rec.onerror = function (event) {
      console.warn('Speech recognition notice:', event.error);
      resetMicButton();
      showTranscriptRow('Could not hear clearly. Please try again.');
    };

    rec.onend = function () {
      resetMicButton();
    };

    return rec;
  }

  function resetMicButton() {
    isListening = false;
    const micBtn = document.getElementById('btnMicAuthVoice');
    if (micBtn) {
      micBtn.innerHTML = '<span>🎙️</span> Speak Voice Command';
      micBtn.style.background = '';
      micBtn.style.color = '';
    }
  }

  function showTranscriptRow(text) {
    const row = document.getElementById('authVoiceLiveTranscriptRow');
    const span = document.getElementById('authVoiceLiveTranscript');
    if (row && span) {
      row.style.display = 'block';
      span.textContent = text;
    }
  }

  function toggleMic() {
    if (isSpeaking) {
      stopSpeaking();
    }

    if (!recognition) {
      recognition = initSpeechRecognition();
    }

    if (!recognition) {
      if (window.FixNow && window.FixNow.showToast) {
        window.FixNow.showToast('Microphone speech recognition not supported in this browser.', 'warning');
      }
      return;
    }

    if (isListening) {
      recognition.stop();
      resetMicButton();
    } else {
      try {
        if (currentLang === 'te') recognition.lang = 'te-IN';
        else if (currentLang === 'hi') recognition.lang = 'hi-IN';
        else if (currentLang === 'ta') recognition.lang = 'ta-IN';
        else recognition.lang = 'en-IN';
        recognition.start();
      } catch (e) {
        console.warn('Recognition start note:', e);
      }
    }
  }

  /**
   * Handle Spoken Voice Commands on Auth Screen
   */
  function handleVoiceCommand(rawText) {
    showTranscriptRow(rawText);
    const text = rawText.toLowerCase();

    // 1. Language switching
    if (text.includes('telugu') || text.includes('తెలుగు')) {
      setLanguage('te', true);
      return;
    }
    if (text.includes('hindi') || text.includes('हिंदी')) {
      setLanguage('hi', true);
      return;
    }
    if (text.includes('tamil') || text.includes('தமிழ்')) {
      setLanguage('ta', true);
      return;
    }
    if (text.includes('english')) {
      setLanguage('en', true);
      return;
    }

    // 2. Switch to Signup / Register
    if (
      text.includes('register') || text.includes('signup') || text.includes('sign up') ||
      text.includes('new account') || text.includes('కొత్త ఖాతా') || text.includes('రిజిస్టర్') ||
      text.includes('సైన్ అప్') || text.includes('रजिस्ट्रेशन') || text.includes('खाता बनाएं')
    ) {
      const context = getCurrentAuthContext();
      if (context === 'roleSelection') {
        window.FixNowAuthUI.showCustomerView();
      }
      if (document.getElementById('customerAuthView').style.display !== 'none') {
        window.FixNowAuthUI.setCustomerTab('signup');
      } else if (document.getElementById('providerAuthView').style.display !== 'none') {
        window.FixNowAuthUI.setProviderTab('signup');
      }
      updateGuideText(true);
      return;
    }

    // 3. Switch to Login
    if (
      text.includes('login') || text.includes('log in') || text.includes('sign in') ||
      text.includes('signin') || text.includes('లాగిన్') || text.includes('लॉगिन')
    ) {
      const context = getCurrentAuthContext();
      if (context === 'roleSelection') {
        window.FixNowAuthUI.showCustomerView();
      }
      if (document.getElementById('customerAuthView').style.display !== 'none') {
        window.FixNowAuthUI.setCustomerTab('login');
      } else if (document.getElementById('providerAuthView').style.display !== 'none') {
        window.FixNowAuthUI.setProviderTab('login');
      }
      updateGuideText(true);
      return;
    }

    // 4. Role: Customer
    if (text.includes('customer') || text.includes('కస్టమర్') || text.includes('ग्राहक') || text.includes('कस्टमर')) {
      window.FixNowAuthUI.showCustomerView();
      updateGuideText(true);
      return;
    }

    // 5. Role: Provider
    if (text.includes('provider') || text.includes('technician') || text.includes('mechanic') || text.includes('ప్రొవైడర్') || text.includes('प्रदाता') || text.includes('कारीगर')) {
      window.FixNowAuthUI.showProviderView();
      updateGuideText(true);
      return;
    }

    // 6. Password Policy Inquiries
    if (text.includes('password') || text.includes('rules') || text.includes('పాస్‌వర్డ్') || text.includes('पासवर्ड')) {
      const pText = AUTH_VOICE_SCRIPTS.passwordPolicy[currentLang] || AUTH_VOICE_SCRIPTS.passwordPolicy.en;
      updateGuideText(true, pText);
      return;
    }

    // 7. GPS & Location Inquiries
    if (text.includes('gps') || text.includes('location') || text.includes('map') || text.includes('లొకేషన్') || text.includes('स्थान')) {
      const locTip = currentLang === 'te' ?
        "లొకేషన్ పిన్ చేయడానికి: 'Use Current GPS' బటన్ నొక్కండి, లేదా మీ వీధి/గ్రామం పేరును నమోదు చేయండి. మ్యాప్‌లోని పిన్‌ను మీ ఇంటి వద్దకు లాగి ఉంచవచ్చు." :
        currentLang === 'hi' ?
        "लोकेशन सेट करने के लिए: 'Use Current GPS' बटन दबाएं, या अपने गाँव या मोहल्ले का नाम लिखें। आप मैप पर पिन को अपने घर तक ड्रैग कर सकते हैं।" :
        "To set your location: Click 'Use Current GPS' to detect your coordinates, or type your locality. You can also drag the pin on the map directly to your doorstep.";
      updateGuideText(true, locTip);
      return;
    }

    // 8. Role Selection / Back
    if (text.includes('back') || text.includes('change role') || text.includes('రోల్') || text.includes('रोल')) {
      window.FixNowAuthUI.showRoleSelection();
      updateGuideText(true);
      return;
    }

    // Default: Explain current screen instructions
    speakCurrentGuide();
  }

  /**
   * Bind field focus listeners to provide interactive real-time guidance
   */
  function bindFieldFocusGuides() {
    Object.keys(FIELD_GUIDE_SCRIPTS).forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.addEventListener('focus', function () {
          const fieldTips = FIELD_GUIDE_SCRIPTS[fieldId];
          const tip = fieldTips[currentLang] || fieldTips.en;
          updateGuideText(false, `💡 ${tip}`);
        });
      }
    });
  }

  // Export methods
  window.FixNowAuthVoice = {
    setLanguage: setLanguage,
    speakCurrentGuide: function () {
      updateGuideText(true);
    },
    stopSpeaking: stopSpeaking,
    toggleMic: toggleMic,
    onViewOrTabChange: function () {
      updateGuideText(false);
    }
  };

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    setLanguage('en', false);
    bindFieldFocusGuides();
  });
})();
