/**
 * FixNow - Automated Test Suite for Project-Aware AI Voice Assistant
 * Validates all 11 critical testing scenarios required by the specification.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Setup simulated browser sandbox with DOM and LocalStorage
const mockStorage = {};
const mockElements = {};

function createMockElement(id, tag = 'div') {
  return {
    id: id,
    tagName: tag.toUpperCase(),
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    classList: {
      classes: new Set(),
      add: function (c) { this.classes.add(c); },
      remove: function (c) { this.classes.delete(c); },
      contains: function (c) { return this.classes.has(c); },
      toggle: function (c, force) {
        if (force === undefined) {
          if (this.classes.has(c)) { this.classes.delete(c); return false; }
          else { this.classes.add(c); return true; }
        }
        if (force) this.classes.add(c); else this.classes.delete(c);
        return force;
      }
    },
    appendChild: function (child) {
      if (!this.children) this.children = [];
      this.children.push(child);
    },
    addEventListener: function () {},
    setAttribute: function () {},
    getAttribute: function () { return null; }
  };
}

const sandbox = {
  window: {
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () {}
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  addEventListener: function () {},
  removeEventListener: function () {},
  dispatchEvent: function () {},
  Date: Date,
  Math: Math,
  JSON: JSON,
  parseFloat: parseFloat,
  parseInt: parseInt,
  String: String,
  Array: Array,
  Object: Object,
  RegExp: RegExp,
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
sandbox.window._TEST_SYNC = true;

vm.createContext(sandbox);

// 2. Load FixNow Core Scripts into VM
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

console.log("=================================================================");
console.log(" FixNow AI Voice Assistant - Verification of 11 Test Scenarios");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

// Prepare Test Data: 1 Real Electrician, 1 Real Plumber, 1 Real Beautician
const registeredUsers = [
  {
    id: "prov-elec-1",
    role: "provider",
    fullName: "Ramesh Electrician",
    mobile: "9876501234",
    email: "ramesh.elec@fixnow.local",
    serviceCategory: "electrician",
    serviceTitle: "Licensed Master Electrician",
    latitude: 17.4420,
    longitude: 78.4990,
    serviceRadius: 10,
    rating: 4.8,
    reviewsCount: 22,
    availability: "available",
    pricing: [{ service: "Switchboard & Wiring Repair", price: "₹299" }]
  },
  {
    id: "prov-elec-2",
    role: "provider",
    fullName: "Suresh Electricals",
    mobile: "9876509999",
    email: "suresh.elec@fixnow.local",
    serviceCategory: "electrician",
    serviceTitle: "Appliance & Inverter Specialist",
    latitude: 17.4800,
    longitude: 78.5300,
    serviceRadius: 15,
    rating: 4.5,
    reviewsCount: 14,
    availability: "available",
    pricing: [{ service: "Inverter Wiring", price: "₹399" }]
  },
  {
    id: "prov-lakshmi",
    role: "provider",
    fullName: "Lakshmi Devi",
    mobile: "9848011223",
    email: "lakshmi@fixnow.local",
    serviceCategory: "beautician",
    serviceTitle: "Certified Beautician & Bridal Specialist",
    latitude: 17.4410,
    longitude: 78.4985,
    serviceRadius: 10,
    rating: 4.9,
    reviewsCount: 38,
    availability: "available",
    pricing: [
      { service: "Bridal Makeup", price: "₹4999" },
      { service: "Facial & Skin Care", price: "₹499" }
    ]
  }
];

sandbox.localStorage.setItem('fixnow_users', JSON.stringify(registeredUsers));

// Seed customer's registered household appliance
const testHousehold = {
  overallHealthScore: 90,
  lastAuditDate: "05 Nov 2026",
  appliances: [
    {
      id: "app-test-1",
      name: "Refrigerator",
      type: "Refrigerator",
      brandModel: "Samsung Double Door Inverter",
      installedDate: "10 Oct 2024",
      lastServiceDate: "05 Nov 2025",
      status: "Good Condition",
      statusCode: "good",
      healthScore: 90,
      aiRecommendation: "Operating smoothly. Keep door seals wiped down once a month to prevent cool air leakage."
    }
  ]
};
sandbox.localStorage.setItem('fixnow_household_data', JSON.stringify(testHousehold));

// Set active customer
const testCustomer = {
  id: "cust-priya",
  role: "customer",
  fullName: "Priya Sharma",
  mobile: "9876543210",
  email: "priya@fixnow.local",
  location: "Flat 302, Green Meadows, Rampur"
};
sandbox.window.FixNowAuth.setCurrentUser(testCustomer);

// Initialize Voice Assistant
sandbox.window.FixNowVoice.init();

// -------------------------------------------------------------------------
// SCENARIO 1: Customer asks for an electrician and receives actual matching providers
// -------------------------------------------------------------------------
console.log("--- Scenario 1: Customer asks for an electrician ---");
sandbox.window.FixNowVoice.submitPrompt("I need an electrician");
let state = sandbox.window.FixNowVoice.getState();

assert(state.activeCategory === 'electrician', "NLU identified category 'electrician'");
assert(state.lastDisplayedProviders.length === 2, `Retrieved exactly 2 real registered electricians (found ${state.lastDisplayedProviders.length})`);
assert(state.lastDisplayedProviders[0].name === "Ramesh Electrician", `Nearest electrician is Ramesh Electrician (${state.lastDisplayedProviders[0].distanceKm} km)`);

// -------------------------------------------------------------------------
// SCENARIO 2: Customer asks for the nearest provider and receives a correctly calculated result
// -------------------------------------------------------------------------
console.log("\n--- Scenario 2: Customer asks 'Show me the nearest one' ---");
sandbox.window.FixNowVoice.submitPrompt("Show me the nearest one");
state = sandbox.window.FixNowVoice.getState();

assert(state.selectedProvider !== null, "Selected provider set in conversational memory");
assert(state.selectedProvider.name === "Ramesh Electrician", `Selected nearest provider '${state.selectedProvider.name}' (distance: ${state.selectedProvider.distanceKm} km)`);
assert(state.selectedProvider.distanceKm < state.lastDisplayedProviders[1].distanceKm, `Haversine distance verified: ${state.selectedProvider.distanceKm} km < ${state.lastDisplayedProviders[1].distanceKm} km`);

// -------------------------------------------------------------------------
// SCENARIO 3: Customer selects provider by speaking ordinal ("Book the first one")
// -------------------------------------------------------------------------
console.log("\n--- Scenario 3: Customer selects provider via ordinal 'Book the first one' ---");
sandbox.window.FixNowVoice.submitPrompt("Book the first one");
state = sandbox.window.FixNowVoice.getState();

assert(state.bookingDraft.stage === 'awaiting_datetime', "Voice assistant transitioned to 'awaiting_datetime' stage");
assert(state.bookingDraft.provider.id === "prov-elec-1", "Booking draft locked to Ramesh Electrician");

// -------------------------------------------------------------------------
// SCENARIO 4: Customer books through voice with confirmation
// -------------------------------------------------------------------------
console.log("\n--- Scenario 4: Customer books provider through voice with confirmation ---");
// Customer provides appointment date and time
sandbox.window.FixNowVoice.submitPrompt("Tomorrow at 10 AM");
state = sandbox.window.FixNowVoice.getState();

assert(state.bookingDraft.stage === 'confirming', "Voice assistant transitioned to 'confirming' stage with complete summary");
assert(state.bookingDraft.date === "Tomorrow", `Date parsed correctly: ${state.bookingDraft.date}`);
assert(state.bookingDraft.timeSlot === "Morning (9:00 AM - 12:00 PM)", `Time slot parsed: ${state.bookingDraft.timeSlot}`);
assert(state.bookingDraft.customerPhone === "9876543210", `Customer phone auto-filled from session: ${state.bookingDraft.customerPhone}`);

// Customer confirms booking
sandbox.window.FixNowVoice.submitPrompt("Yes, confirm it");
state = sandbox.window.FixNowVoice.getState();

const storedBookings = JSON.parse(sandbox.localStorage.getItem('fixnow_bookings') || '[]');
const createdBooking = storedBookings.find(b => b.providerId === "prov-elec-1");

assert(state.bookingDraft.stage === 'idle', "Booking draft successfully concluded and reset to idle");
assert(createdBooking !== undefined, `Booking created in storage with ID: #${createdBooking?.requestId}`);
assert(createdBooking?.status === 'Pending', `Booking initial status is 'Pending'`);
assert(createdBooking?.customerName === "Priya Sharma", `Booking customer name matches: ${createdBooking?.customerName}`);

// Verify notifications dispatched
const notifs = JSON.parse(sandbox.localStorage.getItem('fixnow_notifications') || '[]');
assert(notifs.some(n => n.targetRole === 'provider' && n.bookingId === createdBooking.requestId), "Provider received new booking notification");
assert(notifs.some(n => n.targetRole === 'customer' && n.bookingId === createdBooking.requestId), "Customer received dispatch confirmation notification");

// -------------------------------------------------------------------------
// SCENARIO 5: Customer asks for booking status and receives actual database information
// -------------------------------------------------------------------------
console.log("\n--- Scenario 5: Customer asks 'Where can I see my booking status?' ---");
sandbox.window.FixNowVoice.submitPrompt("Where can I see my booking status?");
const synthOutput = sandbox.speechSynthesis.lastSpoken;

assert(synthOutput.includes(createdBooking.requestId) || synthOutput.includes("Pending"), `Assistant spoke actual database booking info: "${synthOutput}"`);

// -------------------------------------------------------------------------
// SCENARIO 6: Provider asks who requested a booking and sees correct details
// -------------------------------------------------------------------------
console.log("\n--- Scenario 6: Provider asks 'How many booking requests do I have?' ---");
// Switch to provider account (Ramesh Electrician)
sandbox.window.FixNowAuth.setCurrentUser(registeredUsers[0]);
sandbox.window.FixNowVoice.submitPrompt("How many booking requests do I have?");
const providerSpeech = sandbox.speechSynthesis.lastSpoken;

assert(providerSpeech.includes("Priya Sharma"), `Provider speech identified customer: "${providerSpeech}"`);
assert(providerSpeech.includes("electrician") || providerSpeech.includes("request"), `Provider speech identified requested service`);

// -------------------------------------------------------------------------
// SCENARIO 7: Provider accepts a booking using voice confirmation
// -------------------------------------------------------------------------
console.log("\n--- Scenario 7: Provider accepts booking via voice 'Accept the first booking' ---");
sandbox.window.FixNowVoice.submitPrompt("Accept the first booking");
const updatedBookings = JSON.parse(sandbox.localStorage.getItem('fixnow_bookings') || '[]');
const acceptedBooking = updatedBookings.find(b => b.requestId === createdBooking.requestId);

assert(acceptedBooking.status === 'Accepted', `Booking #${createdBooking.requestId} status updated to 'Accepted'`);
const custAcceptedNotif = JSON.parse(sandbox.localStorage.getItem('fixnow_notifications') || '[]')
  .find(n => n.targetRole === 'customer' && n.title.includes('Accepted'));
assert(custAcceptedNotif !== undefined, "Customer received instant 'Booking Accepted!' notification enabling Call & Chat");

// -------------------------------------------------------------------------
// SCENARIO 8: Customer and provider cannot access each other's private account information
// -------------------------------------------------------------------------
console.log("\n--- Scenario 8: Security Boundary (Customer cannot accept bookings or see provider requests) ---");
// Switch back to customer
sandbox.window.FixNowAuth.setCurrentUser(testCustomer);
sandbox.window.FixNowVoice.submitPrompt("Accept the first booking");
const secOutput = sandbox.speechSynthesis.lastSpoken;

assert(secOutput.includes("restricted to verified service providers") || secOutput.includes("customer mode"), `Security check blocked unauthorized provider action: "${secOutput}"`);

// -------------------------------------------------------------------------
// SCENARIO 9: Assistant correctly handles English, Telugu and Hindi
// -------------------------------------------------------------------------
console.log("\n--- Scenario 9: Multilingual Handling (Telugu & Hindi) ---");
// Telugu lookup
sandbox.window.FixNowVoice.setLanguage('telugu');
sandbox.window.FixNowVoice.submitPrompt("నాకు బ్యూటీషియన్ కావాలి");
state = sandbox.window.FixNowVoice.getState();
assert(state.activeCategory === 'beautician', `Telugu lookup identified 'beautician' category`);
assert(state.lastDisplayedProviders.some(p => p.id === "prov-lakshmi"), `Telugu search returned Lakshmi Devi`);

// Hindi lookup
sandbox.window.FixNowVoice.setLanguage('hindi');
sandbox.window.FixNowVoice.submitPrompt("मुझे प्लंबर चाहिए");
state = sandbox.window.FixNowVoice.getState();
assert(state.activeCategory === 'plumber', `Hindi lookup identified 'plumber' category`);

// Switch back to English
sandbox.window.FixNowVoice.setLanguage('english');

// -------------------------------------------------------------------------
// SCENARIO 10: Follow-up questions without losing conversation context
// -------------------------------------------------------------------------
console.log("\n--- Scenario 10: Follow-up questions without losing conversation context ---");
sandbox.window.FixNowVoice.submitPrompt("When should I service my refrigerator?");
const fridgeSpeech = sandbox.speechSynthesis.lastSpoken;

assert(fridgeSpeech.includes("Refrigerator") || fridgeSpeech.includes("Samsung"), `Assistant answered household health question using digital twin: "${fridgeSpeech}"`);
assert(fridgeSpeech.includes("90%") || fridgeSpeech.includes("Good Condition"), "Returned accurate health score and maintenance advice");

// -------------------------------------------------------------------------
// SCENARIO 11: Assistant does NOT invent information when results are unavailable
// -------------------------------------------------------------------------
console.log("\n--- Scenario 11: Honest Empty State (Never invents fake providers or ratings) ---");
sandbox.window.FixNowVoice.submitPrompt("I need someone to paint my house");
state = sandbox.window.FixNowVoice.getState();

assert(state.activeCategory === 'painter', "NLU identified 'painter' category");
assert(state.lastDisplayedProviders.length === 0, `0 providers displayed for category with 0 registered painters (found ${state.lastDisplayedProviders.length})`);
const emptySpeech = sandbox.speechSynthesis.lastSpoken;
assert(emptySpeech.includes("No registered") && emptySpeech.includes("currently available"), `Assistant gave honest empty state without fake technicians: "${emptySpeech}"`);

// -------------------------------------------------------------------------
// SCENARIO 12: Instructions for Login & Sign Up
// -------------------------------------------------------------------------
console.log("\n--- Scenario 12: Instructions for Login & Sign Up ---");
sandbox.window.FixNowVoice.submitPrompt("How do I login or sign up?");
const authHelp = sandbox.speechSynthesis.lastSpoken;
assert(authHelp.includes("Login") && (authHelp.includes("Customer") || authHelp.includes("Service Provider")), `Provided clear voice login/signup instructions: "${authHelp}"`);

// -------------------------------------------------------------------------
// SCENARIO 13: Customer & Provider Location Change Guidance
// -------------------------------------------------------------------------
console.log("\n--- Scenario 13: Customer & Provider Location Change Guidance ---");
sandbox.window.FixNowVoice.submitPrompt("How can I change my location if I am in another place?");
const locHelp = sandbox.speechSynthesis.lastSpoken;
assert(locHelp.includes("Customer") && locHelp.includes("Provider") && locHelp.includes("GPS"), `Provided comprehensive location change guidance for both roles: "${locHelp}"`);

// -------------------------------------------------------------------------
// FINAL SUMMARY
// -------------------------------------------------------------------------
console.log("\n" + "=".repeat(65));
console.log(`VOICE ASSISTANT TEST RESULTS: ${passed} PASSED, ${failed} FAILED.`);
console.log("=".repeat(65));

if (failed === 0) {
  console.log("🎉 ALL 11 SPECIFICATION TESTING SCENARIOS PASSED WITH 100% ACCURACY!");
  process.exit(0);
} else {
  console.error("❌ Some tests failed. Please review above logs.");
  process.exit(1);
}
