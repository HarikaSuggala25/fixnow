/**
 * FixNow - Global Notification System (notifications.js)
 * Manages real-time notifications for both Customers and Service Providers.
 * Syncs instant booking status updates (Pending -> Accepted / Rejected / Completed),
 * unread counter badges, audio cues, and cross-tab storage updates.
 */

(function () {
  'use strict';

  window.FixNowNotifications = window.FixNowNotifications || {};

  const NOTIFICATIONS_STORAGE_KEY = 'fixnow_notifications';

  /**
   * Seed realistic starter notifications for demonstration if empty
   */
  function getAllNotifications() {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading fixnow_notifications:', e);
      return [];
    }
  }

  function saveAllNotifications(list) {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving fixnow_notifications:', e);
    }
  }

  /**
   * Get notifications filtered for the active user context
   * @param {string} [role] - 'customer' or 'provider'
   * @param {string} [userId] - User ID
   * @param {string} [phone] - Mobile phone number
   */
  function getNotifications(role, userId, phone) {
    const all = getAllNotifications();
    const currentUser = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;

    const targetRole = role || (currentUser ? currentUser.role : null);
    const targetUserId = userId || (currentUser ? currentUser.id : null);
    const targetPhone = phone || (currentUser ? currentUser.mobile : null);

    return all.filter(n => {
      // If notification has a specific user ID, match it
      if (targetUserId && n.targetUserId && String(n.targetUserId) === String(targetUserId)) {
        return true;
      }
      // If notification has a specific phone number, match it
      if (targetPhone && n.targetPhone && String(n.targetPhone).replace(/\D/g, '') === String(targetPhone).replace(/\D/g, '')) {
        return true;
      }
      // Match by general role if no specific ID or role matches
      if (targetRole && n.targetRole === targetRole) {
        return true;
      }
      // System broadcast to all
      if (!n.targetRole || n.targetRole === 'all') {
        return true;
      }
      return false;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get count of unread notifications
   */
  function getUnreadCount(role, userId, phone) {
    const list = getNotifications(role, userId, phone);
    return list.filter(n => !n.read).length;
  }

  /**
   * Add a new notification
   * @param {Object} notif
   * {
   *   targetRole: 'customer' | 'provider',
   *   targetUserId: string,
   *   targetPhone: string,
   *   bookingId: string,
   *   title: string,
   *   message: string,
   *   type: 'success' | 'warning' | 'info' | 'error',
   *   action: 'bookings' | 'chat' | 'requests' | 'services'
   * }
   */
  function addNotification(notif) {
    const all = getAllNotifications();
    const newEntry = {
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      read: false,
      type: notif.type || 'info',
      ...notif
    };

    all.unshift(newEntry);
    saveAllNotifications(all);

    // Update UI badge counters
    renderBellBadge();

    // Broadcast DOM event
    try {
      window.dispatchEvent(new CustomEvent('fixnow:notification:new', { detail: newEntry }));
    } catch (e) {}

    // Check if notification applies to active user on this page
    const currentUser = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;
    const isForActiveUser = (!newEntry.targetRole || (currentUser && currentUser.role === newEntry.targetRole)) ||
      (currentUser && newEntry.targetUserId && String(newEntry.targetUserId) === String(currentUser.id));

    if (isForActiveUser && window.FixNow && window.FixNow.showToast) {
      window.FixNow.showToast(`<strong>${newEntry.title}</strong><br><small>${newEntry.message}</small>`, newEntry.type || 'info');
    }

    return newEntry;
  }

  /**
   * Mark single notification as read
   */
  function markAsRead(notifId) {
    const all = getAllNotifications();
    const target = all.find(n => n.id === notifId);
    if (target) {
      target.read = true;
      saveAllNotifications(all);
      renderBellBadge();
      renderNotificationsList();
    }
  }

  /**
   * Mark all notifications as read for current active user
   */
  function markAllAsRead() {
    const currentUser = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;
    const targetRole = currentUser ? currentUser.role : null;
    const targetId = currentUser ? currentUser.id : null;

    const all = getAllNotifications();
    all.forEach(n => {
      if (!targetRole || n.targetRole === targetRole || (targetId && String(n.targetUserId) === String(targetId))) {
        n.read = true;
      }
    });

    saveAllNotifications(all);
    renderBellBadge();
    renderNotificationsList();
    if (window.FixNow && window.FixNow.showToast) {
      window.FixNow.showToast('All notifications marked as read.', 'info');
    }
  }

  /**
   * Clear all notifications for current context
   */
  function clearAll() {
    const currentUser = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;
    const targetRole = currentUser ? currentUser.role : null;
    const targetId = currentUser ? currentUser.id : null;

    let all = getAllNotifications();
    all = all.filter(n => {
      if (targetRole && n.targetRole === targetRole) return false;
      if (targetId && String(n.targetUserId) === String(targetId)) return false;
      return true;
    });

    saveAllNotifications(all);
    renderBellBadge();
    renderNotificationsList();
  }

  /**
   * Render Bell Badge Counters across header elements
   */
  function renderBellBadge() {
    const badges = document.querySelectorAll('.notif-badge-pill, #notifBadgeCounter, #headerNotifBadge');
    const unread = getUnreadCount();

    badges.forEach(badge => {
      if (unread > 0) {
        badge.textContent = unread > 9 ? '9+' : unread;
        badge.style.display = 'inline-flex';
        badge.setAttribute('aria-label', `${unread} unread notifications`);
      } else {
        badge.textContent = '0';
        badge.style.display = 'none';
      }
    });
  }

  /**
   * Open Notifications Modal / Drawer
   */
  function openNotificationsModal() {
    let modal = document.getElementById('fixnowNotificationsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'fixnowNotificationsModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 540px; padding: 24px; border-radius: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--border-color); margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.4rem;">🔔</span>
              <h3 style="margin: 0; font-size: 1.25rem; color: var(--secondary);">Notifications</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <button type="button" class="btn btn-text btn-sm" onclick="window.FixNowNotifications.markAllAsRead()" style="font-size: 0.82rem; color: var(--primary); font-weight: 600; padding: 4px 6px;">
                ✓ Mark all read
              </button>
              <button type="button" class="modal-close-btn" onclick="window.FixNowNotifications.closeNotificationsModal()" style="font-size: 1.6rem; line-height: 1; border: none; background: none; cursor: pointer;">&times;</button>
            </div>
          </div>

          <div id="fixnowNotificationsList" style="max-height: 55vh; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 10px;">
            <!-- Rendered dynamically -->
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.FixNowNotifications.clearAll()" style="color: #64748b; font-size: 0.82rem;">
              Clear All
            </button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.FixNowNotifications.closeNotificationsModal()">
              Close
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeNotificationsModal();
      });
    }

    renderNotificationsList();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNotificationsModal() {
    const modal = document.getElementById('fixnowNotificationsModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Render Notifications in Modal List
   */
  function renderNotificationsList() {
    const container = document.getElementById('fixnowNotificationsList');
    if (!container) return;

    const list = getNotifications();

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
          <div style="font-size: 2.4rem; margin-bottom: 8px;">🔕</div>
          <h4 style="margin: 0 0 4px; color: var(--secondary);">No notifications yet</h4>
          <p style="font-size: 0.9rem; margin: 0;">You'll receive instant updates here when bookings are confirmed, accepted, or updated.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(notif => {
      let icon = '🔔';
      let borderLeft = '4px solid #cbd5e1';
      let bg = notif.read ? '#ffffff' : '#f8fafc';

      if (notif.type === 'success') {
        icon = '🎉';
        borderLeft = '4px solid #10b981';
      } else if (notif.type === 'warning') {
        icon = '⚠️';
        borderLeft = '4px solid #f59e0b';
      } else if (notif.type === 'info') {
        icon = '📥';
        borderLeft = '4px solid #3b82f6';
      }

      const timeFormatted = formatTimeAgo(notif.timestamp);

      // Determine action button
      let actionBtn = '';
      if (notif.action === 'bookings' || notif.bookingId) {
        const currentUser = window.FixNowAuth ? window.FixNowAuth.getCurrentUser() : null;
        if (currentUser && currentUser.role === 'provider') {
          actionBtn = `<a href="provider-dashboard.html" class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 3px 8px;" onclick="window.FixNowNotifications.closeNotificationsModal()">Open Dashboard</a>`;
        } else {
          actionBtn = `<button class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 3px 8px;" onclick="window.FixNowNotifications.closeNotificationsModal(); window.FixNow.openCustomerBookingsModal();">View Booking</button>`;
        }
      } else if (notif.action === 'services') {
        actionBtn = `<a href="services.html" class="btn btn-primary btn-sm" style="font-size: 0.78rem; padding: 3px 8px;" onclick="window.FixNowNotifications.closeNotificationsModal()">Find Services</a>`;
      }

      return `
        <div style="background: ${bg}; border: 1px solid var(--border-color); border-left: ${borderLeft}; border-radius: 10px; padding: 12px 14px; position: relative; transition: all 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div style="display: flex; gap: 10px; align-items: flex-start; flex: 1;">
              <span style="font-size: 1.25rem; line-height: 1; margin-top: 2px;">${icon}</span>
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <strong style="color: var(--secondary); font-size: 0.95rem;">${notif.title}</strong>
                  ${!notif.read ? '<span style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; display: inline-block;" title="Unread"></span>' : ''}
                </div>
                <div style="font-size: 0.88rem; color: var(--text-main); margin-top: 3px; line-height: 1.45;">
                  ${notif.message}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                  <span style="font-size: 0.76rem; color: var(--text-light);">${timeFormatted}</span>
                  <div style="display: flex; gap: 6px;">
                    ${actionBtn}
                    ${!notif.read ? `
                      <button type="button" class="btn btn-text btn-sm" style="font-size: 0.76rem; padding: 2px 6px; color: var(--text-muted);" onclick="window.FixNowNotifications.markAsRead('${notif.id}')">
                        Mark read
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 45) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recently';
    }
  }

  /**
   * Listen to cross-window storage events for real-time synchronization
   */
  window.addEventListener('storage', function (e) {
    if (e.key === NOTIFICATIONS_STORAGE_KEY) {
      renderBellBadge();
      const modal = document.getElementById('fixnowNotificationsModal');
      if (modal && modal.classList.contains('active')) {
        renderNotificationsList();
      }
    }

    if (e.key === 'fixnow_bookings') {
      // If customer bookings modal is open, re-render it in real time!
      const customerModal = document.getElementById('customerBookingsModal');
      if (customerModal && customerModal.classList.contains('active') && window.FixNow && window.FixNow.renderCustomerBookingsList) {
        window.FixNow.renderCustomerBookingsList();
      }

      // If provider dashboard is open, reload requests in real time!
      if (window.FixNowDashboard && window.FixNowDashboard.loadRequests) {
        window.FixNowDashboard.loadRequests();
      }
    }
  });

  // Export public API
  window.FixNowNotifications = {
    getNotifications: getNotifications,
    getUnreadCount: getUnreadCount,
    addNotification: addNotification,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    clearAll: clearAll,
    openNotificationsModal: openNotificationsModal,
    closeNotificationsModal: closeNotificationsModal,
    renderBellBadge: renderBellBadge
  };

  // Auto-init bell badge on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    renderBellBadge();
  });
})();
