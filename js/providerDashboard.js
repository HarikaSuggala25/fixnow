/**
 * FixNow - Service Provider Dashboard Controller (providerDashboard.js)
 * Manages service requests (Accept / Reject / Mark Completed), upcoming bookings,
 * rate card services, live availability status, and profile updates.
 * Corrected and optimized for Beautician Service Providers.
 */

(function () {
  'use strict';

  window.FixNowDashboard = window.FixNowDashboard || {};

  const BOOKINGS_STORAGE_KEY = 'fixnow_bookings';
  let activeTab = 'requests';

  /**
   * Get all bookings from storage
   */
  function getAllBookings() {
    return JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
  }

  function saveAllBookings(bookings) {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  }

  /**
   * Initialize Dashboard
   */
  function initDashboard() {
    const user = window.FixNowAuth.getCurrentUser();

    // 1. Check Authentication Guard
    const guard = document.getElementById('authGuardOverlay');
    if (!user || user.role !== 'provider') {
      if (guard) guard.style.display = 'flex';
      return;
    } else {
      if (guard) guard.style.display = 'none';
    }

    // 2. Populate Header & Profile Information
    populateProviderHeader(user);

    // 3. Load & Render Bookings
    loadRequests();

    // 4. Render Rate Card & Services
    renderRateCard(user);

    // 5. Render Reviews
    renderReviews(user);

    // 6. Pre-fill Profile Form
    populateProfileForm(user);
  }

  function populateProviderHeader(user) {
    if (!user) return;
    const badgeIconEl = document.querySelector('#headerProviderBadge span:first-child');
    const nameEl = document.getElementById('headerProviderName');
    const greetingEl = document.getElementById('dashGreeting');
    const subTitleEl = document.getElementById('dashSubTitle');
    const avatarEl = document.getElementById('dashAvatar');

    const cat = (user.serviceCategory || '').toLowerCase();
    let catIcon = '🔧';
    if (cat === 'beautician') catIcon = '✂️';
    else if (cat === 'electrician') catIcon = '⚡';
    else if (cat === 'plumber') catIcon = '🚰';
    else if (cat === 'ac-repair' || cat === 'ac') catIcon = '❄️';
    else if (cat === 'mechanic') catIcon = '🛵';

    if (badgeIconEl) badgeIconEl.textContent = catIcon;
    const provName = user.fullName || 'Service Provider';
    if (nameEl) nameEl.textContent = provName;
    if (greetingEl) greetingEl.textContent = `Welcome, ${provName}`;
    if (subTitleEl) {
      const title = user.serviceTitle || (user.serviceCategory ? user.serviceCategory.replace('-', ' ').toUpperCase() + ' Specialist' : 'Service Specialist');
      const exp = user.experienceYears !== undefined ? `${user.experienceYears} Years Field Experience` : 'Registered Provider';
      const loc = user.serviceLocation || user.address || 'Local Service Base';
      subTitleEl.textContent = `${title} • ${exp} • ${loc}`;
    }
    if (avatarEl && user.avatar) avatarEl.src = user.avatar;

    // Availability status
    setAvailabilityUI(user.availability || 'available');
  }

  /**
   * Load Bookings and update KPIs
   */
  function loadRequests() {
    const user = window.FixNowAuth.getCurrentUser();
    const bookings = getAllBookings();

    // Filter relevant to logged-in provider
    const providerId = user ? (user.id || '') : '';
    const providerName = user ? (user.fullName || '').toLowerCase() : '';

    const relevant = bookings.filter(b => {
      if (!user) return false;
      if (b.providerId && String(b.providerId) === String(providerId)) return true;
      if (b.providerName && providerName && b.providerName.toLowerCase().includes(providerName)) return true;
      return false;
    });

    // Calculate Metrics
    const newCount = relevant.filter(b => b.status === 'Pending').length;
    const pendingCount = newCount;
    const approvedCount = relevant.filter(b => b.status === 'Accepted').length;
    const completedCount = (user?.completedJobs || 0) + relevant.filter(b => b.status === 'Completed').length;

    // Update KPI numbers
    const kpiNew = document.getElementById('kpiNewRequests');
    const kpiPending = document.getElementById('kpiPendingRequests');
    const kpiApproved = document.getElementById('kpiApprovedBookings');
    const kpiCompleted = document.getElementById('kpiCompletedServices');
    const kpiRating = document.getElementById('kpiAverageRating');
    const tabCount = document.getElementById('tabCountRequests');

    if (kpiNew) kpiNew.textContent = newCount;
    if (kpiPending) kpiPending.textContent = pendingCount;
    if (kpiApproved) kpiApproved.textContent = approvedCount;
    if (kpiCompleted) kpiCompleted.textContent = completedCount;
    if (kpiRating) kpiRating.textContent = user?.rating ? user.rating.toFixed(1) : (user?.rating === 0 ? '0.0' : 'New');
    if (tabCount) tabCount.textContent = relevant.length;

    // Render Service Requests List
    renderRequestsList(relevant);

    // Render Upcoming Bookings List
    renderUpcomingList(relevant.filter(b => b.status === 'Accepted'));
  }

  /**
   * Render Service Requests List
   */
  function renderRequestsList(requests) {
    const container = document.getElementById('providerRequestsContainer');
    if (!container) return;

    if (requests.length === 0) {
      container.innerHTML = `
        <div style="background: white; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 40px; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📭</div>
          <h3>No incoming service requests right now</h3>
          <p style="color: #64748b;">New client appointments will appear here automatically.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      let statusBadgeClass = 'badge-status-attention';
      if (req.status === 'Accepted') statusBadgeClass = 'badge-status-good';
      if (req.status === 'Completed') statusBadgeClass = 'badge-verified';
      if (req.status === 'Rejected') statusBadgeClass = 'badge-status-risk';

      const isPending = req.status === 'Pending';
      const isAccepted = req.status === 'Accepted';

      return `
        <div class="request-card" id="req-card-${req.requestId}">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px; flex-wrap: wrap;">
              <h3 style="margin: 0; font-size: 1.15rem; color: var(--secondary);">${req.customerName}</h3>
              <span class="badge ${statusBadgeClass}">● ${req.status}</span>
              <span style="font-size: 0.8rem; color: var(--text-light); font-weight: 600;">ID: #${req.requestId}</span>
            </div>

            <div class="request-meta-grid">
              <div><strong>💄 Service:</strong> ${req.serviceCategory}${req.subService ? ' → ' + req.subService : ''}</div>
              <div><strong>📅 Date:</strong> ${req.date}</div>
              <div><strong>⏰ Time:</strong> ${req.timeSlot}</div>
              <div><strong>📍 Location:</strong> ${req.customerAddress}</div>
              <div><strong>📞 Contact:</strong> <a href="tel:${req.customerPhone}" style="color: var(--primary); font-weight: 700;">${req.customerPhone}</a></div>
            </div>

            <div style="background: var(--bg-subtle); border-radius: 8px; padding: 10px 14px; font-size: 0.9rem; color: var(--text-main); margin-top: 8px;">
              <strong>Client Note:</strong> "${req.problemDesc}"
            </div>
          </div>

          <div class="request-actions-col">
            ${isPending ? `
              <button class="btn btn-success btn-sm" onclick="window.FixNowDashboard.updateBookingStatus('${req.requestId}', 'Accepted')">
                ✓ Accept
              </button>
              <button class="btn btn-secondary btn-sm" style="color: #b91c1c; border-color: #fca5a5;" onclick="window.FixNowDashboard.updateBookingStatus('${req.requestId}', 'Rejected')">
                ✕ Reject
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.FixNowChat.openChatModal('${req.requestId}', 'provider')">
                💬 Chat
              </button>
            ` : ''}

            ${isAccepted ? `
              <button class="btn btn-primary btn-sm" onclick="window.FixNowDashboard.updateBookingStatus('${req.requestId}', 'Completed')">
                ✓ Mark Completed
              </button>
              <a href="tel:${req.customerPhone}" class="btn btn-secondary btn-sm">
                📞 Call Client
              </a>
              <button class="btn btn-primary btn-sm" onclick="window.FixNowChat.openChatModal('${req.requestId}', 'provider')">
                💬 Chat
              </button>
            ` : ''}

            ${req.status === 'Completed' ? `
              <span style="color: #15803d; font-weight: 700; font-size: 0.9rem;">Completed Successfully</span>
              <button class="btn btn-secondary btn-sm" onclick="window.FixNowChat.openChatModal('${req.requestId}', 'provider')">
                💬 View Chat History
              </button>
            ` : ''}

            ${req.status === 'Rejected' ? `
              <span style="color: #b91c1c; font-weight: 700; font-size: 0.9rem;">Request Declined</span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render Upcoming Bookings List
   */
  function renderUpcomingList(upcoming) {
    const container = document.getElementById('providerUpcomingContainer');
    if (!container) return;

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div style="background: white; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 40px; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📅</div>
          <h3>No confirmed upcoming beauty appointments scheduled</h3>
          <p style="color: #64748b;">Accept pending client requests to schedule them into your calendar.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = upcoming.map(job => `
      <div class="request-card" style="border-left: 5px solid #10b981;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <h3 style="margin: 0; font-size: 1.15rem;">Scheduled: ${job.customerName}</h3>
            <span class="badge badge-status-good">Confirmed</span>
          </div>
          <p style="font-size: 0.95rem; color: var(--primary); font-weight: 700; margin: 4px 0;">
            💄 ${job.serviceCategory}${job.subService ? ' → ' + job.subService : ''} &bull; ${job.date} (${job.timeSlot})
          </p>
          <p style="font-size: 0.9rem; color: var(--text-muted);">
            📍 Destination: ${job.customerAddress}
          </p>
        </div>
        <div class="request-actions-col">
          <a href="tel:${job.customerPhone}" class="btn btn-secondary btn-sm">
            📞 Call Client
          </a>
          <button class="btn btn-primary btn-sm" onclick="window.FixNowChat.openChatModal('${job.requestId}', 'provider')">
            💬 Chat
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.FixNowDashboard.updateBookingStatus('${job.requestId}', 'Completed')">
            Mark Finished
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Update Booking Status (Accept, Reject, Mark Completed)
   * Dispatches instant real-time notification to the customer.
   */
  function updateBookingStatus(requestId, newStatus) {
    const bookings = getAllBookings();
    const idx = bookings.findIndex(b => b.requestId === requestId);

    if (idx !== -1) {
      bookings[idx].status = newStatus;
      saveAllBookings(bookings);

      // Sync status to MongoDB backend if online
      if (window.FixNowAPI && typeof window.FixNowAPI.updateBookingStatus === 'function') {
        window.FixNowAPI.updateBookingStatus(requestId, newStatus);
      }

      const targetBooking = bookings[idx];
      const serviceTitle = targetBooking.subService || targetBooking.serviceCategory || 'Service';
      const providerName = targetBooking.providerName || (user ? user.fullName : 'Service Provider');

      if (newStatus === 'Accepted') {
        window.FixNow.showToast(`Booking #${requestId} accepted! Client notified.`, 'success');

        if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
          window.FixNowNotifications.addNotification({
            targetRole: 'customer',
            targetUserId: targetBooking.customerId,
            targetPhone: targetBooking.customerPhone,
            bookingId: requestId,
            title: '🎉 Booking Accepted!',
            message: `${providerName} accepted your booking #${requestId} for ${serviceTitle} on ${targetBooking.date} (${targetBooking.timeSlot}). You can now Call or Chat directly.`,
            type: 'success',
            action: 'bookings'
          });
        }
      } else if (newStatus === 'Rejected') {
        window.FixNow.showToast(`Booking #${requestId} has been declined.`, 'info');

        if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
          window.FixNowNotifications.addNotification({
            targetRole: 'customer',
            targetUserId: targetBooking.customerId,
            targetPhone: targetBooking.customerPhone,
            bookingId: requestId,
            title: '⚠️ Booking Declined',
            message: `${providerName} was unable to accept your request #${requestId} for ${serviceTitle}. Click to browse other nearby specialists.`,
            type: 'warning',
            action: 'services'
          });
        }
      } else if (newStatus === 'Completed') {
        window.FixNow.showToast(`Appointment #${requestId} marked as completed! Rating invited.`, 'success');

        if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
          window.FixNowNotifications.addNotification({
            targetRole: 'customer',
            targetUserId: targetBooking.customerId,
            targetPhone: targetBooking.customerPhone,
            bookingId: requestId,
            title: '✅ Service Completed!',
            message: `${providerName} marked your ${serviceTitle} service as completed. Thank you for choosing FixNow!`,
            type: 'success',
            action: 'bookings'
          });
        }
      }

      loadRequests();
    }
  }

  /**
   * Switch Active Tab View
   */
  function showTab(tabName) {
    activeTab = tabName;
    const tabs = ['requests', 'upcoming', 'services', 'availability', 'reviews', 'profile'];

    tabs.forEach(t => {
      const btn = document.getElementById(`tabNav${t.charAt(0).toUpperCase() + t.slice(1)}`);
      const content = document.getElementById(`tabContent${t.charAt(0).toUpperCase() + t.slice(1)}`);

      if (btn) btn.classList.toggle('active', t === tabName);
      if (content) content.style.display = t === tabName ? 'block' : 'none';
    });
  }

  /**
   * Availability Management
   */
  function setAvailability(status) {
    const user = window.FixNowAuth.getCurrentUser();
    if (!user) return;

    user.availability = status;
    window.FixNowAuth.updateProviderProfile({ availability: status });
    setAvailabilityUI(status);

    const labels = {
      available: 'Available Today (Accepting Requests)',
      busy: 'Busy with Client (Delayed Response)',
      unavailable: 'Unavailable / Off Duty'
    };
    window.FixNow.showToast(`Status updated to: ${labels[status]}`, 'info');
  }

  function setAvailabilityUI(status) {
    const btnAvail = document.getElementById('btnAvailAvailable');
    const btnBusy = document.getElementById('btnAvailBusy');
    const btnUnavail = document.getElementById('btnAvailUnavailable');
    const headerBadge = document.getElementById('dashStatusBadge');

    if (btnAvail) btnAvail.className = `avail-pill-btn ${status === 'available' ? 'active-available' : ''}`;
    if (btnBusy) btnBusy.className = `avail-pill-btn ${status === 'busy' ? 'active-busy' : ''}`;
    if (btnUnavail) btnUnavail.className = `avail-pill-btn ${status === 'unavailable' ? 'active-unavailable' : ''}`;

    if (headerBadge) {
      if (status === 'available') {
        headerBadge.className = 'badge badge-status-good';
        headerBadge.textContent = '● Available Today';
      } else if (status === 'busy') {
        headerBadge.className = 'badge badge-status-attention';
        headerBadge.textContent = '● Busy on Site';
      } else {
        headerBadge.className = 'badge badge-status-risk';
        headerBadge.textContent = '● Off Duty';
      }
    }
  }

  function saveWorkingHours(e) {
    e.preventDefault();
    const user = window.FixNowAuth.getCurrentUser();
    const hours = document.getElementById('workingHoursInput').value;
    const radius = document.getElementById('travelRadiusInput').value;
    const baseLoc = (user && user.serviceLocation) ? user.serviceLocation.split('&')[0].trim() : 'Service Area';

    window.FixNowAuth.updateProviderProfile({
      workingHours: hours,
      serviceLocation: `${baseLoc} & ${radius} km radius`,
      serviceRadius: parseInt(radius, 10) || 10
    });

    window.FixNow.showToast('Working hours and radius updated!', 'success');
  }

  /**
   * Rate Card & Services Offered
   * STRICT REQUIREMENT: No default services or prices are given automatically.
   * All services and prices must be manually defined and entered by the provider.
   */
  function renderRateCard(user) {
    const container = document.getElementById('providerRateCardList');
    if (!container) return;

    // Only display services manually added by the provider
    const pricingList = (user && Array.isArray(user.pricing)) ? user.pricing : [];

    if (pricingList.length === 0) {
      container.innerHTML = `
        <div style="background: white; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 42px 20px; text-align: center;">
          <div style="font-size: 2.4rem; margin-bottom: 8px;">📋</div>
          <h3 style="font-size: 1.2rem; color: var(--secondary); margin-bottom: 6px;">No services added to your rate card yet</h3>
          <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 460px; margin: 0 auto 20px; line-height: 1.5;">
            Prices and services are not given by default. Add the specific services and custom rates you offer to your local customers.
          </p>
          <button type="button" class="btn btn-primary" onclick="window.FixNowDashboard.openAddServiceModal()">
            + Manually Add Your First Service &amp; Price
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${pricingList.map((item, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: var(--bg-subtle); border-radius: 10px; border: 1px solid var(--border-color); flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 220px;">
              <div style="font-weight: 700; color: var(--secondary); font-size: 1.05rem;">
                ${item.service}
              </div>
              ${item.description ? `
                <div style="font-size: 0.88rem; color: var(--text-muted); margin-top: 2px;">
                  ${item.description}
                </div>
              ` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
              <span style="color: var(--primary); font-size: 1.15rem; font-weight: 800; background: #eff6ff; padding: 4px 10px; border-radius: 6px; border: 1px solid #bfdbfe;">
                ${item.price.startsWith('₹') ? item.price : '₹' + item.price}
              </span>
              <button type="button" onclick="window.FixNowDashboard.openEditServiceModal(${idx})" class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.85rem;" title="Edit this service">
                ✏️ Edit Price
              </button>
              <button type="button" onclick="window.FixNowDashboard.deleteRateItem(${idx})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.4rem; padding: 0 4px; line-height: 1;" title="Remove service from rate card">
                &times;
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function setSuggestedService(serviceName) {
    const nameInput = document.getElementById('inputServiceName');
    const priceInput = document.getElementById('inputServicePrice');
    if (nameInput) nameInput.value = serviceName;
    if (priceInput) {
      priceInput.value = '';
      priceInput.focus();
    }
    if (window.FixNow && window.FixNow.showToast) {
      window.FixNow.showToast(`Selected "${serviceName}". Please manually enter your price.`, 'info');
    }
  }

  /**
   * Modal Management for Adding & Editing Services
   */
  function openAddServiceModal() {
    const user = window.FixNowAuth.getCurrentUser();
    const modal = document.getElementById('modalAddService');
    const heading = document.getElementById('modalServiceHeading');
    const form = document.getElementById('formAddService');
    const idxInput = document.getElementById('editServiceIndex');
    const cat = (user && user.serviceCategory) ? (user.serviceCategory.charAt(0).toUpperCase() + user.serviceCategory.slice(1)) : 'Service';

    if (!modal) return;
    if (heading) heading.textContent = `+ Add New ${cat} Service`;
    if (idxInput) idxInput.value = '-1';
    if (form) form.reset();

    modal.style.display = 'flex';
    const nameInput = document.getElementById('inputServiceName');
    if (nameInput) nameInput.focus();
  }

  function openEditServiceModal(idx) {
    const user = window.FixNowAuth.getCurrentUser();
    if (!user || !user.pricing || !user.pricing[idx]) return;

    const item = user.pricing[idx];
    const modal = document.getElementById('modalAddService');
    const heading = document.getElementById('modalServiceHeading');
    const idxInput = document.getElementById('editServiceIndex');
    const nameInput = document.getElementById('inputServiceName');
    const priceInput = document.getElementById('inputServicePrice');
    const descInput = document.getElementById('inputServiceDesc');
    const cat = (user && user.serviceCategory) ? (user.serviceCategory.charAt(0).toUpperCase() + user.serviceCategory.slice(1)) : 'Service';

    if (heading) heading.textContent = `✏️ Edit ${cat} Service & Price`;
    if (idxInput) idxInput.value = String(idx);
    if (nameInput) nameInput.value = item.service || '';
    if (priceInput) priceInput.value = item.price || '';
    if (descInput) descInput.value = item.description || '';

    modal.style.display = 'flex';
  }

  function closeAddServiceModal() {
    const modal = document.getElementById('modalAddService');
    if (modal) modal.style.display = 'none';
  }

  function handleSaveNewService(e) {
    e.preventDefault();
    const user = window.FixNowAuth.getCurrentUser();
    if (!user) return;

    const idxInput = document.getElementById('editServiceIndex');
    const nameInput = document.getElementById('inputServiceName');
    const priceInput = document.getElementById('inputServicePrice');
    const descInput = document.getElementById('inputServiceDesc');

    const serviceName = nameInput.value.trim();
    let priceVal = priceInput.value.trim();
    const description = descInput ? descInput.value.trim() : '';

    if (!serviceName || !priceVal) {
      window.FixNow.showToast('Please enter both service name and price.', 'warning');
      return;
    }

    if (!priceVal.startsWith('₹')) {
      priceVal = '₹' + priceVal.replace(/[^\d,.]/g, '');
    }

    if (!Array.isArray(user.pricing)) {
      user.pricing = [];
    }

    const editIndex = parseInt(idxInput.value, 10);
    if (editIndex >= 0 && editIndex < user.pricing.length) {
      user.pricing[editIndex] = {
        service: serviceName,
        price: priceVal,
        description: description
      };
      window.FixNow.showToast(`Updated "${serviceName}" in rate card!`, 'success');
    } else {
      user.pricing.push({
        service: serviceName,
        price: priceVal,
        description: description
      });
      window.FixNow.showToast(`Added "${serviceName}" to rate card!`, 'success');
    }

    // Persist changes
    window.FixNowAuth.updateProviderProfile({ pricing: user.pricing });
    if (window.FixNowAPI && typeof window.FixNowAPI.updateRateCard === 'function') {
      window.FixNowAPI.updateRateCard(user.id, user.pricing);
    }

    closeAddServiceModal();
    renderRateCard(user);
  }

  function deleteRateItem(idx) {
    const user = window.FixNowAuth.getCurrentUser();
    if (!user || !Array.isArray(user.pricing) || idx < 0 || idx >= user.pricing.length) return;

    const removedName = user.pricing[idx].service;
    user.pricing.splice(idx, 1);
    window.FixNowAuth.updateProviderProfile({ pricing: user.pricing });
    renderRateCard(user);
    window.FixNow.showToast(`Removed "${removedName}" from rate card.`, 'info');
  }

  function addNewServicePrompt() {
    openAddServiceModal();
  }

  /**
   * Reviews Rendering
   */
  function renderReviews(user) {
    const container = document.getElementById('dashReviewsContainer');
    if (!container) return;

    const reviews = (user && Array.isArray(user.reviews)) ? user.reviews : [];
    if (reviews.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; background: var(--bg-subtle); border: 1px dashed var(--border-color); border-radius: 12px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 6px;">⭐</div>
          <h4 style="margin-bottom: 4px; font-size: 1.05rem; color: var(--secondary);">No Customer Reviews Yet</h4>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            When clients book your services and complete their appointments, their verified ratings and feedback will appear here automatically.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(r => `
      <div class="review-item">
        <div class="review-header">
          <span class="reviewer-name">${r.name || 'Verified Customer'}</span>
          <span class="review-date">${r.date || 'Recent'}</span>
        </div>
        <div style="color: #f59e0b; margin-bottom: 4px;">${'★'.repeat(r.rating || 5)} (${r.rating || 5}.0)</div>
        <p style="color: var(--text-muted); font-size: 0.95rem;">"${r.comment}"</p>
      </div>
    `).join('');
  }

  /**
   * Profile Management Form
   */
  function populateProfileForm(user) {
    if (!user) return;
    const nameInput = document.getElementById('profName');
    const mobileInput = document.getElementById('profMobile');
    const catInput = document.getElementById('profCategory');
    const expInput = document.getElementById('profExp');
    const locInput = document.getElementById('profLocation');
    const descInput = document.getElementById('profDesc');
    const avatarInput = document.getElementById('profAvatar');

    if (nameInput) nameInput.value = user.fullName || '';
    if (mobileInput) mobileInput.value = user.mobile || '';
    if (catInput) catInput.value = user.serviceCategory || '';
    if (expInput) expInput.value = user.experienceYears !== undefined ? user.experienceYears : '';
    if (locInput) locInput.value = user.serviceLocation || user.address || '';
    if (descInput) descInput.value = user.shortDescription || '';
    if (avatarInput) avatarInput.value = user.avatar || '';
  }

  let detectedWorkshopCoords = null;

  function detectWorkshopLocation() {
    const btn = document.getElementById('btnDetectProvProfGps');
    if (btn) btn.textContent = '⏳ Locating...';

    if (!navigator.geolocation) {
      if (btn) btn.textContent = '📍 Detect Workshop GPS';
      if (window.FixNow && window.FixNow.showToast) window.FixNow.showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        if (btn) btn.textContent = '📍 Detect Workshop GPS';
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        detectedWorkshopCoords = coords;
        let addrStr = `GPS Workshop (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
          if (res.ok) {
            const data = await res.json();
            addrStr = data.display_name || addrStr;
          }
        } catch (e) {}

        const locInput = document.getElementById('profLocation');
        if (locInput) locInput.value = addrStr;
        if (window.FixNow && window.FixNow.showToast) window.FixNow.showToast('Workshop location detected from current GPS!', 'success');
      },
      err => {
        if (btn) btn.textContent = '📍 Detect Workshop GPS';
        if (window.FixNow && window.FixNow.showToast) window.FixNow.showToast('Unable to retrieve workshop GPS: ' + err.message, 'warning');
      },
      { timeout: 7000 }
    );
  }

  function saveProfile(e) {
    e.preventDefault();

    const updated = {
      fullName: document.getElementById('profName').value.trim(),
      mobile: document.getElementById('profMobile').value.trim(),
      serviceCategory: document.getElementById('profCategory').value,
      experienceYears: parseInt(document.getElementById('profExp').value, 10),
      serviceLocation: document.getElementById('profLocation').value.trim(),
      shortDescription: document.getElementById('profDesc').value.trim(),
      avatar: document.getElementById('profAvatar').value.trim()
    };

    if (detectedWorkshopCoords) {
      updated.latitude = detectedWorkshopCoords.lat;
      updated.longitude = detectedWorkshopCoords.lng;
    }

    const res = window.FixNowAuth.updateProviderProfile(updated);
    if (res.success) {
      window.FixNow.showToast('Provider profile updated successfully!', 'success');
      populateProviderHeader(res.user);
      if (window.FixNowNotifications && window.FixNowNotifications.addNotification) {
        window.FixNowNotifications.addNotification({
          targetRole: 'provider',
          targetUserId: res.user.id,
          title: '👤 Profile Updated',
          message: `Your professional profile for ${res.user.fullName} was updated successfully.`,
          type: 'info'
        });
      }
    }
  }

  // Export methods
  window.FixNowDashboard = {
    init: initDashboard,
    loadRequests: loadRequests,
    updateBookingStatus: updateBookingStatus,
    showTab: showTab,
    setAvailability: setAvailability,
    saveWorkingHours: saveWorkingHours,
    addNewServicePrompt: addNewServicePrompt,
    openAddServiceModal: openAddServiceModal,
    openEditServiceModal: openEditServiceModal,
    closeAddServiceModal: closeAddServiceModal,
    handleSaveNewService: handleSaveNewService,
    deleteRateItem: deleteRateItem,
    saveProfile: saveProfile,
    detectWorkshopLocation: detectWorkshopLocation,
    setSuggestedService: setSuggestedService
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('providerRequestsContainer')) {
      window.FixNowDashboard.init();
    }
  });
})();
