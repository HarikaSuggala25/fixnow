/**
 * FixNow - Customer ↔ Provider Chat & Contact System (chat.js)
 * =========================================================================
 * Manages:
 * 1. Request-linked persistent messaging stored in localStorage['fixnow_chats'].
 * 2. Contact interactions:
 *    - Pending: Chat enabled; Call available if registered provider phone exists.
 *    - Accepted: Call and Chat fully available.
 *    - Rejected / Cancelled: Active contact actions disabled.
 *    - Completed: Read-only conversation history.
 * 3. Privacy: No fake phone numbers; Displays "Phone number not available." if unlisted.
 * 4. Two-way communication between Customer view and Service Provider Dashboard.
 * =========================================================================
 */

(function () {
  'use strict';

  window.FixNowChat = window.FixNowChat || {};

  const CHATS_STORAGE_KEY = 'fixnow_chats';
  const BOOKINGS_STORAGE_KEY = 'fixnow_bookings';

  let activeChatRequestId = null;
  let activeUserRole = 'customer'; // 'customer' | 'provider'

  // Initialize chat storage without fake/default conversations
  function initSeedChats() {
    const existing = localStorage.getItem(CHATS_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify({}));
    } else {
      try {
        const chats = JSON.parse(existing);
        if (chats && chats['FN-202601']) {
          delete chats['FN-202601'];
          localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
        }
      } catch (e) {}
    }
  }

  function getAllChats() {
    initSeedChats();
    try {
      return JSON.parse(localStorage.getItem(CHATS_STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveAllChats(chats) {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  }

  /**
   * Initialize or retrieve a chat conversation for a specific request ID
   */
  function getChatByRequestId(requestId) {
    const chats = getAllChats();
    if (chats[requestId]) {
      // Sync status from bookings if updated
      const bookings = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
      const b = bookings.find(item => item.requestId === requestId);
      if (b && b.status && b.status !== chats[requestId].status) {
        chats[requestId].status = b.status;
        saveAllChats(chats);
      }
      return chats[requestId];
    }

    // Try finding matching booking to initialize
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
    const b = bookings.find(item => item.requestId === requestId);
    if (b) {
      return initChatFromBooking(b);
    }

    return null;
  }

  /**
   * Create chat entry directly from a booking record
   */
  function initChatFromBooking(booking) {
    const chats = getAllChats();
    const reqId = booking.requestId;

    if (!chats[reqId]) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      chats[reqId] = {
        requestId: reqId,
        customerId: booking.customerId || ('cust-' + Date.now()),
        customerName: booking.customerName || 'Customer',
        customerPhone: booking.customerPhone || '',
        customerAddress: booking.customerAddress || '',
        providerId: booking.providerId || null,
        providerName: booking.providerName || 'Service Provider',
        providerPhone: booking.providerPhone || null,
        serviceCategory: booking.serviceCategory || 'General Service',
        subService: booking.subService || 'General Repair',
        status: booking.status || 'Pending',
        problemDesc: booking.problemDesc || '',
        createdAt: booking.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
        messages: [
          {
            id: 'msg-' + Date.now(),
            senderRole: 'customer',
            senderName: booking.customerName || 'Customer',
            text: booking.problemDesc ? `Booking note: ${booking.problemDesc}` : `Service request initiated for ${booking.subService || booking.serviceCategory}.`,
            timestamp: timeStr
          }
        ]
      };
      saveAllChats(chats);
    }

    return chats[reqId];
  }

  /**
   * Send a new chat message associated with a request ID
   */
  function sendMessage(requestId, senderRole, senderName, text) {
    if (!text || !text.trim()) return null;

    const chats = getAllChats();
    let chat = chats[requestId];
    if (!chat) {
      chat = getChatByRequestId(requestId);
    }
    if (!chat) return null;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      senderRole: senderRole,
      senderName: senderName,
      text: text.trim(),
      timestamp: timeStr
    };

    if (!Array.isArray(chat.messages)) {
      chat.messages = [];
    }
    chat.messages.push(newMsg);
    chat.updatedAt = now.toISOString();

    chats[requestId] = chat;
    saveAllChats(chats);

    // Re-render message feed if currently open
    if (activeChatRequestId === requestId) {
      renderChatMessages(chat);
    }

    return newMsg;
  }

  /**
   * UI: Ensure Chat Modal element exists in DOM
   */
  function ensureChatModalDOM() {
    let modal = document.getElementById('fixnowChatModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'fixnowChatModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content chat-modal-dialog" style="max-width: 580px; padding: 0; overflow: hidden; display: flex; flex-direction: column; max-height: 85vh; border-radius: 16px;">
          <!-- Chat Header -->
          <div class="chat-modal-header" style="background: var(--bg-surface); border-bottom: 1px solid var(--border-color); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 42px; height: 42px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; border: 1px solid #bfdbfe;">
                💬
              </div>
              <div>
                <h3 id="chatModalTitle" style="margin: 0; font-size: 1.12rem; color: var(--secondary);">Chat</h3>
                <div id="chatModalSubTitle" style="font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
                  <!-- Dynamic Request Details -->
                </div>
              </div>
            </div>
            <button class="modal-close-btn" onclick="window.FixNowChat.closeChatModal()" aria-label="Close Chat">&times;</button>
          </div>

          <!-- Contact Bar (Call & Privacy notices based on status) -->
          <div id="chatContactBar" style="padding: 10px 20px; background: #f8fafc; border-bottom: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <!-- Call button or status notice injected dynamically -->
          </div>

          <!-- Message Feed -->
          <div id="chatMessagesFeed" style="flex: 1; overflow-y: auto; padding: 20px; background: #f1f5f9; display: flex; flex-direction: column; gap: 12px; min-height: 280px; max-height: 380px;">
            <!-- Chat bubbles dynamically rendered here -->
          </div>

          <!-- Input Bar -->
          <div id="chatInputBar" style="padding: 14px 20px; background: var(--bg-surface); border-top: 1px solid var(--border-color);">
            <form id="chatMessageForm" style="display: flex; gap: 10px; align-items: center;">
              <input type="text" id="chatInputText" class="form-control" placeholder="Type your message..." style="flex: 1;" autocomplete="off" required>
              <button type="submit" class="btn btn-primary" id="btnChatSend" style="white-space: nowrap; padding: 10px 20px;">
                Send
              </button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener('click', function (e) {
        if (e.target === modal) window.FixNowChat.closeChatModal();
      });

      const form = document.getElementById('chatMessageForm');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const input = document.getElementById('chatInputText');
          const text = input ? input.value : '';
          if (!text || !activeChatRequestId) return;

          const currentUser = window.FixNowAuth?.getCurrentUser();
          let senderName = 'Customer';
          if (activeUserRole === 'provider') {
            senderName = currentUser?.fullName || 'Service Provider';
          } else {
            senderName = currentUser?.fullName || 'Customer';
          }

          sendMessage(activeChatRequestId, activeUserRole, senderName, text);
          if (input) input.value = '';
        });
      }
    }
  }

  /**
   * Open the Chat Modal for a specific request ID
   */
  function openChatModal(requestId, role = 'customer') {
    ensureChatModalDOM();
    activeChatRequestId = requestId;
    activeUserRole = role;

    let chat = getChatByRequestId(requestId);
    if (!chat) {
      if (window.FixNow && window.FixNow.showToast) {
        window.FixNow.showToast(`Request #${requestId} not found.`, 'warning');
      }
      return;
    }

    const modal = document.getElementById('fixnowChatModal');
    const titleEl = document.getElementById('chatModalTitle');
    const subTitleEl = document.getElementById('chatModalSubTitle');
    const contactBar = document.getElementById('chatContactBar');
    const inputBar = document.getElementById('chatInputBar');

    const isCustomer = role === 'customer';
    const targetName = isCustomer ? chat.providerName : chat.customerName;

    if (titleEl) {
      titleEl.textContent = `Chat with ${targetName}`;
    }

    // Subtitle badges: Request ID, Service → Sub-Service, Status
    let statusClass = 'badge-status-attention';
    if (chat.status === 'Accepted') statusClass = 'badge-status-good';
    if (chat.status === 'Completed') statusClass = 'badge-verified';
    if (chat.status === 'Rejected' || chat.status === 'Cancelled') statusClass = 'badge-status-risk';

    if (subTitleEl) {
      subTitleEl.innerHTML = `
        <span class="badge ${statusClass}">● ${chat.status}</span>
        <span>ID: <strong>#${chat.requestId}</strong></span>
        <span>&bull;</span>
        <span style="color: var(--primary); font-weight: 600;">${chat.serviceCategory} → ${chat.subService || 'General'}</span>
      `;
    }

    // Render Contact Actions based on Status & Role (Requirements 18, 19, 21)
    if (contactBar) {
      renderContactBar(contactBar, chat, isCustomer);
    }

    // Input Bar: Disable sending if booking is Cancelled or Rejected
    if (inputBar) {
      if (chat.status === 'Cancelled' || chat.status === 'Rejected') {
        inputBar.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 6px;">
            Booking is ${chat.status.toLowerCase()}. New messages cannot be sent.
          </div>
        `;
      } else {
        inputBar.innerHTML = `
          <form id="chatMessageForm" style="display: flex; gap: 10px; align-items: center;">
            <input type="text" id="chatInputText" class="form-control" placeholder="Type your message..." style="flex: 1;" autocomplete="off" required>
            <button type="submit" class="btn btn-primary" id="btnChatSend" style="white-space: nowrap; padding: 10px 20px;">
              Send
            </button>
          </form>
        `;
        // Re-attach submit handler
        const form = document.getElementById('chatMessageForm');
        if (form) {
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            const input = document.getElementById('chatInputText');
            const text = input ? input.value : '';
            if (!text || !activeChatRequestId) return;

            const currentUser = window.FixNowAuth?.getCurrentUser();
            let senderName = isCustomer ? (currentUser?.fullName || chat.customerName) : (currentUser?.fullName || chat.providerName);
            sendMessage(activeChatRequestId, activeUserRole, senderName, text);
            if (input) input.value = '';
          });
        }
      }
    }

    renderChatMessages(chat);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus input
    setTimeout(() => {
      const input = document.getElementById('chatInputText');
      if (input) input.focus();
    }, 150);
  }

  function renderContactBar(contactBar, chat, isCustomer) {
    const status = chat.status || 'Pending';

    if (status === 'Rejected' || status === 'Cancelled') {
      contactBar.innerHTML = `
        <span style="font-size: 0.85rem; color: #b91c1c; font-weight: 600;">
          ⚠️ Service request ${status.toLowerCase()}. No active contact actions.
        </span>
      `;
      return;
    }

    if (status === 'Completed') {
      contactBar.innerHTML = `
        <span style="font-size: 0.85rem; color: #15803d; font-weight: 600;">
          ✓ Service completed. Viewing conversation history.
        </span>
      `;
      return;
    }

    // Pending or Accepted state
    if (isCustomer) {
      // Customer viewing Provider contact
      const rawPhone = chat.providerPhone;
      let callHtml = '';
      if (rawPhone && rawPhone.trim()) {
        const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
        callHtml = `
          <a href="tel:${cleanPhone}" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            <span>📞</span> Call Provider (${rawPhone})
          </a>
        `;
      } else {
        callHtml = `
          <span style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">
            📞 Phone number not available.
          </span>
        `;
      }

      contactBar.innerHTML = `
        <div style="font-size: 0.84rem; color: var(--text-muted);">
          ${status === 'Accepted' ? '🟢 Booking Accepted &bull; Instant direct contact active' : '⏳ Booking Pending confirmation'}
        </div>
        <div>${callHtml}</div>
      `;
    } else {
      // Provider viewing Customer contact
      const rawPhone = chat.customerPhone;
      let callHtml = '';
      if (rawPhone && rawPhone.trim()) {
        const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
        callHtml = `
          <a href="tel:${cleanPhone}" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            <span>📞</span> Call Customer (${rawPhone})
          </a>
        `;
      } else {
        callHtml = `<span style="font-size: 0.85rem; color: var(--text-muted);">Phone not provided.</span>`;
      }

      contactBar.innerHTML = `
        <div style="font-size: 0.84rem; color: var(--text-muted);">
          Customer: <strong>${chat.customerName}</strong> (${chat.customerAddress || 'Local Area'})
        </div>
        <div>${callHtml}</div>
      `;
    }
  }

  function renderChatMessages(chat) {
    const feed = document.getElementById('chatMessagesFeed');
    if (!feed) return;

    const messages = chat.messages || [];

    if (messages.length === 0) {
      feed.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-size: 0.9rem;">
          💬 No messages yet. Say hello to begin!
        </div>
      `;
      return;
    }

    feed.innerHTML = messages.map(m => {
      const isMe = m.senderRole === activeUserRole;
      const isProvider = m.senderRole === 'provider';

      return `
        <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
          <div style="font-size: 0.76rem; color: var(--text-light); margin-bottom: 3px; padding: 0 4px;">
            ${m.senderName} ${isProvider ? '<span style="font-size: 0.7rem; color: #1e40af; font-weight: 700;">(Pro)</span>' : ''} &bull; ${m.timestamp}
          </div>
          <div style="
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 14px;
            font-size: 0.95rem;
            line-height: 1.45;
            word-break: break-word;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
            ${isMe
              ? 'background: #1e40af; color: white; border-bottom-right-radius: 2px;'
              : 'background: white; color: #0f172a; border-bottom-left-radius: 2px; border: 1px solid #cbd5e1;'}
          ">
            ${m.text}
          </div>
        </div>
      `;
    }).join('');

    feed.scrollTop = feed.scrollHeight;
  }

  function closeChatModal() {
    const modal = document.getElementById('fixnowChatModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      activeChatRequestId = null;
    }
  }

  /**
   * Helper to initiate chat from a provider profile (creates or finds existing booking)
   */
  function openProviderProfileChat(provider) {
    if (!provider) return;

    // Check if customer already has a pending or accepted booking with this provider
    const bookings = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
    const existing = bookings.find(b =>
      b.providerName &&
      (b.providerName.toLowerCase().includes(provider.name.toLowerCase()) || provider.name.toLowerCase().includes(b.providerName.toLowerCase())) &&
      (b.status === 'Pending' || b.status === 'Accepted')
    );

    if (existing) {
      openChatModal(existing.requestId, 'customer');
    } else {
      // Automatically prompt booking or create an inquiry request
      if (window.FixNow && window.FixNow.openBookingModal) {
        window.FixNow.openBookingModal(provider);
        window.FixNow.showToast('Please schedule your service to start direct chatting with ' + provider.name, 'info');
      }
    }
  }

  // Exports
  window.FixNowChat = {
    getChatByRequestId: getChatByRequestId,
    initChatFromBooking: initChatFromBooking,
    sendMessage: sendMessage,
    openChatModal: openChatModal,
    closeChatModal: closeChatModal,
    openProviderProfileChat: openProviderProfileChat
  };

  // Seed on script execution
  initSeedChats();
})();
