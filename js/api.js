/**
 * FixNow - Client-to-Backend MongoDB API Bridge (api.js)
 * Synchronizes client transactions directly with FastAPI + MongoDB.
 * Provides transparent fallback to browser storage if backend is offline.
 */

(function () {
  'use strict';

  const API_BASE = 'http://localhost:8000/api/v1';
  let isBackendOnline = false;

  // Probe backend status on startup
  async function checkBackendHealth() {
    try {
      const res = await fetch('http://localhost:8000/', { method: 'GET', signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        const data = await res.json();
        isBackendOnline = true;
        console.log('⚡ FixNow Backend Connected:', data.database);
        return true;
      }
    } catch (e) {
      isBackendOnline = false;
    }
    return false;
  }

  // Periodic or initial health check
  checkBackendHealth();

  window.FixNowAPI = {
    isOnline: function () {
      return isBackendOnline;
    },

    checkHealth: checkBackendHealth,

    /**
     * Customer Registration -> MongoDB db.users
     */
    registerCustomer: async function (userData) {
      if (await checkBackendHealth()) {
        try {
          const res = await fetch(`${API_BASE}/auth/customer/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: userData.fullName,
              mobile: userData.mobile,
              email: userData.email,
              password: userData.password,
              location: userData.location || userData.address || '',
              latitude: userData.latitude ? parseFloat(userData.latitude) : null,
              longitude: userData.longitude ? parseFloat(userData.longitude) : null
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            return { success: true, user: data.user };
          } else {
            return { success: false, message: data.detail || 'Registration failed' };
          }
        } catch (e) {
          console.warn('Backend sync failed, falling back to local storage:', e);
        }
      }
      return null; // Signals fallback to local auth
    },

    /**
     * Provider Registration -> MongoDB db.users with GeoJSON Point & 2dsphere
     */
    registerProvider: async function (userData) {
      if (await checkBackendHealth()) {
        try {
          const res = await fetch(`${API_BASE}/auth/provider/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: userData.fullName,
              mobile: userData.mobile,
              email: userData.email,
              password: userData.password,
              service_category: userData.serviceCategory,
              service_title: userData.serviceTitle || '',
              experience_years: parseInt(userData.experienceYears, 10) || 5,
              address: userData.address || userData.serviceLocation || '',
              service_area: userData.serviceArea || '',
              city: userData.city || 'Local Area',
              pincode: userData.pincode || '',
              latitude: parseFloat(userData.latitude) || 17.4400,
              longitude: parseFloat(userData.longitude) || 78.4980,
              service_radius: parseInt(userData.serviceRadius, 10) || 10,
              short_description: userData.shortDescription || '',
              pricing: userData.pricing || []
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            return { success: true, provider: data.provider };
          } else {
            return { success: false, message: data.detail || 'Registration failed' };
          }
        } catch (e) {
          console.warn('Backend sync failed, falling back to local storage:', e);
        }
      }
      return null;
    },

    /**
     * User Login -> MongoDB Authentication
     */
    login: async function (emailOrMobile, password, role) {
      if (await checkBackendHealth()) {
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email_or_mobile: emailOrMobile,
              password: password,
              role: role
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            return { success: true, user: data.user, redirectUrl: data.redirectUrl };
          } else {
            return { success: false, message: data.detail || 'Login failed.' };
          }
        } catch (e) {
          console.warn('Backend sync failed, falling back to local auth:', e);
        }
      }
      return null;
    },

    /**
     * Geospatial Provider Search -> MongoDB $geoWithin / $centerSphere
     */
    getNearbyProviders: async function (lat, lng, radiusKm, category) {
      if (await checkBackendHealth()) {
        try {
          const catParam = category ? `&category=${encodeURIComponent(category)}` : '';
          const res = await fetch(`${API_BASE}/providers/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm || 25}${catParam}`);
          if (res.ok) {
            const data = await res.json();
            return data.providers;
          }
        } catch (e) {
          console.warn('Backend provider query failed, falling back to local:', e);
        }
      }
      return null;
    },

    /**
     * Create Booking -> MongoDB db.bookings
     */
    createBooking: async function (booking) {
      if (await checkBackendHealth()) {
        try {
          const res = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_id: booking.customerId,
              customer_name: booking.customerName,
              customer_phone: booking.customerPhone,
              customer_address: booking.customerAddress,
              provider_id: String(booking.providerId),
              provider_name: booking.providerName,
              provider_phone: booking.providerPhone || '',
              service_category: booking.serviceCategory,
              sub_service: booking.subService,
              date: booking.date,
              time_slot: booking.timeSlot,
              problem_desc: booking.problemDesc
            })
          });
          if (res.ok) {
            const data = await res.json();
            return data.booking;
          }
        } catch (e) {
          console.warn('Backend booking sync failed:', e);
        }
      }
      return null;
    },

    /**
     * Update Booking Status -> MongoDB db.bookings
     */
    updateBookingStatus: async function (requestId, newStatus) {
      if (await checkBackendHealth()) {
        try {
          const res = await fetch(`${API_BASE}/bookings/${requestId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          console.warn('Backend booking status update failed:', e);
        }
      }
      return null;
    },

    /**
     * Update Provider Rate Card -> MongoDB db.users
     */
    updateRateCard: async function (providerId, pricingArray) {
      if (await checkBackendHealth()) {
        try {
          const res = await fetch(`${API_BASE}/providers/${providerId}/rate-card`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pricing: pricingArray })
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          console.warn('Backend rate card sync failed:', e);
        }
      }
      return null;
    },

    /**
     * Household Digital Twin: Add Appliance -> MongoDB db.household_appliances
     */
    addAppliance: async function (appliance) {
      if (await checkBackendHealth()) {
        try {
          const res = await fetch(`${API_BASE}/household/appliances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: appliance.id,
              customer_id: appliance.customerId,
              name: appliance.name,
              type: appliance.type,
              brand_model: appliance.brandModel,
              installed_date: appliance.installedDate,
              last_service_date: appliance.lastServiceDate,
              usage_level: appliance.usageLevel,
              status: appliance.status,
              health_score: appliance.healthScore,
              ai_recommendation: appliance.aiRecommendation
            })
          });
          if (res.ok) {
            const data = await res.json();
            return data.appliance;
          }
        } catch (e) {
          console.warn('Backend digital twin sync failed:', e);
        }
      }
      return null;
    },

    /**
     * Household Digital Twin: Delete Appliance -> MongoDB db.household_appliances
     */
    deleteAppliance: async function (applianceId) {
      if (await checkBackendHealth()) {
        try {
          const res = await fetch(`${API_BASE}/household/appliances/${applianceId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          console.warn('Backend digital twin delete failed:', e);
        }
      }
      return null;
    }
  };
})();
