/**
 * FixNow - Authentication & Role-Based Session Manager (auth.js)
 * Manages separate authentication flows for Customer and Service Provider.
 *
 * NOTE FOR FASTAPI + MONGODB INTEGRATION:
 * When connecting to your FastAPI backend:
 * 1. Customer Registration:
 *    POST /api/v1/auth/customer/register
 * 2. Service Provider Registration:
 *    POST /api/v1/auth/provider/register
 * 3. Login (OAuth2 Password / JWT):
 *    POST /api/v1/auth/login -> returns { access_token, user_role, user_profile }
 * 4. Token Storage:
 *    Store JWT in localStorage or httpOnly Cookie and attach to Authorization headers.
 */

(function () {
  'use strict';

  window.FixNowAuth = window.FixNowAuth || {};

  const USERS_STORAGE_KEY = 'fixnow_users';
  const CURRENT_USER_KEY = 'fixnow_current_user';

  // Initialize user storage without fake/default accounts
  function initDefaultAccounts() {
    const existing = localStorage.getItem(USERS_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
    } else {
      // Clean up any legacy default demo accounts
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          const demoIds = ['cust-1', 'prov-1', 'cust-default', 'prov-default'];
          const cleaned = parsed.filter(u => !demoIds.includes(u.id));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cleaned));
          }
        }
      } catch (e) {}
    }
  }

  /**
   * Get all registered users
   */
  function getUsers() {
    initDefaultAccounts();
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
  }

  /**
   * Get currently logged-in user
   */
  function getCurrentUser() {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (!stored) return null;
    try {
      const user = JSON.parse(stored);
      const demoIds = ['cust-1', 'prov-1', 'cust-default', 'prov-default'];
      if (user && demoIds.includes(user.id)) {
        localStorage.removeItem(CURRENT_USER_KEY);
        return null;
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save current user session
   */
  function setCurrentUser(user) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  /**
   * Check user roles
   */
  function isCustomer() {
    const user = getCurrentUser();
    return user && user.role === 'customer';
  }

  function isProvider() {
    const user = getCurrentUser();
    return user && user.role === 'provider';
  }

  /**
   * Authenticate user by email or mobile and role
   */
  function login(emailOrPhone, password, requiredRole) {
    const users = getUsers();
    const cleanIdent = emailOrPhone.trim().toLowerCase();
    const cleanPass = password.trim();

    const matched = users.find(u =>
      (u.email.toLowerCase() === cleanIdent || u.mobile.replace(/\D/g, '') === cleanIdent.replace(/\D/g, '')) &&
      u.password === cleanPass &&
      (!requiredRole || u.role === requiredRole)
    );

    if (!matched) {
      return {
        success: false,
        message: 'Invalid email/mobile or password. Please try again or create a new account.'
      };
    }

    // Set active session
    setCurrentUser(matched);

    return {
      success: true,
      user: matched,
      redirectUrl: matched.role === 'provider' ? 'provider-dashboard.html' : 'index.html'
    };
  }

  /**
   * Enforce Strict Password Security Policy
   * Requirements:
   * - Minimum length: 8 characters
   * - Uppercase: At least 1 (A–Z)
   * - Lowercase: At least 1 (a–z)
   * - Number: At least 1 (0–9)
   * - Special character: At least 1 (@, #, $, etc.)
   * - Confirm password: Must match password
   */
  function validatePassword(password, confirmPassword) {
    const p = typeof password === 'string' ? password : '';
    const cp = typeof confirmPassword === 'string' ? confirmPassword : '';

    const rules = {
      minLength: p.length >= 8,
      uppercase: /[A-Z]/.test(p),
      lowercase: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p),
      matchConfirm: confirmPassword !== undefined ? (p.length > 0 && p === cp) : true
    };

    const errors = [];
    if (!rules.minLength) errors.push('Password must be at least 8 characters long.');
    if (!rules.uppercase) errors.push('Password must contain at least 1 uppercase letter (A–Z).');
    if (!rules.lowercase) errors.push('Password must contain at least 1 lowercase letter (a–z).');
    if (!rules.number) errors.push('Password must contain at least 1 number (0–9).');
    if (!rules.specialChar) errors.push('Password must contain at least 1 special character (@, #, $, %, etc.).');
    if (confirmPassword !== undefined && !rules.matchConfirm) {
      errors.push('Confirm password must match password.');
    }

    const isValid = rules.minLength && rules.uppercase && rules.lowercase && rules.number && rules.specialChar && rules.matchConfirm;

    return {
      isValid: isValid,
      rules: rules,
      errors: errors
    };
  }

  /**
   * Register a new user (Customer or Service Provider)
   */
  function signup(userData, role) {
    const users = getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanMobile = userData.mobile.replace(/\D/g, '');

    // Validate Password Policy
    const passValidation = validatePassword(userData.password, userData.confirmPassword);
    if (!passValidation.isValid) {
      return {
        success: false,
        message: passValidation.errors[0] || 'Password does not meet the security policy requirements.'
      };
    }

    // Check existing email or mobile
    const exists = users.some(u =>
      u.email.toLowerCase() === cleanEmail ||
      u.mobile.replace(/\D/g, '') === cleanMobile
    );

    if (exists) {
      return {
        success: false,
        message: 'An account with this email or mobile number already exists.'
      };
    }

    const newId = (role === 'provider' ? 'prov-' : 'cust-') + Date.now();
    const newUser = {
      id: newId,
      role: role,
      createdAt: new Date().toISOString(),
      ...userData
    };

    if (role === 'provider') {
      newUser.rating = 5.0;
      newUser.reviewsCount = 0;
      newUser.completedJobs = 0;
      newUser.availability = 'available';
      newUser.workingHours = userData.workingHours || '8:00 AM - 7:00 PM';
    }

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Sync registration to MongoDB backend if online
    if (window.FixNowAPI) {
      if (role === 'provider' && typeof window.FixNowAPI.registerProvider === 'function') {
        window.FixNowAPI.registerProvider(newUser);
      } else if (typeof window.FixNowAPI.registerCustomer === 'function') {
        window.FixNowAPI.registerCustomer(newUser);
      }
    }

    // Cache user coordinates for immediate proximity search if available
    if (userData.latitude && userData.longitude) {
      try {
        localStorage.setItem('fixnow_user_coords', JSON.stringify({
          lat: parseFloat(userData.latitude),
          lng: parseFloat(userData.longitude),
          address: userData.serviceLocation || userData.address || userData.location || 'Customer Saved Location'
        }));
      } catch (e) {}
    }

    // Automatically log in after registration
    setCurrentUser(newUser);

    return {
      success: true,
      user: newUser,
      redirectUrl: role === 'provider' ? 'provider-dashboard.html' : 'index.html'
    };
  }

  /**
   * Log out active session
   */
  function logout() {
    setCurrentUser(null);
    if (window.FixNow && window.FixNow.showToast) {
      window.FixNow.showToast('You have been logged out successfully.', 'info');
    }
    // Redirect to home
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 400);
  }

  /**
   * Update Provider Profile in storage
   */
  function updateProviderProfile(updatedFields) {
    const current = getCurrentUser();
    if (!current || current.role !== 'provider') {
      return { success: false, message: 'Unauthorized action.' };
    }

    const users = getUsers();
    const idx = users.findIndex(u => u.id === current.id);
    if (idx === -1) {
      users.push({ ...current, ...updatedFields });
    } else {
      users[idx] = { ...users[idx], ...updatedFields };
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    const updated = { ...current, ...updatedFields };
    setCurrentUser(updated);

    try {
      window.dispatchEvent(new CustomEvent('fixnow:auth:update', { detail: { user: updated } }));
    } catch (e) {}

    return { success: true, user: updated };
  }

  /**
   * Update Customer Profile in storage
   */
  function updateCustomerProfile(updatedFields) {
    const current = getCurrentUser();
    if (!current || current.role !== 'customer') {
      return { success: false, message: 'Unauthorized action. Please log in as a customer.' };
    }

    const users = getUsers();
    const idx = users.findIndex(u => u.id === current.id);
    if (idx === -1) {
      users.push({ ...current, ...updatedFields });
    } else {
      users[idx] = { ...users[idx], ...updatedFields };
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    const updated = { ...current, ...updatedFields };
    setCurrentUser(updated);

    try {
      window.dispatchEvent(new CustomEvent('fixnow:auth:update', { detail: { user: updated } }));
    } catch (e) {}

    return { success: true, user: updated };
  }

  /**
   * Route Guard: Protect pages requiring provider authentication
   */
  function requireProviderAuth() {
    const user = getCurrentUser();
    if (!user || user.role !== 'provider') {
      return false;
    }
    return true;
  }

  // Initialize accounts immediately
  initDefaultAccounts();

  // Export methods
  window.FixNowAuth = {
    getUsers: getUsers,
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    isCustomer: isCustomer,
    isProvider: isProvider,
    login: login,
    signup: signup,
    logout: logout,
    validatePassword: validatePassword,
    updateProviderProfile: updateProviderProfile,
    updateCustomerProfile: updateCustomerProfile,
    requireProviderAuth: requireProviderAuth
  };
})();
