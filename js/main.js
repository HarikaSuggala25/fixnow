/**
 * FixNow - Global Application Script (main.js)
 * Handles mobile navigation, toast notifications, booking modal, and shared helpers
 */

(function () {
  'use strict';

  // Global namespace
  window.FixNow = window.FixNow || {};

  // Store active user bookings in localStorage
  const BOOKINGS_STORAGE_KEY = 'fixnow_bookings';

  /**
   * Initialize Global Navigation & UI
   */
  function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (navToggle && mobileMenu) {
      navToggle.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close menu when clicking outside or clicking any mobile link
      document.addEventListener('click', function (e) {
        if (!mobileMenu.contains(e.target) && !navToggle.contains(e.target)) {
          mobileMenu.classList.remove('open');
        }
      });
    }

    // Highlight current page active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Toast Notification Manager
   * @param {string} message - Notification text
   * @param {'info' | 'success' | 'warning'} type - Visual color style
   */
  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${icon}</span>
      <div style="flex: 1;">${message}</div>
      <button style="background: none; border: none; color: white; cursor: pointer; font-size: 1.1rem; opacity: 0.8;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 4.5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  /**
   * Booking Modal Manager
   */
  function initBookingModal() {
    const modalOverlay = document.getElementById('bookingModal');
    if (!modalOverlay) return;

    const closeBtn = document.getElementById('closeBookingModal');
    const bookingForm = document.getElementById('serviceBookingForm');
    const successBox = document.getElementById('bookingSuccessState');
    const imageInput = document.getElementById('bookingImageUpload');
    const imagePreview = document.getElementById('bookingImagePreview');

    // Close on click outside
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) {
        closeBookingModal();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeBookingModal);
    }

    // Quick chips for problem description
    const problemChips = document.querySelectorAll('.chip-select');
    const problemDescInput = document.getElementById('bookingProblemDesc');

    problemChips.forEach(chip => {
      chip.addEventListener('click', function () {
        chip.classList.toggle('selected');
        const selectedChips = Array.from(document.querySelectorAll('.chip-select.selected'))
          .map(c => c.textContent.trim());

        if (problemDescInput) {
          problemDescInput.value = selectedChips.join(', ');
        }
      });
    });

    // Image preview handler
    if (imageInput && imagePreview) {
      imageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            imagePreview.innerHTML = `
              <div style="margin-top: 8px; position: relative; display: inline-block;">
                <img src="${e.target.result}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" alt="Uploaded preview">
                <span style="display: block; font-size: 0.78rem; color: #15803d; font-weight: 600;">Image attached</span>
              </div>
            `;
          };
          reader.readAsDataURL(file);
        } else {
          imagePreview.innerHTML = '';
        }
      });
    }

    let activeTargetProvider = null;

    function populateSubServices(categoryKey, providerServices = null) {
      const subSelect = document.getElementById('bookingSubService');
      if (!subSelect) return;

      let items = [];
      if (providerServices && Array.isArray(providerServices) && providerServices.length > 0) {
        items = providerServices;
      } else if (window.FixNowData && window.FixNowData.subServices) {
        const cleanKey = (categoryKey || '').toLowerCase();
        let catId = 'ac-repair';
        if (cleanKey.includes('beaut') || cleanKey.includes('salon')) catId = 'beautician';
        else if (cleanKey.includes('plumb')) catId = 'plumber';
        else if (cleanKey.includes('electr')) catId = 'electrician';
        else if (cleanKey.includes('mech') || cleanKey.includes('bike')) catId = 'mechanic';
        else if (cleanKey.includes('refrig')) catId = 'refrigerator';
        else if (cleanKey.includes('wash')) catId = 'washing-machine';
        else if (cleanKey.includes('ro') || cleanKey.includes('purif')) catId = 'ro-water';
        else if (cleanKey.includes('paint')) catId = 'painter';
        else if (cleanKey.includes('carpent')) catId = 'carpenter';
        else if (cleanKey.includes('labour')) catId = 'labourer';

        items = window.FixNowData.subServices[catId] || [
          "General Inspection & Diagnostics",
          "Standard Repair",
          "Replacement & Installation",
          "Emergency Maintenance"
        ];
      } else {
        items = ["General Inspection & Diagnostics", "Standard Repair", "Replacement & Installation"];
      }

      subSelect.innerHTML = items.map(s => {
        const label = typeof s === 'object' ? s.service : s;
        return `<option value="${label}">${label}</option>`;
      }).join('');
    }

    const serviceSelect = document.getElementById('bookingServiceCategory');
    if (serviceSelect) {
      serviceSelect.addEventListener('change', function () {
        populateSubServices(this.value);
      });
    }

    // Handle Form Submit
    if (bookingForm) {
      bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const providerName = document.getElementById('bookingProviderName')?.value || 'Selected Specialist';
        const serviceCategory = document.getElementById('bookingServiceCategory')?.value || 'General Service';
        const subService = document.getElementById('bookingSubService')?.value || 'General Repair';
        const date = document.getElementById('bookingDate')?.value || 'Tomorrow';
        const timeSlot = document.getElementById('bookingTimeSlot')?.value || 'Morning (9:00 AM - 12:00 PM)';
        const customerName = document.getElementById('bookingCustomerName')?.value || 'Customer';
        const customerPhone = document.getElementById('bookingCustomerPhone')?.value || '';
        const customerAddress = document.getElementById('bookingAddress')?.value || '';
        const problemDesc = document.getElementById('bookingProblemDesc')?.value || 'General maintenance check';

        // Basic validation
        if (!customerPhone || customerPhone.trim().length < 8) {
          showToast('Please enter a valid mobile number for provider confirmation.', 'warning');
          return;
        }

        // Generate realistic tracking ID
        const requestId = 'FN-' + Math.floor(100000 + Math.random() * 900000);

        // Resolve provider phone & ID
        let providerPhone = activeTargetProvider ? (activeTargetProvider.phoneNumber || activeTargetProvider.phone) : null;
        let providerId = activeTargetProvider ? activeTargetProvider.id : 1;

        if (!providerPhone && window.FixNowData && window.FixNowData.getEffectiveProviders) {
          const allPros = window.FixNowData.getEffectiveProviders();
          const found = allPros.find(p => p.name.toLowerCase() === providerName.toLowerCase());
          if (found) {
            providerPhone = found.phoneNumber || found.phone || null;
            providerId = found.id;
          }
        }

        const user = window.FixNowAuth?.getCurrentUser();
        const newBooking = {
          requestId: requestId,
          customerId: user ? user.id : ('cust-' + Date.now()),
          customerName: customerName,
          customerPhone: customerPhone,
          customerAddress: customerAddress,
          providerId: providerId,
          providerName: providerName,
          providerPhone: providerPhone, // Real registered number or null
          serviceCategory: serviceCategory,
          subService: subService,
          date: date,
          timeSlot: timeSlot,
          problemDesc: problemDesc,
          status: 'Pending',
          createdAt: new Date().toISOString()
        };

        // Save locally
        const existing = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
        existing.unshift(newBooking);
        localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(existing));

        // Sync to MongoDB backend if available
        if (window.FixNowAPI && typeof window.FixNowAPI.createBooking === 'function') {
          window.FixNowAPI.createBooking(newBooking);
        }

        // Initialize request-linked chat conversation
        if (window.FixNowChat && window.FixNowChat.initChatFromBooking) {
          window.FixNowChat.initChatFromBooking(newBooking);
        }

        // Dispatch Real-time Notifications for Provider and Customer
        if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
          // 1. Alert the Service Provider
          window.FixNowNotifications.addNotification({
            targetRole: 'provider',
            targetUserId: providerId,
            bookingId: requestId,
            title: '📥 New Service Request!',
            message: `New booking #${requestId} from ${customerName} (${customerPhone}) for ${subService || serviceCategory} on ${date} (${timeSlot}).`,
            type: 'info',
            action: 'requests'
          });

          // 2. Alert the Customer
          window.FixNowNotifications.addNotification({
            targetRole: 'customer',
            targetUserId: user ? user.id : null,
            targetPhone: customerPhone,
            bookingId: requestId,
            title: '⏳ Service Request Dispatched',
            message: `Your booking #${requestId} for ${subService || serviceCategory} has been sent to ${providerName}. We will notify you once confirmed.`,
            type: 'info',
            action: 'bookings'
          });
        }

        // Switch modal to success state with Call & Chat actions
        bookingForm.style.display = 'none';
        if (successBox) {
          successBox.style.display = 'block';
          const successDetails = document.getElementById('successDetails');
          if (successDetails) {
            const cleanPhone = providerPhone ? providerPhone.replace(/[^0-9+]/g, '') : '';
            const phoneHtml = providerPhone
              ? `<a href="tel:${cleanPhone}" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px;"><span>📞</span> Call ${providerName} (${providerPhone})</a>`
              : `<span style="font-size:0.85rem; color:#64748b; font-style:italic;">Phone number not available.</span>`;

            successDetails.innerHTML = `
              <p><strong>Booking ID:</strong> <span style="color: #1e40af; font-weight: 700;">#${requestId}</span></p>
              <p><strong>Provider:</strong> ${providerName}</p>
              <p><strong>Service:</strong> <span style="color:#0f172a; font-weight:600;">${serviceCategory} → ${subService}</span></p>
              <p><strong>Schedule:</strong> ${date} (${timeSlot})</p>
              <p><strong>Status:</strong> <span class="badge badge-status-attention">● Pending</span></p>
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; margin-top: 14px;">
                <div style="font-size: 0.9rem; font-weight: 700; color: #1e40af; margin-bottom: 8px;">
                  💬 Direct Communication with Provider
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                  <button class="btn btn-primary btn-sm" onclick="window.FixNowChat.openChatModal('${requestId}', 'customer')">
                    <span>💬</span> Chat with ${providerName.split(' ')[0]}
                  </button>
                  ${phoneHtml}
                </div>
              </div>
            `;
          }
        }

        showToast('Service request sent successfully!', 'success');
      });
    }
  }

  function openBookingModal(providerOrAppliance) {
    const modalOverlay = document.getElementById('bookingModal');
    if (!modalOverlay) return;

    const bookingForm = document.getElementById('serviceBookingForm');
    const successBox = document.getElementById('bookingSuccessState');

    // Reset views
    if (bookingForm) bookingForm.style.display = 'block';
    if (successBox) successBox.style.display = 'none';

    // Set minimum date to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      dateInput.value = today;
    }

    // Prefill data if passed
    if (providerOrAppliance) {
      const providerInput = document.getElementById('bookingProviderName');
      const serviceInput = document.getElementById('bookingServiceCategory');
      const problemDesc = document.getElementById('bookingProblemDesc');

      if (typeof providerOrAppliance === 'string') {
        if (serviceInput) {
          serviceInput.value = providerOrAppliance;
          const subSelect = document.getElementById('bookingSubService');
          if (subSelect && window.FixNowData && window.FixNowData.subServices) {
            const cleanKey = providerOrAppliance.toLowerCase();
            let catKey = 'ac-repair';
            if (cleanKey.includes('beaut')) catKey = 'beautician';
            else if (cleanKey.includes('plumb')) catKey = 'plumber';
            else if (cleanKey.includes('electr')) catKey = 'electrician';
            else if (cleanKey.includes('mech')) catKey = 'mechanic';
            const subs = window.FixNowData.subServices[catKey] || [];
            subSelect.innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
          }
        }
      } else if (typeof providerOrAppliance === 'object') {
        if (providerInput && providerOrAppliance.name) {
          providerInput.value = providerOrAppliance.name;
        }

        // Set Main Service
        let cat = providerOrAppliance.serviceCategory || providerOrAppliance.category || 'General Service';
        if (serviceInput) {
          if (cat === 'beautician' || cat === 'salon') serviceInput.value = 'Beautician';
          else if (cat === 'ac-repair') serviceInput.value = 'AC Repair';
          else if (cat === 'plumber') serviceInput.value = 'Plumber';
          else if (cat === 'electrician') serviceInput.value = 'Electrician';
          else if (cat === 'mechanic') serviceInput.value = 'Mechanic';
          else if (cat === 'refrigerator') serviceInput.value = 'Refrigerator';
          else if (cat === 'washing-machine') serviceInput.value = 'Washing Machine';
          else if (cat === 'ro-water') serviceInput.value = 'RO Purifier';
          else if (cat === 'painter') serviceInput.value = 'Painter';
          else if (cat === 'carpenter') serviceInput.value = 'Carpenter';
        }

        // Populate Sub-Services from Provider Pricing / Services
        const subSelect = document.getElementById('bookingSubService');
        if (subSelect) {
          let items = [];
          if (providerOrAppliance.pricing && providerOrAppliance.pricing.length > 0) {
            items = providerOrAppliance.pricing.map(p => p.service);
          } else if (providerOrAppliance.services && providerOrAppliance.services.length > 0) {
            items = providerOrAppliance.services;
          } else if (window.FixNowData && window.FixNowData.subServices) {
            items = window.FixNowData.subServices[cat] || ["General Inspection & Diagnostics", "Standard Repair"];
          }
          subSelect.innerHTML = items.map(s => `<option value="${s}">${s}</option>`).join('');
        }

        if (problemDesc && providerOrAppliance.problemNote) {
          problemDesc.value = providerOrAppliance.problemNote;
        }
      }
    }

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeBookingModal() {
    const modalOverlay = document.getElementById('bookingModal');
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Geolocation helper with fallback to default rural/semi-urban center
   * (Secunderabad - Rampur Cluster)
   */
  function getCurrentCoordinates(onSuccess, onError) {
    if (!navigator.geolocation) {
      showToast('Location access is required to find nearby services.', 'warning');
      if (onError) onError(new Error('Geolocation not supported by browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        if (onSuccess) {
          onSuccess({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Current GPS Location"
          });
        }
      },
      err => {
        console.warn('Geolocation access denied or timed out:', err.message);
        if (onError) {
          onError(err);
        } else {
          showToast('Location access is required to find nearby services.', 'warning');
        }
      },
      { timeout: 7000 }
    );
  }

  /**
   * Dynamic Authentication Header Rendering
   */
  function renderAuthHeader() {
    if (!window.FixNowAuth) return;

    const user = window.FixNowAuth.getCurrentUser();
    const navActions = document.querySelector('.nav-actions');
    const mobileActions = document.querySelector('.mobile-actions');

    if (!navActions) return;

    // Keep the mobile toggle button intact
    const navToggleHtml = `
      <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    `;

    // Global Notification Bell
    const notifBellHtml = `
      <button class="notif-bell-btn" id="headerNotifBell" onclick="window.FixNowNotifications.openNotificationsModal()" aria-label="View notifications" title="Notifications">
        <span>🔔</span>
        <span class="notif-badge-pill" id="notifBadgeCounter" style="display: none;">0</span>
      </button>
    `;

    if (!user) {
      // Logged Out (Guest) State
      navActions.innerHTML = `
        ${notifBellHtml}
        <button class="btn btn-secondary btn-sm" onclick="window.FixNow.openCustomerBookingsModal()" title="View and track recent service bookings">
          📋 Track Bookings
        </button>
        <a href="services.html" class="btn btn-secondary btn-sm">Find Services</a>
        <a href="voice.html" class="btn btn-voice btn-sm"><span>🎙️</span> Voice Search</a>
        <a href="auth.html" class="btn btn-primary btn-sm" style="font-weight: 700;">Login / Sign Up</a>
        ${navToggleHtml}
      `;

      if (mobileActions) {
        mobileActions.innerHTML = `
          <button class="btn btn-secondary" style="width: 100%; margin-bottom: 6px;" onclick="window.FixNowNotifications.openNotificationsModal()">
            🔔 Notifications
          </button>
          <button class="btn btn-secondary" style="width: 100%; margin-bottom: 6px;" onclick="window.FixNow.openCustomerBookingsModal()">
            📋 Track Bookings
          </button>
          <a href="auth.html" class="btn btn-primary" style="width: 100%; margin-bottom: 6px;">Login / Sign Up</a>
          <a href="services.html" class="btn btn-secondary" style="width: 100%; margin-bottom: 6px;">Find Services</a>
          <a href="voice.html" class="btn btn-voice" style="width: 100%;">Use Voice Assistant</a>
        `;
      }
    } else if (user.role === 'customer') {
      // Customer Logged In State
      navActions.innerHTML = `
        ${notifBellHtml}
        <button class="user-auth-badge" onclick="window.FixNow.openCustomerProfileModal()" title="Click to view & edit your profile" style="cursor: pointer; border: 1px solid var(--border-color); background: var(--bg-subtle);">
          <span>👤</span> ${user.fullName.split(' ')[0]} ✏️
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.FixNow.openCustomerBookingsModal()">
          📋 My Bookings
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.FixNow.openCustomerProfileModal()">
          👤 Profile
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.FixNowAuth.logout()" title="Sign out">
          Logout
        </button>
        ${navToggleHtml}
      `;

      if (mobileActions) {
        mobileActions.innerHTML = `
          <div style="background: var(--bg-subtle); padding: 10px; border-radius: 8px; text-align: center; font-weight: 700; margin-bottom: 8px;">
            👤 Logged in as: ${user.fullName}
          </div>
          <button class="btn btn-secondary" style="width: 100%; margin-bottom: 6px;" onclick="window.FixNowNotifications.openNotificationsModal()">
            🔔 Notifications
          </button>
          <button class="btn btn-primary" style="width: 100%; margin-bottom: 6px;" onclick="window.FixNow.openCustomerBookingsModal()">
            📋 My Bookings
          </button>
          <button class="btn btn-secondary" style="width: 100%; margin-bottom: 6px;" onclick="window.FixNow.openCustomerProfileModal()">
            👤 Edit Profile
          </button>
          <button class="btn btn-secondary" style="width: 100%;" onclick="window.FixNowAuth.logout()">
            Sign Out
          </button>
        `;
      }
    } else if (user.role === 'provider') {
      // Service Provider Logged In State
      navActions.innerHTML = `
        ${notifBellHtml}
        <a href="provider-dashboard.html" class="user-auth-badge provider" title="Logged in as Service Provider">
          <span>🔧</span> ${user.fullName.split(' ')[0]} (Pro)
        </a>
        <a href="provider-dashboard.html" class="btn btn-primary btn-sm">
          Dashboard
        </a>
        <button class="btn btn-secondary btn-sm" onclick="window.FixNowAuth.logout()" title="Sign out">
          Logout
        </button>
        ${navToggleHtml}
      `;

      if (mobileActions) {
        mobileActions.innerHTML = `
          <div style="background: #eff6ff; color: #1e40af; padding: 10px; border-radius: 8px; text-align: center; font-weight: 700; margin-bottom: 8px;">
            🔧 Provider: ${user.fullName}
          </div>
          <button class="btn btn-secondary" style="width: 100%; margin-bottom: 6px;" onclick="window.FixNowNotifications.openNotificationsModal()">
            🔔 Notifications
          </button>
          <a href="provider-dashboard.html" class="btn btn-primary" style="width: 100%; margin-bottom: 6px;">
            Open Provider Dashboard
          </a>
          <button class="btn btn-secondary" style="width: 100%;" onclick="window.FixNowAuth.logout()">
            Sign Out
          </button>
        `;
      }
    }

    // Initialize notification bell badge counter
    if (window.FixNowNotifications && window.FixNowNotifications.renderBellBadge) {
      window.FixNowNotifications.renderBellBadge();
    }

    // Re-bind navigation toggle after innerHTML replacement
    const newToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (newToggle && mobileMenu) {
      newToggle.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.toggle('open');
        newToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }
  }

  /**
   * Customer Profile Modal Management
   * Allows customer to view and update Full Name, Mobile, Email, and Address
   */
  function openCustomerProfileModal() {
    let modal = document.getElementById('customerProfileModal');
    const user = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;

    if (!user || user.role !== 'customer') {
      showToast('Please log in as a customer to manage your profile.', 'info');
      setTimeout(() => { window.location.href = 'auth.html?role=customer'; }, 600);
      return;
    }

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customerProfileModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 520px; padding: 28px; border-radius: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.4rem;">👤</span>
              <h3 style="margin: 0; font-size: 1.25rem; color: var(--secondary);">Edit Customer Profile</h3>
            </div>
            <button type="button" class="modal-close-btn" onclick="window.FixNow.closeCustomerProfileModal()" style="font-size: 1.6rem; line-height: 1; border: none; background: none; cursor: pointer;">&times;</button>
          </div>

          <form id="customerProfileForm" onsubmit="window.FixNow.handleSaveCustomerProfile(event)">
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="custProfFullName">Full Name *</label>
              <input type="text" id="custProfFullName" class="form-control" required>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="custProfMobile">Contact Mobile Number *</label>
              <input type="tel" id="custProfMobile" class="form-control" required placeholder="10-digit mobile number">
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label" for="custProfEmail">Email Address</label>
              <input type="email" id="custProfEmail" class="form-control" placeholder="name@example.com">
            </div>

            <div class="form-group" style="margin-bottom: 22px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" for="custProfAddress" style="margin: 0;">Default Address / Location Area</label>
                <button type="button" class="btn btn-secondary btn-sm" id="btnDetectCustProfGps" style="padding: 2px 8px; font-size: 0.78rem;">
                  📍 Use Current GPS
                </button>
              </div>
              <input type="text" id="custProfAddress" class="form-control" placeholder="Enter your full address or landmark">
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 16px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.FixNow.closeCustomerProfileModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Profile Changes</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeCustomerProfileModal();
      });

      // Bind GPS detector in customer profile
      const gpsBtn = document.getElementById('btnDetectCustProfGps');
      if (gpsBtn) {
        gpsBtn.addEventListener('click', function () {
          gpsBtn.textContent = '⏳ Locating...';
          getCurrentCoordinates(
            async coords => {
              gpsBtn.textContent = '📍 Use Current GPS';
              let addrStr = `GPS Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
                if (res.ok) {
                  const data = await res.json();
                  addrStr = data.display_name || addrStr;
                }
              } catch (e) {}
              const addrInput = document.getElementById('custProfAddress');
              if (addrInput) addrInput.value = addrStr;
              showToast('Location updated from current GPS!', 'success');
              try {
                localStorage.setItem('fixnow_user_coords', JSON.stringify({
                  lat: coords.lat,
                  lng: coords.lng,
                  address: addrStr
                }));
              } catch (e) {}
            },
            err => {
              gpsBtn.textContent = '📍 Use Current GPS';
              showToast('Location access denied or timed out.', 'warning');
            }
          );
        });
      }
    }

    // Pre-populate fields
    const nameInput = document.getElementById('custProfFullName');
    const mobileInput = document.getElementById('custProfMobile');
    const emailInput = document.getElementById('custProfEmail');
    const addrInput = document.getElementById('custProfAddress');

    if (nameInput) nameInput.value = user.fullName || '';
    if (mobileInput) mobileInput.value = user.mobile || '';
    if (emailInput) emailInput.value = user.email || '';
    if (addrInput) addrInput.value = user.location || user.address || '';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCustomerProfileModal() {
    const modal = document.getElementById('customerProfileModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function handleSaveCustomerProfile(e) {
    e.preventDefault();
    const fullName = document.getElementById('custProfFullName')?.value.trim();
    const mobile = document.getElementById('custProfMobile')?.value.trim();
    const email = document.getElementById('custProfEmail')?.value.trim();
    const address = document.getElementById('custProfAddress')?.value.trim();

    if (!fullName || !mobile) {
      showToast('Please fill in your name and contact mobile number.', 'warning');
      return;
    }

    const res = window.FixNowAuth?.updateCustomerProfile({
      fullName: fullName,
      mobile: mobile,
      email: email,
      location: address,
      address: address
    });

    if (res && res.success) {
      showToast('Customer profile updated successfully!', 'success');
      closeCustomerProfileModal();
      renderAuthHeader();

      // Trigger notification
      if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
        window.FixNowNotifications.addNotification({
          targetRole: 'customer',
          targetUserId: res.user.id,
          title: '👤 Profile Updated',
          message: `Your customer profile for ${res.user.fullName} was updated successfully.`,
          type: 'info'
        });
      }
    } else {
      showToast(res ? res.message : 'Failed to update profile.', 'warning');
    }
  }

  /**
   * Customer "My Bookings" Modal Controller
   */
  function openCustomerBookingsModal() {
    let modal = document.getElementById('customerBookingsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customerBookingsModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 650px;">
          <div class="modal-header">
            <h3>📋 My Service Bookings</h3>
            <button class="modal-close-btn" onclick="window.FixNow.closeCustomerBookingsModal()">&times;</button>
          </div>
          <div id="customerBookingsList" style="max-height: 60vh; overflow-y: auto; padding-right: 4px;">
            <!-- Rendered dynamically -->
          </div>
          <div style="margin-top: 20px; text-align: right; border-top: 1px solid var(--border-color); padding-top: 14px;">
            <button class="btn btn-secondary btn-sm" onclick="window.FixNow.closeCustomerBookingsModal()">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeCustomerBookingsModal();
      });
    }

    renderCustomerBookingsList();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCustomerBookingsModal() {
    const modal = document.getElementById('customerBookingsModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Render Customer Bookings List
   * Syncs real-time statuses (Pending, Accepted, Rejected, Completed)
   */
  function renderCustomerBookingsList() {
    const container = document.getElementById('customerBookingsList');
    if (!container) return;

    const allBookings = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
    const user = window.FixNowAuth?.getCurrentUser();

    // Show bookings matching current customer or recent bookings
    let bookings = allBookings;
    if (user && user.role === 'customer') {
      const userPhone = user.mobile ? user.mobile.replace(/\D/g, '') : '';
      const matched = allBookings.filter(b => {
        if (b.customerId && String(b.customerId) === String(user.id)) return true;
        if (userPhone && b.customerPhone && b.customerPhone.replace(/\D/g, '') === userPhone) return true;
        if (b.customerName && user.fullName && b.customerName.toLowerCase() === user.fullName.toLowerCase()) return true;
        return false;
      });
      // Fallback: If no strict matches found, show all recent bookings to not hide newly made bookings
      bookings = matched.length > 0 ? matched : allBookings;
    }

    if (bookings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 36px 12px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📭</div>
          <h4>No active bookings found</h4>
          <p style="font-size: 0.92rem;">When you book a technician or beautician, your scheduled requests will appear here.</p>
          <a href="services.html" class="btn btn-primary btn-sm" style="margin-top: 14px;" onclick="window.FixNow.closeCustomerBookingsModal()">Find a Service</a>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings.map(b => {
      let statusClass = 'badge-status-attention';
      let statusLabel = b.status || 'Pending';

      if (b.status === 'Accepted') {
        statusClass = 'badge-status-good';
        statusLabel = 'Accepted';
      } else if (b.status === 'Completed') {
        statusClass = 'badge-verified';
        statusLabel = 'Completed';
      } else if (b.status === 'Cancelled' || b.status === 'Rejected') {
        statusClass = 'badge-status-risk';
        statusLabel = b.status;
      }

      const rawPhone = b.providerPhone;
      const cleanPhone = rawPhone ? rawPhone.replace(/[^0-9+]/g, '') : '';

      const callBtn = rawPhone
        ? `<a href="tel:${cleanPhone}" class="btn btn-secondary btn-sm" style="font-size: 0.82rem; min-height: 32px; padding: 4px 10px;">📞 Call Provider</a>`
        : `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Phone number not available.</span>`;

      const chatBtn = `<button class="btn btn-primary btn-sm" style="font-size: 0.82rem; min-height: 32px; padding: 4px 10px;" onclick="window.FixNowChat.openChatModal('${b.requestId}', 'customer')">💬 Chat</button>`;

      let actionsHtml = '';
      if (b.status === 'Pending') {
        actionsHtml = `
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 0.84rem; color: #b45309; font-weight: 600;">
              ⏳ Awaiting provider confirmation...
            </span>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${chatBtn}
              ${callBtn}
              <button class="btn btn-secondary btn-sm" style="color: #b91c1c; border-color: #fca5a5; font-size: 0.82rem; min-height: 32px; padding: 4px 10px;" onclick="window.FixNow.cancelCustomerBooking('${b.requestId}')">
                Cancel
              </button>
            </div>
          </div>
        `;
      } else if (b.status === 'Accepted') {
        actionsHtml = `
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 0.84rem; color: #15803d; font-weight: 700;">
              🎉 Confirmed! Specialist is scheduled.
            </span>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${callBtn}
              ${chatBtn}
              <button class="btn btn-secondary btn-sm" style="color: #b91c1c; border-color: #fca5a5; font-size: 0.82rem; min-height: 32px; padding: 4px 10px;" onclick="window.FixNow.cancelCustomerBooking('${b.requestId}')">
                Cancel
              </button>
            </div>
          </div>
        `;
      } else if (b.status === 'Rejected') {
        actionsHtml = `
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 0.84rem; color: #b91c1c; font-weight: 600;">
              ⚠️ Specialist was unable to accept this request.
            </span>
            <a href="services.html" class="btn btn-primary btn-sm" style="font-size: 0.82rem; min-height: 32px; padding: 4px 10px;" onclick="window.FixNow.closeCustomerBookingsModal()">
              🔍 Find Nearby Specialist
            </a>
          </div>
        `;
      } else if (b.status === 'Cancelled') {
        actionsHtml = `
          <span style="font-size: 0.82rem; color: #b91c1c; font-weight: 600;">
            Booking was cancelled &bull; No active contact actions.
          </span>
        `;
      } else if (b.status === 'Completed') {
        actionsHtml = `
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" style="font-size: 0.82rem; min-height: 32px; padding: 4px 10px;" onclick="window.FixNowChat.openChatModal('${b.requestId}', 'customer')">
              💬 View Chat History
            </button>
            <a href="services.html" class="btn btn-primary btn-sm" style="font-size: 0.82rem; min-height: 32px; padding: 4px 10px;" onclick="window.FixNow.closeCustomerBookingsModal()">
              ⭐ Book Again
            </a>
          </div>
        `;
      }

      return `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="font-size: 1.05rem; color: var(--secondary);">${b.serviceCategory} → ${b.subService || 'General Service'}</strong>
              <div style="font-size: 0.88rem; color: var(--primary); font-weight: 600;">Specialist: ${b.providerName || 'Assigned Specialist'}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge ${statusClass}">● ${statusLabel}</span>
              <div style="font-size: 0.78rem; color: var(--text-light); margin-top: 2px;">ID: #${b.requestId}</div>
            </div>
          </div>

          <div style="font-size: 0.88rem; color: var(--text-muted); margin: 6px 0; line-height: 1.5;">
            <div>📅 <strong>Schedule:</strong> ${b.date} &bull; ${b.timeSlot}</div>
            <div>📍 <strong>Address:</strong> ${b.customerAddress}</div>
            <div style="margin-top: 4px; background: var(--bg-subtle); padding: 6px 10px; border-radius: 6px; font-size: 0.85rem;">
              <strong>Note:</strong> ${b.problemDesc}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
            ${actionsHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  function cancelCustomerBooking(requestId) {
    if (!confirm('Are you sure you want to cancel this service request?')) return;

    const allBookings = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
    const idx = allBookings.findIndex(b => b.requestId === requestId);

    if (idx !== -1) {
      allBookings[idx].status = 'Cancelled';
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(allBookings));
      showToast(`Booking #${requestId} has been cancelled.`, 'info');
      renderCustomerBookingsList();

      // Notify the provider
      if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
        window.FixNowNotifications.addNotification({
          targetRole: 'provider',
          targetUserId: allBookings[idx].providerId,
          bookingId: requestId,
          title: '🚫 Booking Cancelled by Client',
          message: `Customer ${allBookings[idx].customerName} cancelled booking #${requestId}.`,
          type: 'warning',
          action: 'requests'
        });
      }
    }
  }

  // Pre-fill booking customer details if logged in
  function prefillLoggedInCustomer() {
    const user = window.FixNowAuth?.getCurrentUser();
    if (user && user.role === 'customer') {
      const nameInput = document.getElementById('bookingCustomerName');
      const phoneInput = document.getElementById('bookingCustomerPhone');
      const addrInput = document.getElementById('bookingAddress');

      if (nameInput && !nameInput.value) nameInput.value = user.fullName;
      if (phoneInput && !phoneInput.value) phoneInput.value = user.mobile;
      if (addrInput && !addrInput.value && user.location) addrInput.value = user.location;
    }
  }

  // Update openBookingModal to include customer prefill
  const origOpenBookingModal = openBookingModal;
  window.FixNow.openBookingModal = function (providerOrAppliance) {
    origOpenBookingModal(providerOrAppliance);
    prefillLoggedInCustomer();
  };

  // Export methods
  window.FixNow.initNavigation = initNavigation;
  window.FixNow.showToast = showToast;
  window.FixNow.closeBookingModal = closeBookingModal;
  window.FixNow.getCurrentCoordinates = getCurrentCoordinates;
  window.FixNow.renderAuthHeader = renderAuthHeader;
  window.FixNow.openCustomerBookingsModal = openCustomerBookingsModal;
  window.FixNow.closeCustomerBookingsModal = closeCustomerBookingsModal;
  window.FixNow.renderCustomerBookingsList = renderCustomerBookingsList;
  window.FixNow.cancelCustomerBooking = cancelCustomerBooking;
  window.FixNow.openCustomerProfileModal = openCustomerProfileModal;
  window.FixNow.closeCustomerProfileModal = closeCustomerProfileModal;
  window.FixNow.handleSaveCustomerProfile = handleSaveCustomerProfile;

  // Auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initBookingModal();
    renderAuthHeader();
  });
})();
