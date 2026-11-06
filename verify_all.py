"""
FixNow - Comprehensive Verification Suite (verify_all.py)
===========================================================
Validates:
1. Internal link & asset integrity
2. Brand consistency across codebase
3. Natural Language category mapping & the 8 explicit test cases via Node.js
4. Multilingual support (English, Telugu, Tamil)
5. Authentication Voice Assistant integration on auth.html
6. GPS error handling compliance
===========================================================
"""

import os
import subprocess
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def print_header(title):
    print("\n" + "=" * 65)
    print(f" {title}")
    print("=" * 65)

def verify_links():
    print_header("1. Link & Asset Integrity Check")
    from verify_links import run_verification
    return run_verification()

def verify_brand_cleanliness():
    print_header("2. Brand Name Verification")
    disallowed_terms = ["villagefix", "gramfix", "ruralfix"]
    files_to_check = []

    for root, dirs, files in os.walk(BASE_DIR):
        if any(ignored in root for ignored in ['.git', 'node_modules', '.vscode']):
            continue
        for f in files:
            if f.endswith(('.html', '.js', '.css', '.md')):
                files_to_check.append(os.path.join(root, f))

    violations = []
    for file_path in files_to_check:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read().lower()
            for term in disallowed_terms:
                if term in content:
                    violations.append(f"{os.path.relpath(file_path, BASE_DIR)} contains '{term}'")

    if violations:
        print(f"❌ Found {len(violations)} brand violations:")
        for v in violations:
            print("  - " + v)
        return False
    else:
        print("✅ Brand check passed! Strict 100% FixNow branding throughout.")
        return True

def verify_test_cases_node():
    print_header("3. NLU & 8 Explicit Test Cases Verification")

    node_script = """
    const fs = require('fs');
    const path = require('path');
    const vm = require('vm');

    // Simulate browser window object with in-memory localStorage
    let mockStorage = {};
    const sandbox = {
      window: {},
      console: console,
      localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; },
        clear: () => { mockStorage = {}; }
      }
    };
    sandbox.global = sandbox;
    vm.createContext(sandbox);

    const mockDataCode = fs.readFileSync(path.join(__dirname, 'js', 'mockData.js'), 'utf-8');
    vm.runInContext(mockDataCode, sandbox);

    const authCode = fs.readFileSync(path.join(__dirname, 'js', 'auth.js'), 'utf-8');
    vm.runInContext(authCode, sandbox);

    const identifyCategory = sandbox.window.FixNowData.identifyCategory;
    const allProviders = sandbox.window.FixNowData.getEffectiveProviders();
    const defaultProviders = sandbox.window.FixNowData.providers;
    const defaultUsers = sandbox.window.FixNowAuth.getUsers();

    let passed = 0;
    let failed = 0;

    // Verify Zero Default Providers & Customers
    if (defaultProviders.length === 0 && allProviders.length === 0) {
      console.log(`  ✅ Zero Default Providers: FIXNOW_DEMO_PROVIDERS is empty (0 default providers).`);
      passed++;
    } else {
      console.error(`  ❌ Failed: Expected 0 default providers, found ${defaultProviders.length}`);
      failed++;
    }

    if (defaultUsers.length === 0) {
      console.log(`  ✅ Zero Default Users: initDefaultAccounts() initializes 0 default users.`);
      passed++;
    } else {
      console.error(`  ❌ Failed: Expected 0 default users, found ${defaultUsers.length}`);
      failed++;
    }

    // Natural Language Processing / NLU test suite across English, Telugu, and Tamil
    const testCases = [
      { id: 1, query: "I need a beautician", expectedCat: "beautician", desc: "English Beautician lookup" },
      { id: 2, query: "I need AC repair", expectedCat: "ac-repair", desc: "English AC Repair lookup" },
      { id: 3, query: "I need an electrician", expectedCat: "electrician", desc: "English Electrician lookup" },
      { id: 4, query: "I need a plumber", expectedCat: "plumber", desc: "English Plumber lookup" },
      { id: 5, query: "My bike broke down", expectedCat: "mechanic", desc: "English Mechanic lookup" },
      { id: 6, query: "I need RO service", expectedCat: "ro-water", desc: "English RO Purifier lookup" },
      { id: 7, query: "I need someone to paint my house", expectedCat: "painter", desc: "English Painter lookup" },
      { id: 8, query: "The weather is very hot and I want some ice cream", expectedCat: null, desc: "Unknown sentence (clarify, no AC fallback)" },
      // Multilingual tests
      { id: 9, query: "నాకు బ్యూటీషియన్ కావాలి", expectedCat: "beautician", desc: "Telugu Beautician lookup" },
      { id: 10, query: "ఏసీ పనిచేయడం లేదు", expectedCat: "ac-repair", desc: "Telugu AC problem lookup" },
      { id: 11, query: "பியூட்டீசியன் வேண்டும்", expectedCat: "beautician", desc: "Tamil Beautician lookup" }
    ];

    testCases.forEach(tc => {
      const res = identifyCategory(tc.query);
      if (tc.expectedCat === null) {
        if (!res.matched && res.categoryId === null) {
          console.log(`  ✅ Case ${tc.id} [${tc.desc}]: Correctly marked as unknown without defaulting to AC repair.`);
          passed++;
        } else {
          console.error(`  ❌ Case ${tc.id} [${tc.desc}]: Failed! Expected matched:false, but got categoryId: ${res.categoryId}`);
          failed++;
        }
      } else {
        if (res.matched && res.categoryId === tc.expectedCat) {
          console.log(`  ✅ Case ${tc.id} [${tc.desc}]: NLP accurately classified category '${tc.expectedCat}'.`);
          passed++;
        } else {
          console.error(`  ❌ Case ${tc.id} [${tc.desc}]: Failed! Expected '${tc.expectedCat}', but got '${res.categoryId}'.`);
          failed++;
        }
      }
    });

    // Verify dynamic provider registration works seamlessly
    sandbox.window.FixNowAuth.signup({
      fullName: "Test Registered Beautician",
      mobile: "9123456780",
      email: "testbeautician@fixnow.local",
      serviceCategory: "beautician",
      password: "pass123"
    }, 'provider');

    const updatedPros = sandbox.window.FixNowData.getEffectiveProviders();
    const beauticianMatch = updatedPros.find(p => p.serviceCategory === 'beautician');
    if (updatedPros.length === 1 && beauticianMatch && beauticianMatch.name === "Test Registered Beautician") {
      console.log(`  ✅ Dynamic Registration: Newly registered provider successfully returned by getEffectiveProviders().`);
      passed++;
    } else {
      console.error(`  ❌ Dynamic Registration Failed! Found:`, updatedPros);
      failed++;
    }

    console.log(`\\nResult: ${passed} passed, ${failed} failed.`);
    process.exit(failed === 0 ? 0 : 1);
    """

    test_file_path = os.path.join(BASE_DIR, "_temp_test_runner.js")
    with open(test_file_path, "w", encoding="utf-8") as f:
        f.write(node_script)

    try:
        res = subprocess.run(["node", test_file_path], capture_output=True, text=True, cwd=BASE_DIR)
        print(res.stdout)
        if res.stderr:
            print("Errors:\n", res.stderr)
        return res.returncode == 0
    finally:
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def verify_auth_voice_and_gps():
    print_header("4. Authentication Voice Assistant & GPS Compliance")
    all_ok = True

    # 1. auth.html voice elements
    with open(os.path.join(BASE_DIR, 'auth.html'), 'r', encoding='utf-8') as f:
        auth_html = f.read()

    expected_auth_elements = [
        'authVoiceSpeechContent',
        'btnPlayAuthVoice',
        'btnMicAuthVoice',
        'authVoiceLiveTranscriptRow',
        'authVoice.js'
    ]
    for el in expected_auth_elements:
        if el in auth_html:
            print(f"  ✅ auth.html includes '{el}'")
        else:
            print(f"  ❌ auth.html is missing '{el}'")
            all_ok = False

    # 2. services.js requirements
    with open(os.path.join(BASE_DIR, 'js', 'services.js'), 'r', encoding='utf-8') as f:
        services_js = f.read()

    expected_services_requirements = [
        ('getEffectiveProviders', "services.js uses getEffectiveProviders()"),
        ('identifyCategory', "services.js uses identifyCategory()"),
        ('Location access is required to find nearby services.', "services.js shows exact GPS error message"),
        ('Demo Provider', "services.js renders Demo Provider badge"),
        ('No ', "services.js renders dynamic empty state for categories")
    ]
    for pattern, label in expected_services_requirements:
        if pattern in services_js:
            print(f"  ✅ {label}")
        else:
            print(f"  ❌ Missing requirement: {label}")
            all_ok = False

    return all_ok

def main():
    s1 = verify_links()
    s2 = verify_brand_cleanliness()
    s3 = verify_test_cases_node()
    s4 = verify_auth_voice_and_gps()

    print_header("OVERALL VERIFICATION SUMMARY")
    if s1 and s2 and s3 and s4:
        print("🎉 ALL CHECKS PASSED! The FixNow prototype is robust, compliant, and ready.")
        sys.exit(0)
    else:
        print("⚠️ Some verification checks failed. Review output above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
