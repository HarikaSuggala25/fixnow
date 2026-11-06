const translations = {
  en: {
    languageLabel: 'Language', eyebrow: 'A community listening project', title: 'FixNow - Local Service User Requirement Survey',
    description: 'This survey is conducted to understand the problems, needs and preferences of users when finding and booking local service providers.',
    progress: 'Question {current} of {total}', previous: 'Previous', next: 'Next', submit: 'Submit Survey',
    validation: 'Please answer this question before continuing.', selectAllHint: 'Select all that apply.',
    ratingLow: 'Not important', ratingHigh: 'Very important',
    successTitle: 'Thank you for participating in the FixNow survey!', successCopy: 'Your response has been recorded successfully.',
    saveError: 'Your response could not be saved in this browser. Please try again.', footer: 'FixNow · Local help, made easier to find.',
    questions: {
      q1: { text: 'Have you faced any problem when trying to quickly find and book a repairer, mechanic, beautician, or other local service provider while comparing their ratings and prices?', options: { Yes: 'Yes', No: 'No' } },
      q2: { text: 'When using existing service applications, do you find the login or registration process easy to understand and use?', options: { Yes: 'Yes', No: 'No' } },
      q3: { text: 'How do you feel about adding a feature that maintains the lifetime and service history of your household equipment in the application?', detail: 'Example equipment:\nAC, refrigerator, washing machine, TV, RO/water purifier, etc.', options: { 'Good feature': 'Good feature', 'Better and useful feature': 'Better and useful feature', 'One of the best and most innovative features to implement': 'One of the best and most innovative features to implement' } },
      q4: { text: 'What other features or needs would you like to have in an application for finding and booking local service providers?', options: { GPS: 'Find nearby service providers using GPS', Ratings: 'Compare ratings and reviews', Prices: 'Compare service prices', Voice: 'Voice assistance in my preferred language', Login: 'Easy login and registration', Call: 'Call the service provider', Chat: 'Chat with the service provider', Tracking: 'Track booking status', History: 'Save previous service history', Reminders: 'Get household equipment maintenance reminders', Other: 'Other', All: 'All of the above' } },
      q5: { text: 'Which local service do you need most frequently?', options: { 'AC Repair/Service': 'AC Repair/Service', 'Beautician/Salon': 'Beautician/Salon', Mechanic: 'Mechanic', Carpenter: 'Carpenter', Plumber: 'Plumber', Electrician: 'Electrician', Painter: 'Painter', 'Refrigerator Repair': 'Refrigerator Repair', 'Washing Machine Repair': 'Washing Machine Repair', 'TV Repair': 'TV Repair', 'RO/Water Purifier Service': 'RO/Water Purifier Service', 'General Labour': 'General Labour', 'All of the above / Different services depending on the need': 'All of the above / Different services depending on the need', Other: 'Other' } },
      q6: { text: 'How important is it for you to find a service provider near your current location?' },
      q7: { text: 'How important are ratings and reviews when choosing a local service provider?' },
      q8: { text: 'Would you prefer a voice assistant that helps you search and book a service in your preferred language?', options: { Yes: 'Yes', Maybe: 'Maybe', No: 'No' } },
      q9: { text: 'Which way would you prefer to interact with the service-finding system?', options: { Typing: 'Typing', 'Speaking/Voice': 'Speaking/Voice', 'Both typing and voice': 'Both typing and voice', 'Simple buttons/icons': 'Simple buttons/icons' } },
      q10: { text: 'Would you use an application like FixNow to find and book trusted local service providers?', options: { 'Definitely yes': 'Definitely yes', 'Probably yes': 'Probably yes', Maybe: 'Maybe', 'Probably not': 'Probably not', 'Definitely not': 'Definitely not' } }
    }
  },
  te: {
    languageLabel: 'భాష', eyebrow: 'సమాజ అభిప్రాయాల సేకరణ', title: 'FixNow – స్థానిక సేవల వినియోగదారుల అవసరాల సర్వే',
    description: 'స్థానిక సేవా ప్రదాతలను వెతికి బుక్ చేసుకునేటప్పుడు వినియోగదారులు ఎదుర్కొనే సమస్యలు, అవసరాలు మరియు అభిరుచులను తెలుసుకోవడానికి ఈ సర్వే నిర్వహించబడుతోంది.',
    progress: 'ప్రశ్న {current} / {total}', previous: 'మునుపటి', next: 'తదుపరి', submit: 'సర్వేను సమర్పించండి',
    validation: 'కొనసాగించే ముందు దయచేసి ఈ ప్రశ్నకు సమాధానం ఇవ్వండి.', selectAllHint: 'వర్తించే అన్నింటినీ ఎంచుకోండి.',
    ratingLow: 'ముఖ్యమైనది కాదు', ratingHigh: 'చాలా ముఖ్యమైనది',
    successTitle: 'FixNow సర్వేలో పాల్గొన్నందుకు ధన్యవాదాలు!', successCopy: 'మీ సమాధానం విజయవంతంగా నమోదు చేయబడింది.',
    saveError: 'ఈ బ్రౌజర్‌లో మీ సమాధానాన్ని సేవ్ చేయలేకపోయాం. దయచేసి మళ్లీ ప్రయత్నించండి.', footer: 'FixNow · స్థానిక సేవలను సులభంగా కనుగొనండి.',
    questions: {
      q1: { text: 'రేటింగ్‌లు మరియు ధరలను పోల్చుకుంటూ రిపేరర్, మెకానిక్, బ్యూటీషియన్ లేదా ఇతర స్థానిక సేవా ప్రదాతను త్వరగా కనుగొని బుక్ చేసేటప్పుడు మీరు ఎప్పుడైనా సమస్యను ఎదుర్కొన్నారా?', options: { Yes: 'అవును', No: 'కాదు' } },
      q2: { text: 'ప్రస్తుతం ఉన్న సేవా అప్లికేషన్‌లను ఉపయోగించేటప్పుడు, లాగిన్ లేదా రిజిస్ట్రేషన్ ప్రక్రియను అర్థం చేసుకుని ఉపయోగించడం మీకు సులభంగా అనిపిస్తుందా?', options: { Yes: 'అవును', No: 'కాదు' } },
      q3: { text: 'మీ ఇంట్లోని పరికరాల జీవితకాలం మరియు సర్వీస్ చరిత్రను అప్లికేషన్‌లో నిర్వహించే ఫీచర్‌ను జోడించడం గురించి మీ అభిప్రాయం ఏమిటి?', detail: 'ఉదాహరణ పరికరాలు:\nAC, ఫ్రిజ్, వాషింగ్ మెషీన్, TV, RO/వాటర్ ప్యూరిఫైయర్ మొదలైనవి.', options: { 'Good feature': 'మంచి ఫీచర్', 'Better and useful feature': 'మెరుగైన మరియు ఉపయోగకరమైన ఫీచర్', 'One of the best and most innovative features to implement': 'అమలు చేయడానికి అత్యుత్తమ మరియు వినూత్నమైన ఫీచర్లలో ఒకటి' } },
      q4: { text: 'స్థానిక సేవా ప్రదాతలను కనుగొని బుక్ చేసుకునే అప్లికేషన్‌లో మీరు ఇంకా ఏ ఫీచర్లు లేదా సదుపాయాలు కోరుకుంటున్నారు?', options: { GPS: 'GPS ద్వారా సమీపంలోని సేవా ప్రదాతలను కనుగొనడం', Ratings: 'రేటింగ్‌లు మరియు సమీక్షలను పోల్చడం', Prices: 'సేవా ధరలను పోల్చడం', Voice: 'నా ఇష్టమైన భాషలో వాయిస్ సహాయం', Login: 'సులభమైన లాగిన్ మరియు రిజిస్ట్రేషన్', Call: 'సేవా ప్రదాతకు కాల్ చేయడం', Chat: 'సేవా ప్రదాతతో చాట్ చేయడం', Tracking: 'బుకింగ్ స్థితిని తెలుసుకోవడం', History: 'గత సర్వీస్ చరిత్రను సేవ్ చేయడం', Reminders: 'ఇంటి పరికరాల నిర్వహణ రిమైండర్‌లు పొందడం', Other: 'ఇతర', All: 'పైవన్నీ' } },
      q5: { text: 'మీకు ఎక్కువగా అవసరమయ్యే స్థానిక సేవ ఏది?', options: { 'AC Repair/Service': 'AC రిపేర్/సర్వీస్', 'Beautician/Salon': 'బ్యూటీషియన్/సెలూన్', Mechanic: 'మెకానిక్', Carpenter: 'కార్పెంటర్', Plumber: 'ప్లంబర్', Electrician: 'ఎలక్ట్రీషియన్', Painter: 'పెయింటర్', 'Refrigerator Repair': 'ఫ్రిజ్ రిపేర్', 'Washing Machine Repair': 'వాషింగ్ మెషీన్ రిపేర్', 'TV Repair': 'TV రిపేర్', 'RO/Water Purifier Service': 'RO/వాటర్ ప్యూరిఫైయర్ సర్వీస్', 'General Labour': 'సాధారణ కార్మిక సేవ', 'All of the above / Different services depending on the need': 'పైవన్నీ / అవసరాన్ని బట్టి వివిధ సేవలు', Other: 'ఇతర' } },
      q6: { text: 'మీ ప్రస్తుత స్థానానికి దగ్గరలో సేవా ప్రదాతను కనుగొనడం మీకు ఎంత ముఖ్యమైనది?' },
      q7: { text: 'స్థానిక సేవా ప్రదాతను ఎంచుకునేటప్పుడు రేటింగ్‌లు మరియు సమీక్షలు మీకు ఎంత ముఖ్యమైనవి?' },
      q8: { text: 'మీకు ఇష్టమైన భాషలో సేవను వెతికి బుక్ చేసుకోవడానికి సహాయపడే వాయిస్ అసిస్టెంట్‌ను మీరు ఇష్టపడతారా?', options: { Yes: 'అవును', Maybe: 'కావచ్చు', No: 'కాదు' } },
      q9: { text: 'సేవలను కనుగొనే వ్యవస్థతో మీరు ఏ విధంగా మాట్లాడటానికి ఇష్టపడతారు?', options: { Typing: 'టైప్ చేయడం', 'Speaking/Voice': 'మాట్లాడటం/వాయిస్', 'Both typing and voice': 'టైపింగ్ మరియు వాయిస్ రెండూ', 'Simple buttons/icons': 'సులభమైన బటన్లు/ఐకాన్‌లు' } },
      q10: { text: 'నమ్మకమైన స్థానిక సేవా ప్రదాతలను కనుగొని బుక్ చేసుకోవడానికి FixNow వంటి అప్లికేషన్‌ను మీరు ఉపయోగిస్తారా?', options: { 'Definitely yes': 'ఖచ్చితంగా అవును', 'Probably yes': 'బహుశా అవును', Maybe: 'కావచ్చు', 'Probably not': 'బహుశా కాదు', 'Definitely not': 'ఖచ్చితంగా కాదు' } }
    }
  },
  ta: {
    languageLabel: 'மொழி', eyebrow: 'சமூகக் கருத்தறிதல்', title: 'FixNow – உள்ளூர் சேவை பயனர் தேவைகள் கணக்கெடுப்பு',
    description: 'உள்ளூர் சேவை வழங்குநர்களைத் தேடுவதிலும் முன்பதிவு செய்வதிலும் பயனர்கள் எதிர்கொள்ளும் பிரச்சினைகள், தேவைகள் மற்றும் விருப்பங்களைப் புரிந்துகொள்ள இந்தக் கணக்கெடுப்பு நடத்தப்படுகிறது.',
    progress: 'கேள்வி {current} / {total}', previous: 'முந்தையது', next: 'அடுத்து', submit: 'கணக்கெடுப்பை சமர்ப்பிக்கவும்',
    validation: 'தொடர்வதற்கு முன் இந்தக் கேள்விக்கு பதிலளிக்கவும்.', selectAllHint: 'பொருந்தும் அனைத்தையும் தேர்ந்தெடுக்கவும்.',
    ratingLow: 'முக்கியமில்லை', ratingHigh: 'மிகவும் முக்கியமானது',
    successTitle: 'FixNow கணக்கெடுப்பில் பங்கேற்றதற்கு நன்றி!', successCopy: 'உங்கள் பதில் வெற்றிகரமாக பதிவு செய்யப்பட்டது.',
    saveError: 'இந்த உலாவியில் உங்கள் பதிலைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', footer: 'FixNow · உள்ளூர் சேவைகளை எளிதாகக் கண்டறியுங்கள்.',
    questions: {
      q1: { text: 'மதிப்பீடுகள் மற்றும் விலைகளை ஒப்பிட்டு, பழுதுபார்ப்பாளர், மெக்கானிக், பியூட்டிஷியன் அல்லது பிற உள்ளூர் சேவை வழங்குநரை விரைவாகக் கண்டறிந்து முன்பதிவு செய்யும்போது நீங்கள் ஏதேனும் சிக்கலை எதிர்கொண்டுள்ளீர்களா?', options: { Yes: 'ஆம்', No: 'இல்லை' } },
      q2: { text: 'தற்போதுள்ள சேவை பயன்பாடுகளைப் பயன்படுத்தும்போது, உள்நுழைவு அல்லது பதிவு செய்யும் செயல்முறையைப் புரிந்துகொண்டு பயன்படுத்துவது உங்களுக்கு எளிதாக உள்ளதா?', options: { Yes: 'ஆம்', No: 'இல்லை' } },
      q3: { text: 'உங்கள் வீட்டில் உள்ள சாதனங்களின் ஆயுட்காலம் மற்றும் சேவை வரலாற்றைப் பயன்பாட்டில் பதிவு செய்து பராமரிக்கும் அம்சத்தைச் சேர்ப்பது பற்றி உங்கள் கருத்து என்ன?', detail: 'உதாரண சாதனங்கள்:\nAC, குளிர்சாதனப் பெட்டி, வாஷிங் மெஷின், TV, RO/நீர் சுத்திகரிப்பான் போன்றவை.', options: { 'Good feature': 'நல்ல அம்சம்', 'Better and useful feature': 'சிறந்த மற்றும் பயனுள்ள அம்சம்', 'One of the best and most innovative features to implement': 'செயல்படுத்தக்கூடிய சிறந்த மற்றும் புதுமையான அம்சங்களில் ஒன்று' } },
      q4: { text: 'உள்ளூர் சேவை வழங்குநர்களைக் கண்டறிந்து முன்பதிவு செய்யும் பயன்பாட்டில் நீங்கள் வேறு எந்த அம்சங்கள் அல்லது தேவைகளை விரும்புகிறீர்கள்?', options: { GPS: 'GPS மூலம் அருகிலுள்ள சேவை வழங்குநர்களைக் கண்டறிதல்', Ratings: 'மதிப்பீடுகள் மற்றும் விமர்சனங்களை ஒப்பிடுதல்', Prices: 'சேவை விலைகளை ஒப்பிடுதல்', Voice: 'எனது விருப்பமான மொழியில் குரல் உதவி', Login: 'எளிதான உள்நுழைவு மற்றும் பதிவு', Call: 'சேவை வழங்குநரை அழைத்தல்', Chat: 'சேவை வழங்குநருடன் அரட்டை செய்தல்', Tracking: 'முன்பதிவு நிலையை கண்காணித்தல்', History: 'முந்தைய சேவை வரலாற்றை சேமித்தல்', Reminders: 'வீட்டு சாதனங்களுக்கான பராமரிப்பு நினைவூட்டல்களைப் பெறுதல்', Other: 'மற்றவை', All: 'மேலே உள்ள அனைத்தும்' } },
      q5: { text: 'உங்களுக்கு அடிக்கடி தேவைப்படும் உள்ளூர் சேவை எது?', options: { 'AC Repair/Service': 'AC பழுதுபார்ப்பு/சேவை', 'Beautician/Salon': 'பியூட்டிஷியன்/சலூன்', Mechanic: 'மெக்கானிக்', Carpenter: 'கார்பெண்டர்', Plumber: 'பிளம்பர்', Electrician: 'எலக்ட்ரீஷியன்', Painter: 'பெயிண்டர்', 'Refrigerator Repair': 'குளிர்சாதனப் பெட்டி பழுதுபார்ப்பு', 'Washing Machine Repair': 'வாஷிங் மெஷின் பழுதுபார்ப்பு', 'TV Repair': 'TV பழுதுபார்ப்பு', 'RO/Water Purifier Service': 'RO/நீர் சுத்திகரிப்பான் சேவை', 'General Labour': 'பொதுத் தொழிலாளர் சேவை', 'All of the above / Different services depending on the need': 'மேலே உள்ள அனைத்தும் / தேவைக்கேற்ப வெவ்வேறு சேவைகள்', Other: 'மற்றவை' } },
      q6: { text: 'உங்கள் தற்போதைய இருப்பிடத்திற்கு அருகில் சேவை வழங்குநரைக் கண்டறிவது உங்களுக்கு எவ்வளவு முக்கியமானது?' },
      q7: { text: 'உள்ளூர் சேவை வழங்குநரைத் தேர்ந்தெடுக்கும்போது மதிப்பீடுகள் மற்றும் விமர்சனங்கள் உங்களுக்கு எவ்வளவு முக்கியம்?' },
      q8: { text: 'உங்கள் விருப்பமான மொழியில் சேவையைத் தேடி முன்பதிவு செய்ய உதவும் குரல் உதவியாளரை நீங்கள் விரும்புகிறீர்களா?', options: { Yes: 'ஆம்', Maybe: 'இருக்கலாம்', No: 'இல்லை' } },
      q9: { text: 'சேவை கண்டறியும் அமைப்புடன் நீங்கள் எந்த முறையில் தொடர்புகொள்ள விரும்புகிறீர்கள்?', options: { Typing: 'தட்டச்சு செய்தல்', 'Speaking/Voice': 'பேசுதல்/குரல்', 'Both typing and voice': 'தட்டச்சு மற்றும் குரல் இரண்டும்', 'Simple buttons/icons': 'எளிய பொத்தான்கள்/ஐகான்கள்' } },
      q10: { text: 'நம்பகமான உள்ளூர் சேவை வழங்குநர்களைக் கண்டறிந்து முன்பதிவு செய்ய FixNow போன்ற பயன்பாட்டைப் பயன்படுத்துவீர்களா?', options: { 'Definitely yes': 'நிச்சயமாக ஆம்', 'Probably yes': 'ஒருவேளை ஆம்', Maybe: 'இருக்கலாம்', 'Probably not': 'ஒருவேளை இல்லை', 'Definitely not': 'நிச்சயமாக இல்லை' } }
    }
  }
};

const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];
const checkboxIds = ['GPS', 'Ratings', 'Prices', 'Voice', 'Login', 'Call', 'Chat', 'Tracking', 'History', 'Reminders'];
const answers = Object.fromEntries(questionIds.map((id) => [id, id === 'q4' ? [] : null]));
const el = {
  language: document.querySelector('#language-select'), survey: document.querySelector('#survey-panel'), success: document.querySelector('#success-panel'),
  title: document.querySelector('#survey-title'), description: document.querySelector('#survey-description'), progress: document.querySelector('#progress-text'),
  percent: document.querySelector('#progress-percent'), track: document.querySelector('#progress-track'), fill: document.querySelector('#progress-fill'),
  content: document.querySelector('#question-content'), validation: document.querySelector('#validation-message'), previous: document.querySelector('#previous-button'),
  next: document.querySelector('#next-button'), submit: document.querySelector('#submit-button'), successTitle: document.querySelector('#success-title'), successCopy: document.querySelector('#success-copy')
};
let language = 'en';
let currentQuestion = 0;
const t = () => translations[language];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function renderStaticText() {
  document.documentElement.lang = language;
  document.title = t().title;
  el.title.textContent = t().title;
  el.description.textContent = t().description;
  el.language.setAttribute('aria-label', t().languageLabel);
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t()[node.dataset.i18n]; });
  el.previous.textContent = t().previous;
  el.next.textContent = t().next;
  el.submit.textContent = t().submit;
  el.successTitle.textContent = t().successTitle;
  el.successCopy.textContent = t().successCopy;
  renderQuestion();
}

function renderQuestion() {
  const id = questionIds[currentQuestion];
  const question = t().questions[id];
  const count = currentQuestion + 1;
  const percent = Math.round(count / questionIds.length * 100);
  const isLast = currentQuestion === questionIds.length - 1;
  el.progress.textContent = t().progress.replace('{current}', count).replace('{total}', questionIds.length);
  el.percent.textContent = `${percent}%`;
  el.track.setAttribute('aria-valuenow', String(count));
  el.track.setAttribute('aria-valuetext', el.progress.textContent);
  el.fill.style.width = `${percent}%`;
  el.previous.hidden = currentQuestion === 0;
  el.next.hidden = isLast;
  el.submit.hidden = !isLast;
  el.validation.textContent = '';

  const detail = question.detail
    ? `<p class="question-detail">${escapeHtml(question.detail)}</p>`
    : id === 'q4' ? `<p class="question-detail">${escapeHtml(t().selectAllHint)}</p>` : '';

  if (id === 'q6' || id === 'q7') {
    const choices = [1, 2, 3, 4, 5].map((value) => `<label class="option-item rating-item">
      <input type="radio" name="${id}" value="${value}"${answers[id] === value ? ' checked' : ''}>
      <span class="option-card"><span class="choice-indicator" aria-hidden="true"></span><span>${value}</span></span>
    </label>`).join('');
    el.content.innerHTML = `<fieldset class="question-fieldset" aria-describedby="validation-message">
      <legend class="question-title">${escapeHtml(question.text)}</legend><div class="rating-list">${choices}</div>
      <div class="rating-endpoints"><span>1 = ${escapeHtml(t().ratingLow)}</span><span>5 = ${escapeHtml(t().ratingHigh)}</span></div>
    </fieldset>`;
    return;
  }

  const multi = id === 'q4';
  const choices = Object.entries(question.options).map(([value, label]) => {
    const allChoice = value === 'All';
    const checked = multi
      ? allChoice ? checkboxIds.every((item) => answers.q4.includes(item)) : answers.q4.includes(value)
      : answers[id] === value;
    return `<label class="option-item"><input type="${multi ? 'checkbox' : 'radio'}" name="${multi ? `${id}[]` : id}" value="${allChoice ? '__all__' : escapeHtml(value)}"${checked ? ' checked' : ''}>
      <span class="option-card"><span class="choice-indicator" aria-hidden="true"></span><span>${escapeHtml(label)}</span></span></label>`;
  }).join('');
  el.content.innerHTML = `<fieldset class="question-fieldset" aria-describedby="validation-message">
    <legend class="question-title">${escapeHtml(question.text)}</legend>${detail}<div class="option-list">${choices}</div>
  </fieldset>`;
}

function hasAnswer(id) {
  return id === 'q4' ? answers.q4.length > 0 : answers[id] !== null && answers[id] !== '';
}

function showValidation() {
  el.validation.textContent = t().validation;
  el.content.querySelector('fieldset')?.setAttribute('aria-invalid', 'true');
  el.content.querySelector('input')?.focus();
}

function collectAnswer(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const id = questionIds[currentQuestion];
  if (id === 'q4') {
    if (input.value === '__all__') {
      answers.q4 = input.checked ? [...checkboxIds] : [];
    } else if (input.checked) {
      answers.q4 = [...new Set([...answers.q4, input.value])];
    } else {
      answers.q4 = answers.q4.filter((value) => value !== input.value);
    }
    renderQuestion();
  } else if (input.type === 'radio') {
    answers[id] = id === 'q6' || id === 'q7' ? Number(input.value) : input.value;
  }
  el.validation.textContent = '';
}

function moveNext() {
  if (!hasAnswer(questionIds[currentQuestion])) return showValidation();
  currentQuestion = Math.min(currentQuestion + 1, questionIds.length - 1);
  renderQuestion();
}

function movePrevious() {
  currentQuestion = Math.max(currentQuestion - 1, 0);
  renderQuestion();
}

function submitSurvey(event) {
  event.preventDefault();
  if (!hasAnswer(questionIds[currentQuestion])) return showValidation();
  const response = { language, timestamp: new Date().toISOString(), ...Object.fromEntries(questionIds.map((id) => [id, answers[id]])) };
  try {
    const saved = JSON.parse(localStorage.getItem('fixnow_survey_responses') || '[]');
    const responses = Array.isArray(saved) ? saved : [];
    responses.push(response);
    localStorage.setItem('fixnow_survey_responses', JSON.stringify(responses));
  } catch (error) {
    console.error('Unable to save FixNow survey response:', error);
    el.validation.textContent = t().saveError;
    return;
  }
  console.log('FixNow survey response:', response);
  el.survey.hidden = true;
  el.success.hidden = false;
}

el.language.addEventListener('change', (event) => {
  language = event.target.value;
  el.validation.textContent = '';
  renderStaticText();
});
el.content.addEventListener('change', collectAnswer);
el.next.addEventListener('click', moveNext);
el.previous.addEventListener('click', movePrevious);
document.querySelector('#survey-form').addEventListener('submit', submitSurvey);
renderStaticText();