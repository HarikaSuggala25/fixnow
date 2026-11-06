const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createMockElement(id, tag = 'div') {
  return {
    id: id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
      add: function () {},
      remove: function () {},
      contains: function () { return false; }
    },
    addEventListener: function () {},
    appendChild: function () {},
    focus: function () {}
  };
}

const mockElements = {};
const mockStorage = {};

const sandbox = {
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  window: { addEventListener: function () {} },
  addEventListener: function () {},
  location: { reload: function () {}, href: '' },
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
  },
  document: {
    getElementById: (id) => {
      if (!mockElements[id]) {
        mockElements[id] = createMockElement(id);
      }
      return mockElements[id];
    },
    querySelectorAll: (sel) => [],
    createElement: (tag) => createMockElement('el-' + Date.now(), tag),
    addEventListener: function () {}
  },
  speechSynthesis: {
    speak: function (utt) { this.lastSpoken = utt.text; },
    cancel: function () {},
    lastSpoken: null
  },
  SpeechSynthesisUtterance: function (text) {
    this.text = text;
    this.lang = 'en-IN';
  },
  CustomEvent: function (type, detail) {
    this.type = type;
    this.detail = detail;
  },
  _TEST_SYNC: true
};
sandbox.global = sandbox;
sandbox.window = sandbox;

vm.createContext(sandbox);

const mockDataCode = fs.readFileSync(path.join(__dirname, 'js', 'mockData.js'), 'utf-8');
vm.runInContext(mockDataCode, sandbox);
const authCode = fs.readFileSync(path.join(__dirname, 'js', 'auth.js'), 'utf-8');
vm.runInContext(authCode, sandbox);
const notifCode = fs.readFileSync(path.join(__dirname, 'js', 'notifications.js'), 'utf-8');
vm.runInContext(notifCode, sandbox);
const chatCode = fs.readFileSync(path.join(__dirname, 'js', 'chat.js'), 'utf-8');
vm.runInContext(chatCode, sandbox);
const voiceCode = fs.readFileSync(path.join(__dirname, 'js', 'voice.js'), 'utf-8');
vm.runInContext(voiceCode, sandbox);

sandbox.window.FixNowVoice.init();

console.log("=================================================================");
console.log(" Verifying AI Voice Onboarding, Login & Registration Guidance");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

function check(query, assertion, desc) {
  sandbox.window.FixNowVoice.submitPrompt(query);
  const spoken = sandbox.speechSynthesis.lastSpoken || '';
  if (assertion(spoken)) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${desc} -> Received: "${spoken}"`);
    failed++;
  }
}

// 1. Customer account creation
check(
  "How do I create a customer account?",
  (s) => s.includes("Customer") && s.includes("GPS") && s.includes("password"),
  "Guides customer step-by-step through account creation"
);

// 2. Provider registration
check(
  "How to register as a provider?",
  (s) => s.includes("Provider") && s.includes("trade") && s.includes("Rate Card"),
  "Guides service provider through registration & custom rate card"
);

// 3. Provider login
check(
  "How to login as provider?",
  (s) => s.includes("Provider") && s.includes("dashboard") && s.includes("password"),
  "Explains provider login & dashboard access"
);

// 4. Customer login
check(
  "How to login as customer?",
  (s) => s.includes("Customer") && s.includes("password") && s.includes("specialists"),
  "Explains customer login & technician booking access"
);

// 5. Password policy
check(
  "What is the password policy?",
  (s) => s.includes("8 characters") && s.toLowerCase().includes("uppercase") && s.toLowerCase().includes("special character"),
  "Explains the 6 password policy rules clearly"
);

// 6. Direct navigation to register
check(
  "Take me to signup page",
  (s) => s.includes("Redirecting") || s.includes("authentication"),
  "Supports direct voice navigation to registration"
);

console.log("\n=================================================================");
console.log(`VOICE AUTH GUIDANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED.`);
console.log("=================================================================");

if (failed > 0) process.exit(1);
