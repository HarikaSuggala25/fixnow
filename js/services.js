/**
 * FixNow - Find Services Page Controller (services.js)
 * =========================================================================
 * Manages:
 * 1. Category filtering (synced with FIXNOW_CATEGORY_MAP and filter pills)
 * 2. Smart Natural Language Search (powered by identifyCategory single source of truth)
 * 3. GPS Proximity calculations (Haversine distance in km)
 * 4. Error-resilient GPS handling ("Location access is required to find nearby services.")
 * 5. Interactive Leaflet.js OpenStreetMap markers and flyTo centering
 * 6. Dynamic empty state ("No [service category] are currently available in your area.")
 * 7. Provider card badging (Demo Provider vs Registered Pro)
 * =========================================================================
 */

(function () {
  'use strict';

  let leafletMap = null;
  let markersLayer = null;
  let userCoords = { lat: 17.4399, lng: 78.4983 }; // Default Rampur / Secunderabad cluster
  let userMarker = null;
  let currentProviders = [];

  /**
   * Retrieves providers merging clean demo technicians with any newly
   * registered providers stored in localStorage['fixnow_users'].
   */
  function getAllProviders() {
    if (window.FixNowData && typeof window.FixNowData.getEffectiveProviders === 'function') {
      return window.FixNowData.getEffectiveProviders();
    }
    return (window.FixNowData && window.FixNowData.providers) ? window.FixNowData.providers : [];
  }

  /**
   * Calculate distance between two coordinates using Haversine formula (km)
   */
  function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  /**
   * Initialize Leaflet OpenStreetMap
   */
  function initMap() {
    const mapElement = document.getElementById('servicesMap');
    if (!mapElement || typeof L === 'undefined') return;

    try {
      leafletMap = L.map('servicesMap', {
        center: [userCoords.lat, userCoords.lng],
        zoom: 13,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(leafletMap);

      markersLayer = L.layerGroup().addTo(leafletMap);

      // Add User Location Pulse Pin
      updateUserMapMarker();

      // Render provider pins
      renderMapMarkers(currentProviders);
    } catch (e) {
      console.warn('Map initialization note:', e);
    }
  }

  function updateUserMapMarker() {
    if (!leafletMap || typeof L === 'undefined') return;

    if (userMarker) {
      leafletMap.removeLayer(userMarker);
    }

    const userIcon = L.divIcon({
      className: 'user-location-pin',
      html: `<div style="background:#1e40af; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(30,64,175,0.7);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(leafletMap);
    userMarker.bindPopup(`<strong>Your Location</strong><br>GPS Active Area`).openPopup();
  }

  /**
   * Render provider pins on Leaflet Map
   */
  function renderMapMarkers(providersToRender) {
    if (!leafletMap || !markersLayer || typeof L === 'undefined') return;

    markersLayer.clearLayers();

    providersToRender.forEach(p => {
      if (!p.lat || !p.lng) return;

      const providerIcon = L.divIcon({
        className: 'custom-provider-pin',
        html: `
          <div style="background:#0f172a; color:white; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:700; display:flex; align-items:center; gap:4px; box-shadow:0 2px 8px rgba(0,0,0,0.25); border:1px solid #3b82f6;">
            <span>★ ${p.rating}</span> | <span>${p.name.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [80, 26],
        iconAnchor: [40, 13]
      });

      const marker = L.marker([p.lat, p.lng], { icon: providerIcon });

      const popupHtml = `
        <div style="font-family: inherit; min-width: 190px;">
          <h4 style="margin: 0 0 4px; font-size: 14px; color: #0f172a;">${p.name}</h4>
          <p style="margin: 0 0 4px; font-size: 12px; color: #1e40af; font-weight:600;">${p.serviceTitle}</p>
          <p style="margin: 0 0 6px; font-size: 11px; color: #64748b;">📍 ${p.distanceKm} km away • ${p.availability}</p>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <a href="provider.html?id=${p.id}" style="display:inline-block; font-size:11px; background:#f1f5f9; padding:4px 8px; border-radius:4px; text-decoration:none; color:#0f172a; font-weight:600;">Profile</a>
            <button onclick="window.FixNow.openBookingModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" style="font-size:11px; background:#1e40af; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:600;">Book</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayer.addLayer(marker);
    });
  }

  /**
   * Render Provider Cards in UI with dynamic empty state and badges
   */
  function renderProviderCards(providersToRender, activeCategoryKey) {
    const container = document.getElementById('providersContainer');
    const countBadge = document.getElementById('providerCountBadge');
    if (!container) return;

    if (countBadge) {
      countBadge.textContent = `${providersToRender.length} providers found`;
    }

    if (providersToRender.length === 0) {
      let categoryDisplayName = 'service providers';
      if (activeCategoryKey && activeCategoryKey !== 'all' && window.FixNowData && window.FixNowData.categoryMap) {
        const catObj = window.FixNowData.categoryMap[activeCategoryKey];
        if (catObj) {
          categoryDisplayName = catObj.name + 's';
        }
      }

      container.innerHTML = `
        <div style="background: white; border: 1px dashed #cbd5e1; border-radius: 16px; padding: 48px 24px; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
          <h3 style="margin-bottom: 8px;">No providers found in your area. Try expanding your search radius.</h3>
          <p style="color: #64748b; margin-bottom: 20px;">No ${categoryDisplayName} match your current GPS coordinates and radius. Try expanding your search radius or selecting a different service category.</p>
          <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="window.FixNowServices.resetFilters()">Reset All Filters</button>
            <a href="voice.html" class="btn btn-voice btn-sm"><span>🎙️</span> Try Voice Search</a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = providersToRender.map(p => `
      <article class="provider-card" id="provider-card-${p.id}">
        <div class="provider-avatar-box">
          <img src="${p.avatar || p.image}" alt="${p.name}" class="provider-avatar" loading="lazy">
          ${p.verified ? `
            <div class="provider-verified-check" title="FixNow Identity & Background Verified">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          ` : ''}
        </div>

        <div class="provider-info-main">
          <div class="provider-header-row">
            <div>
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <h3 class="provider-name">${p.name}</h3>
                <span class="badge badge-verified" style="font-size:0.75rem;">Verified Pro</span>
              </div>
              <p style="color: var(--primary); font-weight: 600; font-size: 0.98rem; margin-top: 2px;">
                ${p.serviceTitle}
              </p>
            </div>
            
            <div style="text-align: right;">
              <span class="badge ${p.availability && p.availability.toLowerCase().includes('today') ? 'badge-status-good' : 'badge-status-attention'}">
                ● ${p.availability || 'Available'}
              </span>
            </div>
          </div>

          <div class="provider-meta-row">
            <div class="meta-item">
              <span class="rating-stars">★ ${p.rating}</span>
              <span style="color: var(--text-light); font-size: 0.88rem;">(${p.reviewsCount || p.reviewCount || 0} reviews)</span>
            </div>
            <div class="meta-item">
              <span>📍</span>
              <strong>${p.distanceKm} km away</strong>
            </div>
            <div class="meta-item">
              <span>💼</span>
              <span>${p.experienceYears || p.experience || 0} yrs experience</span>
            </div>
          </div>

          <p style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.45; margin-top: 4px;">
            ${p.about && p.about.length > 120 ? p.about.substring(0, 120) + '...' : (p.about || p.description || '')}
          </p>

          <div class="provider-actions-row">
            <a href="provider.html?id=${p.id}" class="btn btn-secondary btn-sm">
              View Profile
            </a>
            <button class="btn btn-secondary btn-sm" onclick="window.FixNowChat.openProviderProfileChat(${JSON.stringify(p).replace(/"/g, '&quot;')})">
              💬 Chat
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.FixNow.openBookingModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
              Book Service
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.FixNowServices.focusOnMap(${p.lat}, ${p.lng})" title="Highlight on Map">
              🗺️ Map
            </button>
          </div>
        </div>
      </article>
    `).join('');
  }

  /**
   * Filter and Sort Logic
   * Fully integrated with unified identifyCategory intelligence
   */
  function applyFiltersAndSort() {
    const categorySelect = document.getElementById('filterCategory');
    const searchInput = document.getElementById('searchKeyword');
    const sortSelect = document.getElementById('sortBy');
    const locationInput = document.getElementById('searchLocation');

    let all = getAllProviders();

    // Recalculate distance to current user coordinates
    all.forEach(p => {
      if (p.lat && p.lng) {
        p.distanceKm = calculateHaversineDistance(userCoords.lat, userCoords.lng, p.lat, p.lng);
      }
    });

    let filtered = [...all];
    let selectedCategory = categorySelect ? categorySelect.value : 'all';
    if (selectedCategory === 'salon') selectedCategory = 'beautician';

    const rawKeyword = searchInput ? searchInput.value.trim() : '';
    let recognizedCategoryKey = null;

    // Check if user input matches a recognized category via identifyCategory
    if (rawKeyword && window.FixNowData && typeof window.FixNowData.identifyCategory === 'function') {
      const matchRes = window.FixNowData.identifyCategory(rawKeyword);
      if (matchRes && matchRes.matched) {
        recognizedCategoryKey = matchRes.categoryId;

        // Sync dropdown if it was set to all
        if (selectedCategory === 'all') {
          selectedCategory = recognizedCategoryKey;
          if (categorySelect) categorySelect.value = recognizedCategoryKey;

          // Sync filter pills
          document.querySelectorAll('.filter-tag-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.category === recognizedCategoryKey);
          });
        }
      }
    }

    // 1. Category Filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const cat = p.serviceCategory || p.category;
        if (selectedCategory === 'beautician') {
          return cat === 'beautician' || cat === 'salon';
        }
        return cat === selectedCategory;
      });
    }

    // 2. Keyword Filter (if keyword is not solely the category keyword itself)
    if (rawKeyword && !recognizedCategoryKey) {
      const kw = rawKeyword.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(kw)) ||
        (p.serviceTitle && p.serviceTitle.toLowerCase().includes(kw)) ||
        (p.about && p.about.toLowerCase().includes(kw)) ||
        (p.locationName && p.locationName.toLowerCase().includes(kw)) ||
        (p.services && Array.isArray(p.services) && p.services.some(s => s.toLowerCase().includes(kw)))
      );
    }

    // 3. Location text filter (if manually typed)
    const locText = locationInput ? locationInput.value.trim().toLowerCase() : '';
    if (locText && !locText.startsWith('gps:')) {
      filtered = filtered.filter(p =>
        (p.locationName && p.locationName.toLowerCase().includes(locText)) ||
        (p.location && p.location.toLowerCase().includes(locText))
      );
    }

    // 4. Service Coverage Radius & Customer Radius Filter
    const radiusSelect = document.getElementById('filterRadius');
    const selectedRadius = radiusSelect ? radiusSelect.value : 'all';
    filtered = filtered.filter(p => {
      const providerCoverage = p.serviceRadius || 10;
      // Match providers whose operating radius covers the customer
      if (p.distanceKm > providerCoverage) return false;

      // Filter by customer's chosen search radius
      if (selectedRadius !== 'all') {
        const maxDist = parseFloat(selectedRadius);
        if (!isNaN(maxDist) && p.distanceKm > maxDist) return false;
      }
      return true;
    });

    // 5. Sorting
    const sortOption = sortSelect ? sortSelect.value : 'distance';
    if (sortOption === 'distance') {
      filtered.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortOption === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === 'experience') {
      filtered.sort((a, b) => (b.experienceYears || b.experience || 0) - (a.experienceYears || a.experience || 0));
    }

    currentProviders = filtered;
    renderProviderCards(filtered, selectedCategory);
    renderMapMarkers(filtered);
  }

  function focusOnMap(lat, lng) {
    if (leafletMap) {
      leafletMap.flyTo([lat, lng], 15, { duration: 1.2 });
      window.FixNow.showToast('Centering map on selected provider', 'info');
      const mapElement = document.getElementById('servicesMap');
      if (mapElement && window.innerWidth < 1024) {
        mapElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function resetFilters() {
    const categorySelect = document.getElementById('filterCategory');
    const searchInput = document.getElementById('searchKeyword');
    const locationInput = document.getElementById('searchLocation');
    const radiusSelect = document.getElementById('filterRadius');
    const sortSelect = document.getElementById('sortBy');

    if (categorySelect) categorySelect.value = 'all';
    if (searchInput) searchInput.value = '';
    if (locationInput) locationInput.value = '';
    if (radiusSelect) radiusSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'distance';

    document.querySelectorAll('.filter-tag-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.category === 'all');
    });

    applyFiltersAndSort();
  }

  /**
   * Trigger Browser GPS
   * Strict error requirement: If denied, show "Location access is required to find nearby services."
   */
  function handleGpsDetection() {
    const btn = document.getElementById('btnDetectGps');
    if (btn) btn.classList.add('loading');

    window.FixNow.getCurrentCoordinates(
      coords => {
        userCoords = { lat: coords.lat, lng: coords.lng };
        const locInput = document.getElementById('searchLocation');
        if (locInput) {
          locInput.value = "GPS: " + coords.name + " (" + coords.lat.toFixed(3) + ", " + coords.lng.toFixed(3) + ")";
        }
        if (leafletMap) {
          leafletMap.flyTo([coords.lat, coords.lng], 13);
          updateUserMapMarker();
        }
        applyFiltersAndSort();
        window.FixNow.showToast('GPS Location acquired: ' + coords.name, 'success');
        if (btn) btn.classList.remove('loading');
      },
      err => {
        // Required exact user-facing feedback
        window.FixNow.showToast('Location access is required to find nearby services.', 'warning');
        if (btn) btn.classList.remove('loading');
      }
    );
  }

  /**
   * Setup UI Event Listeners
   */
  function setupListeners() {
    const categorySelect = document.getElementById('filterCategory');
    const searchInput = document.getElementById('searchKeyword');
    const locationInput = document.getElementById('searchLocation');
    const radiusSelect = document.getElementById('filterRadius');
    const sortSelect = document.getElementById('sortBy');
    const gpsBtn = document.getElementById('btnDetectGps');

    if (categorySelect) categorySelect.addEventListener('change', function () {
      const val = this.value;
      document.querySelectorAll('.filter-tag-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.category === val);
      });
      applyFiltersAndSort();
    });

    if (searchInput) searchInput.addEventListener('input', applyFiltersAndSort);
    if (locationInput) locationInput.addEventListener('input', applyFiltersAndSort);
    if (radiusSelect) radiusSelect.addEventListener('change', applyFiltersAndSort);
    if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSort);
    if (gpsBtn) gpsBtn.addEventListener('click', handleGpsDetection);

    // Filter pills
    document.querySelectorAll('.filter-tag-pill').forEach(pill => {
      pill.addEventListener('click', function () {
        document.querySelectorAll('.filter-tag-pill').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        const cat = this.dataset.category;
        if (categorySelect) {
          categorySelect.value = cat;
          applyFiltersAndSort();
        }
      });
    });

    // Check URL parameters (e.g. ?category=ac-repair or ?category=beautician or ?category=salon)
    const urlParams = new URLSearchParams(window.location.search);
    let categoryParam = urlParams.get('category');
    if (categoryParam === 'salon') categoryParam = 'beautician';

    if (categoryParam && categorySelect) {
      categorySelect.value = categoryParam;
      document.querySelectorAll('.filter-tag-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.category === categoryParam);
      });
    }

    applyFiltersAndSort();
  }

  // Export methods
  window.FixNowServices = {
    init: function () {
      initMap();
      setupListeners();
    },
    resetFilters: resetFilters,
    focusOnMap: focusOnMap,
    applyFiltersAndSort: applyFiltersAndSort
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('providersContainer')) {
      window.FixNowServices.init();
    }
  });
})();
