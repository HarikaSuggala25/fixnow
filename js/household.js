/**
 * FixNow - Household Digital Twin & Health Score Controller (household.js)
 * Manages appliance digital twin records, multi-factor predictive health scoring,
 * and AI preventive maintenance risk insights.
 *
 * ZERO DEFAULT APPLIANCES:
 * The digital twin starts with zero default equipment. Homeowners add their real
 * household assets, and FixNow's predictive engine computes live health scores,
 * wear-and-tear degradation, and actionable maintenance advisories.
 *
 * FASTAPI & SCIKIT-LEARN INTEGRATION READY:
 * POST /api/v1/ai/maintenance-risk-score { appliance_type, months_installed, days_since_last_service, usage, symptoms }
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'fixnow_household_data';

  /**
   * Multi-Factor Predictive Health & Risk Inference Engine
   * Calculates dynamic health score and domain-specific preventive recommendations.
   */
  function predictApplianceHealth(appData) {
    const now = new Date();
    const installDate = appData.installedDate ? new Date(appData.installedDate) : now;
    const hasServiceDate = appData.lastServiceDate && appData.lastServiceDate !== 'never' && appData.lastServiceDate.trim() !== '';
    const lastService = hasServiceDate ? new Date(appData.lastServiceDate) : installDate;

    // Time calculations
    const diffMonthsAge = Math.max(0, Math.round((now - installDate) / (1000 * 60 * 60 * 24 * 30.43)));
    const diffMonthsService = Math.max(0, Math.round((now - lastService) / (1000 * 60 * 60 * 24 * 30.43)));

    // Formatted Age string
    let ageText = "Just installed";
    if (diffMonthsAge >= 12) {
      const yrs = Math.floor(diffMonthsAge / 12);
      const mos = diffMonthsAge % 12;
      ageText = yrs === 1 ? "1 yr" : `${yrs} yrs`;
      if (mos > 0) ageText += ` ${mos} mos`;
    } else if (diffMonthsAge > 0) {
      ageText = `${diffMonthsAge} mos`;
    }

    // Base ideal score
    let score = 98;

    // 1. Age Factor (annual degradation based on typical hardware lifespan)
    const annualLifespanRate = {
      'AC': 3.5,            // Typical lifespan 8-10 yrs
      'Refrigerator': 2.5,   // Lifespan 10-12 yrs
      'Washing Machine': 3.0,// Lifespan 8-10 yrs
      'RO': 5.5,            // Filters and membrane degrade rapidly without replacement
      'TV': 2.0,            // Electronics 8-10 yrs
      'Electrical': 2.0,    // Distribution board 12-15 yrs
      'Plumbing': 3.0,      // Pump / valves 7-10 yrs
      'Microwave': 2.5
    };
    const rate = annualLifespanRate[appData.type] || 3.0;
    score -= (diffMonthsAge / 12) * rate;

    // 2. Service Gap Penalty
    const serviceIntervalMonths = {
      'AC': 6,            // AC requires pre-summer and post-monsoon coil check
      'RO': 4,            // RO pre-filter & sediment cartridge change every 4 months
      'Washing Machine': 12,
      'Refrigerator': 12,
      'Plumbing': 12,
      'Electrical': 18,
      'TV': 24,
      'Microwave': 18
    };
    const targetInterval = serviceIntervalMonths[appData.type] || 12;
    if (diffMonthsService > targetInterval) {
      const overdueMonths = diffMonthsService - targetInterval;
      score -= Math.min(32, overdueMonths * 2.8);
    }

    // 3. Operating Intensity Multiplier
    if (appData.usageIntensity === 'high') {
      score -= 8;
    } else if (appData.usageIntensity === 'low') {
      score += 3;
    }

    // 4. Reported Operational Symptoms / Faults
    const symptomDeductions = {
      'none': 0,
      'noise_vibration': 18,
      'cooling_heating_drop': 24,
      'leakage': 28,
      'power_fluctuation': 22,
      'filter_clog': 22
    };
    score -= (symptomDeductions[appData.reportedIssue] || 0);

    // 5. Past Repairs Factor (accumulated mechanical fatigue)
    const pastRepairs = parseInt(appData.repairsCount || 0, 10);
    if (pastRepairs > 0) {
      score -= Math.min(15, pastRepairs * 3.5);
    }

    // Clamp score within realistic bounds [18, 98]
    score = Math.max(18, Math.min(98, Math.round(score)));

    // Categorization
    let status = 'Good Condition';
    let statusCode = 'good';
    let aiRiskScore = 'Low Risk';
    let nextServiceDue = 'Within 6 months';

    if (score < 70) {
      status = 'Attention Needed';
      statusCode = 'risk';
      aiRiskScore = 'Elevated Risk';
      nextServiceDue = 'Urgent (Within 7–14 days)';
    } else if (score < 85) {
      status = 'Maintenance Recommended';
      statusCode = 'attention';
      aiRiskScore = 'Moderate Risk';
      nextServiceDue = 'Within 30–45 days';
    } else {
      status = 'Optimal Operating';
      statusCode = 'good';
      aiRiskScore = 'Low Risk';
      nextServiceDue = 'Scheduled in 6 months';
    }

    // Domain-Specific Engineering Advisories
    let aiRecommendation = '';
    const issue = appData.reportedIssue;

    switch (appData.type) {
      case 'AC':
        if (score < 70) {
          aiRecommendation = issue === 'cooling_heating_drop'
            ? 'Refrigerant pressure drop or heavy coil clogging detected. Immediate chemical jet cleaning and R32 pressure testing advised to prevent compressor burnout.'
            : `AC overdue for service by ${diffMonthsService} months. Deep outdoor condenser coil washing and capacitor test required.`;
        } else if (score < 85) {
          aiRecommendation = 'Seasonal preventive check advised. Wash air filter mesh and check blower wheel to maintain 22% better power efficiency under high heat.';
        } else {
          aiRecommendation = 'AC unit operating in healthy thermal band. Keep outdoor unit vents clear of leaves and dust for continuous efficiency.';
        }
        break;

      case 'Refrigerator':
        if (score < 70) {
          aiRecommendation = issue === 'leakage'
            ? 'Defrost drain hole blockage or drip tray crack detected. Clear internal drain line to stop water pooling beneath the vegetable crisper.'
            : 'Compressor thermal cycle strain observed. Check magnetic door gasket seal and clean rear condenser coils immediately.';
        } else if (score < 85) {
          aiRecommendation = 'Defrost timer and thermostat check advised. Maintain 3°C to 4°C in fresh food section for safe preservation with minimal compressor runtime.';
        } else {
          aiRecommendation = 'Compressor inverter cycles operating within ideal parameters. Wipe door seals monthly with mild baking soda solution.';
        }
        break;

      case 'Washing Machine':
        if (score < 70) {
          aiRecommendation = issue === 'noise_vibration'
            ? 'Heavy spin vibration detected. Inspect drum spider arm, tub suspension shock absorbers, and level base feet to prevent drum collision damage.'
            : 'Drain pump choking or belt slippage detected. Inspect bottom coin trap and check motor carbon brushes.';
        } else if (score < 85) {
          aiRecommendation = 'Limescale buildup on heating element and tub. Run a high-temperature descaling cycle and clear the inlet water mesh filter.';
        } else {
          aiRecommendation = 'Drive motor and drum bearings operating smoothly. Leave lid open 30 minutes post-wash to inhibit mildew growth.';
        }
        break;

      case 'RO':
        if (score < 70) {
          aiRecommendation = `Critical filtration warning: ${diffMonthsService} months elapsed. Replace 5-micron sediment and pre-carbon filter cartridges to prevent irreversible RO membrane fouling.`;
        } else if (score < 85) {
          aiRecommendation = 'Booster pump pressure test and TDS calibration advised. Test rejection rate to verify output water TDS remains below 120 ppm.';
        } else {
          aiRecommendation = 'Membrane rejection rate is healthy. Plan next scheduled filter cartridge change in 3–4 months.';
        }
        break;

      case 'Electrical':
        if (score < 70) {
          aiRecommendation = 'Thermal load overload alert. Terminal tightness check and inverter battery specific gravity test required immediately by a licensed electrician.';
        } else {
          aiRecommendation = 'Distribution switchboard operating within safe voltage range. Top up tubular battery cells with distilled water every 45 days.';
        }
        break;

      case 'Plumbing':
        if (score < 70) {
          aiRecommendation = 'Motor pump mechanical seal or non-return valve leakage detected. Service pump impeller to avoid motor dry-run burn.';
        } else {
          aiRecommendation = 'Water distribution flow and overhead tank float valve operating normally. Schedule annual tank disinfection.';
        }
        break;

      default:
        if (score < 70) {
          aiRecommendation = 'Operational degradation detected. A professional diagnostic inspection is recommended to avoid equipment breakdown.';
        } else {
          aiRecommendation = 'Appliance functioning within standard operating parameters. Maintain routine cleaning.';
        }
    }

    return {
      healthScore: score,
      status: status,
      statusCode: statusCode,
      aiRiskScore: aiRiskScore,
      aiRecommendation: aiRecommendation,
      nextServiceDue: nextServiceDue,
      ageText: ageText,
      diffMonthsService: diffMonthsService
    };
  }

  /**
   * Get household data (from localStorage if present, otherwise empty default)
   */
  function getHouseholdData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.appliances)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored household data, resetting', e);
      }
    }
    return { appliances: [], overallHealthScore: 0, lastAuditDate: null };
  }

  function saveHouseholdData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Compute arithmetic average health score
   */
  function computeOverallScore(appliances) {
    if (!appliances || appliances.length === 0) return 0;
    const total = appliances.reduce((acc, curr) => acc + (curr.healthScore || 80), 0);
    return Math.round(total / appliances.length);
  }

  /**
   * Render Health Score Gauge and Breakdown Bars
   */
  function renderHealthScoreSection(household) {
    const scoreValEl = document.getElementById('healthScoreValue');
    const gaugeCircle = document.getElementById('healthGaugeCircle');
    const breakdownContainer = document.getElementById('systemHealthBars');
    const statusBadge = document.getElementById('healthScoreStatusBadge');
    const auditDateEl = document.getElementById('healthScoreAuditDate');
    const headingEl = document.getElementById('healthScoreHeading');
    const summaryTextEl = document.getElementById('healthScoreSummaryText');

    const apps = household.appliances || [];
    const score = apps.length === 0 ? 0 : computeOverallScore(apps);
    household.overallHealthScore = score;

    if (scoreValEl) {
      scoreValEl.textContent = score;
    }

    if (gaugeCircle) {
      if (apps.length === 0) {
        gaugeCircle.style.background = `
          radial-gradient(circle, #1e293b 65%, transparent 66%),
          conic-gradient(#64748b 0% 100%)
        `;
      } else {
        let color = '#10b981'; // Green
        if (score < 70) color = '#ef4444'; // Red
        else if (score < 85) color = '#f59e0b'; // Amber

        gaugeCircle.style.background = `
          radial-gradient(circle, #1e293b 65%, transparent 66%),
          conic-gradient(${color} 0% ${score}%, #334155 ${score}% 100%)
        `;
      }
    }

    // Dynamic Summary Details
    if (apps.length === 0) {
      if (statusBadge) {
        statusBadge.className = 'badge';
        statusBadge.style.background = '#e2e8f0';
        statusBadge.style.color = '#475569';
        statusBadge.textContent = '● No Data';
      }
      if (auditDateEl) auditDateEl.textContent = 'Awaiting Appliance Input';
      if (headingEl) headingEl.textContent = 'Household System Vitality: 0 / 100';
      if (summaryTextEl) {
        summaryTextEl.innerHTML = 'No appliances registered in your Digital Twin yet. Click <strong>"+ Add Appliance"</strong> above to register your household equipment and compute real-time predictive health scores.';
      }
      if (breakdownContainer) {
        breakdownContainer.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 18px; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.15); border-radius: 10px; text-align: center; color: #94a3b8; font-size: 0.92rem;">
            ⚡ Register your AC, Refrigerator, RO Purifier, or Washing Machine to view live degradation bars.
          </div>
        `;
      }
      return;
    }

    // With Active Appliances
    const healthyCount = apps.filter(a => a.healthScore >= 85).length;
    const attentionCount = apps.filter(a => a.healthScore < 85 && a.healthScore >= 70).length;
    const riskCount = apps.filter(a => a.healthScore < 70).length;

    let overallStatusText = 'Optimal Vitality';
    let overallBadgeClass = 'badge-status-good';
    if (score < 70 || riskCount > 0) {
      overallStatusText = `${riskCount} System(s) At Risk`;
      overallBadgeClass = 'badge-status-risk';
    } else if (score < 85 || attentionCount > 0) {
      overallStatusText = `${attentionCount} Maintenance Due`;
      overallBadgeClass = 'badge-status-attention';
    }

    if (statusBadge) {
      statusBadge.className = `badge ${overallBadgeClass}`;
      statusBadge.textContent = `● Overall Status: ${overallStatusText}`;
    }

    if (auditDateEl) {
      auditDateEl.textContent = `Live Monitored (${apps.length} Assets)`;
    }

    if (headingEl) {
      headingEl.textContent = `Household System Vitality: ${score} / 100`;
    }

    if (summaryTextEl) {
      summaryTextEl.innerHTML = `
        <strong>${healthyCount} system(s)</strong> are operating in prime condition.
        ${attentionCount > 0 ? `<strong>${attentionCount} system(s)</strong> have routine maintenance recommended.` : ''}
        ${riskCount > 0 ? `<span style="color: #fca5a5; font-weight: 700;">⚠️ ${riskCount} system(s) require urgent inspection</span>.` : ''}
      `;
    }

    if (breakdownContainer) {
      breakdownContainer.innerHTML = apps.map(app => {
        let statusClass = 'good';
        let statusText = 'Optimal';
        let statusColor = '#86efac';

        if (app.healthScore < 70) {
          statusClass = 'risk';
          statusText = 'Attention Needed';
          statusColor = '#fca5a5';
        } else if (app.healthScore < 85) {
          statusClass = 'attention';
          statusText = 'Moderate';
          statusColor = '#fde047';
        }

        return `
          <div class="health-bar-item">
            <div class="health-bar-label-row">
              <span style="font-weight: 600;">${app.name} (${app.type})</span>
              <span style="color: ${statusColor}; font-weight: 700;">
                ${statusText} (${app.healthScore}%)
              </span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${statusClass}" style="width: ${app.healthScore}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /**
   * Render AI Maintenance Recommendations
   */
  function renderAiInsights(appliances) {
    const container = document.getElementById('aiInsightsContainer');
    if (!container) return;

    if (!appliances || appliances.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 28px; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-lg); text-align: center;">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🤖</span>
          <h3 style="margin-bottom: 6px; font-size: 1.15rem;">AI Preventive Analytics Inactive</h3>
          <p style="color: var(--text-muted); font-size: 0.92rem; max-width: 520px; margin: 0 auto 14px;">
            Once you add your home appliances and their service history, our diagnostic engine analyzes operating hours, seasonal peak loads, and symptoms to recommend timely servicing before breakdowns happen.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="window.FixNowHousehold.openAddModal();">
              <span>+</span> Add Your Appliance
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.FixNowHousehold.loadSampleAppliances();">
              <span>✨</span> Load Sample Equipment
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Sort by risk priority (lowest health score first)
    const prioritized = [...appliances].sort((a, b) => a.healthScore - b.healthScore);

    container.innerHTML = prioritized.map(app => {
      let priorityClass = 'priority-low';
      let riskBadgeClass = 'badge-status-good';

      if (app.healthScore < 70) {
        priorityClass = 'priority-high';
        riskBadgeClass = 'badge-status-risk';
      } else if (app.healthScore < 85) {
        priorityClass = 'priority-medium';
        riskBadgeClass = 'badge-status-attention';
      }

      return `
        <article class="insight-card ${priorityClass}">
          <div>
            <div class="insight-header">
              <span class="insight-appliance-tag">${app.name} &bull; ${app.brandModel}</span>
              <span class="badge ${riskBadgeClass}">${app.aiRiskScore} (${app.healthScore}%)</span>
            </div>

            <div class="insight-body" style="margin-top: 12px;">
              <p style="margin-bottom: 8px;">
                <strong>AI Maintenance Recommendation:</strong><br>
                ${app.aiRecommendation}
              </p>
              <div style="font-size: 0.82rem; color: var(--text-muted);">
                <strong>Next Service Schedule:</strong> <span style="font-weight: 700; color: ${app.healthScore < 70 ? '#b91c1c' : '#1e40af'};">${app.nextServiceDue || 'Scheduled in 6 months'}</span>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 14px;">
            <span style="font-size: 0.84rem; color: var(--text-light);">
              Last serviced: ${app.lastServiceDate || 'Never recorded'}
            </span>
            <button class="btn btn-primary btn-sm" onclick="window.FixNowHousehold.bookForAppliance('${app.id}')">
              Schedule Service
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Render Appliance Cards (Digital Twin records)
   */
  function renderApplianceCards(appliances) {
    const container = document.getElementById('appliancesContainer');
    if (!container) return;

    if (!appliances || appliances.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 36px 20px; background: var(--bg-surface); border: 2px dashed var(--border-color); border-radius: var(--radius-lg); text-align: center;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #eff6ff; color: #2563eb; font-size: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            🏠
          </div>
          <h3 style="font-size: 1.3rem; margin-bottom: 8px;">Your Digital Twin Is Empty</h3>
          <p style="color: var(--text-muted); max-width: 520px; margin: 0 auto 20px; font-size: 0.98rem; line-height: 1.5;">
            No default or dummy equipment is loaded. Add your actual air conditioner, refrigerator, water purifier, or washing machine to start tracking genuine service history, or load sample equipment to test the predictive engine.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-lg" onclick="window.FixNowHousehold.openAddModal();">
              <span>+</span> Add Your Own Appliance
            </button>
            <button class="btn btn-secondary btn-lg" onclick="window.FixNowHousehold.loadSampleAppliances();">
              <span>✨</span> Load Sample Equipment
            </button>
          </div>
        </div>
      `;
      return;
    }

    const iconMap = {
      'AC': '❄️',
      'Refrigerator': '🧊',
      'Washing Machine': '🧺',
      'RO': '💧',
      'TV': '📺',
      'Electrical': '⚡',
      'Plumbing': '🚰',
      'Microwave': '🍳'
    };

    container.innerHTML = appliances.map(app => {
      const icon = iconMap[app.type] || '⚙️';
      let statusBadge = 'badge-status-good';
      if (app.statusCode === 'risk') statusBadge = 'badge-status-risk';
      if (app.statusCode === 'attention') statusBadge = 'badge-status-attention';

      return `
        <article class="appliance-card" id="${app.id}">
          <div class="appliance-header">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div class="appliance-icon-box">${icon}</div>
              <div>
                <h3 class="appliance-title">${app.name}</h3>
                <p class="appliance-model">${app.brandModel}</p>
              </div>
            </div>
            <span class="badge ${statusBadge}">${app.status}</span>
          </div>

          <div class="appliance-meta-list">
            <div class="appliance-meta-row">
              <span class="meta-label">Installed Date:</span>
              <span class="meta-value">${app.installedDate} (${app.age})</span>
            </div>
            <div class="appliance-meta-row">
              <span class="meta-label">Last Service Date:</span>
              <span class="meta-value">${app.lastServiceDate || 'Never'}</span>
            </div>
            <div class="appliance-meta-row">
              <span class="meta-label">Operating Usage:</span>
              <span class="meta-value" style="text-transform: capitalize;">${app.usageIntensity || 'Standard'} runtime</span>
            </div>
            <div class="appliance-meta-row">
              <span class="meta-label">Reported Symptoms:</span>
              <span class="meta-value">${app.reportedIssue === 'none' ? 'Running Smooth' : (app.reportedIssue || 'None').replace('_', ' ')}</span>
            </div>
            <div class="appliance-meta-row">
              <span class="meta-label">Health Score:</span>
              <span class="meta-value" style="color: ${app.healthScore < 70 ? '#b91c1c' : '#15803d'}; font-weight: 700;">
                ${app.healthScore} / 100
              </span>
            </div>
          </div>

          <div class="appliance-history-box" style="margin-top: 10px;">
            <div class="history-heading">AI Maintenance Advisory:</div>
            <p class="history-text" style="color: var(--secondary); font-weight: 500;">${app.aiRecommendation}</p>
          </div>

          ${app.notes ? `
            <div class="appliance-history-box">
              <div class="history-heading">Homeowner Notes:</div>
              <p class="history-text">${app.notes}</p>
            </div>
          ` : ''}

          <div style="margin-top: auto; display: flex; gap: 8px; padding-top: 14px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" style="flex: 2; min-width: 130px;" onclick="window.FixNowHousehold.bookForAppliance('${app.id}')">
              Schedule Service
            </button>
            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.FixNowHousehold.openLogModal('${app.id}')" title="Log a repair or maintenance to update health score">
              + Log Service
            </button>
            <button class="btn btn-secondary btn-sm" style="color: #b91c1c; border-color: #fca5a5;" onclick="window.FixNowHousehold.deleteAppliance('${app.id}')" title="Remove from Digital Twin">
              🗑️
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Book service for a specific appliance
   */
  function bookForAppliance(applianceId) {
    const household = getHouseholdData();
    const app = household.appliances.find(a => a.id === applianceId);
    if (!app) return;

    if (window.FixNow && window.FixNow.openBookingModal) {
      window.FixNow.openBookingModal({
        name: "Verified " + app.type + " Specialist",
        serviceCategory: app.type,
        serviceTitle: app.type + " Maintenance (" + app.brandModel + ")",
        problemNote: "Preventive maintenance for " + app.name + ". Health score: " + app.healthScore + "%. Issue reported: " + (app.reportedIssue || 'Routine service')
      });
    } else {
      window.location.href = `services.html?q=${encodeURIComponent(app.type)}`;
    }
  }

  /**
   * Delete an appliance from Digital Twin
   */
  function deleteAppliance(applianceId) {
    const household = getHouseholdData();
    const target = household.appliances.find(a => a.id === applianceId);
    const appName = target ? target.name : 'this appliance';

    if (confirm(`Are you sure you want to remove "${appName}" from your Household Digital Twin?`)) {
      household.appliances = household.appliances.filter(a => a.id !== applianceId);
      household.overallHealthScore = computeOverallScore(household.appliances);
      saveHouseholdData(household);

      // Sync deletion to MongoDB backend if online
      if (window.FixNowAPI && typeof window.FixNowAPI.deleteAppliance === 'function') {
        window.FixNowAPI.deleteAppliance(applianceId);
      }

      // Re-render
      renderHealthScoreSection(household);
      renderAiInsights(household.appliances);
      renderApplianceCards(household.appliances);

      if (window.FixNow && window.FixNow.showToast) {
        window.FixNow.showToast(`Removed "${appName}" from Digital Twin.`, 'info');
      }
    }
  }

  /**
   * Quick Log Modal for recording recent service / maintenance
   */
  function openLogModal(applianceId) {
    const household = getHouseholdData();
    const app = household.appliances.find(a => a.id === applianceId);
    if (!app) return;

    const note = prompt(`Enter recent repair or service note for ${app.name}:`, "Conducted comprehensive preventive service and replaced filters/parts.");
    if (note && note.trim()) {
      const todayIso = new Date().toISOString().split('T')[0];
      const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      app.lastServiceDate = todayFormatted;
      app.reportedIssue = 'none'; // Servicing resolved symptoms
      app.repairsCount = (app.repairsCount || 0) + 1;
      app.notes = (app.notes ? app.notes + ' | ' : '') + `${todayFormatted}: ${note.trim()}`;

      // Recalculate health prediction with fresh service date
      const freshPrediction = predictApplianceHealth({
        type: app.type,
        installedDate: app.installedDateRaw || app.installedDate,
        lastServiceDate: todayIso,
        usageIntensity: app.usageIntensity,
        reportedIssue: 'none',
        repairsCount: app.repairsCount
      });

      app.healthScore = freshPrediction.healthScore;
      app.status = freshPrediction.status;
      app.statusCode = freshPrediction.statusCode;
      app.aiRiskScore = freshPrediction.aiRiskScore;
      app.aiRecommendation = freshPrediction.aiRecommendation;
      app.nextServiceDue = freshPrediction.nextServiceDue;

      household.overallHealthScore = computeOverallScore(household.appliances);
      saveHouseholdData(household);

      renderHealthScoreSection(household);
      renderAiInsights(household.appliances);
      renderApplianceCards(household.appliances);

      if (window.FixNow && window.FixNow.showToast) {
        window.FixNow.showToast(`Logged service for ${app.name}. Health score boosted to ${app.healthScore}%!`, 'success');
      }
    }
  }

  /**
   * Modal to add new appliance to the Digital Twin
   */
  function openAddModal() {
    const modal = document.getElementById('addApplianceModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      const dateInput = document.getElementById('newApplianceDate');
      if (dateInput && !dateInput.value) {
        // Default max date to today
        dateInput.max = new Date().toISOString().split('T')[0];
      }
      const firstInput = document.getElementById('newApplianceName');
      if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }
  }

  function closeAddModal() {
    const modal = document.getElementById('addApplianceModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function initAddApplianceModal() {
    const modal = document.getElementById('addApplianceModal');
    const openBtn = document.getElementById('btnOpenAddAppliance');
    const closeBtn = document.getElementById('btnCloseAddAppliance');
    const form = document.getElementById('addApplianceForm');

    if (!modal) return;

    if (openBtn) {
      openBtn.addEventListener('click', openAddModal);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeAddModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAddModal();
      }
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const type = document.getElementById('newApplianceType').value;
        const name = document.getElementById('newApplianceName').value.trim() || (type + ' System');
        const brand = document.getElementById('newApplianceBrand').value.trim() || 'Standard Model';
        const installDateVal = document.getElementById('newApplianceDate').value || new Date().toISOString().split('T')[0];
        const lastServiceVal = document.getElementById('newApplianceLastServiceDate')?.value || '';
        const usage = document.getElementById('newApplianceUsage')?.value || 'medium';
        const issue = document.getElementById('newApplianceIssue')?.value || 'none';
        const repairs = parseInt(document.getElementById('newApplianceRepairs')?.value || '0', 10);
        const notes = document.getElementById('newApplianceNotes')?.value.trim() || '';

        // Run Multi-Factor Predictive Algorithm
        const prediction = predictApplianceHealth({
          type: type,
          installedDate: installDateVal,
          lastServiceDate: lastServiceVal,
          usageIntensity: usage,
          reportedIssue: issue,
          repairsCount: repairs
        });

        // Format dates nicely
        const formattedInstall = installDateVal
          ? new Date(installDateVal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Recently Added';
        const formattedLastService = lastServiceVal
          ? new Date(lastServiceVal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Never recorded';

        const household = getHouseholdData();
        const newApp = {
          id: 'app-' + Date.now(),
          name: name,
          type: type,
          brandModel: brand,
          installedDate: formattedInstall,
          installedDateRaw: installDateVal,
          age: prediction.ageText,
          lastServiceDate: formattedLastService,
          usageIntensity: usage,
          reportedIssue: issue,
          repairsCount: repairs,
          healthScore: prediction.healthScore,
          status: prediction.status,
          statusCode: prediction.statusCode,
          aiRiskScore: prediction.aiRiskScore,
          aiRecommendation: prediction.aiRecommendation,
          nextServiceDue: prediction.nextServiceDue,
          notes: notes,
          createdAt: new Date().toISOString()
        };

        household.appliances.push(newApp);
        household.overallHealthScore = computeOverallScore(household.appliances);
        household.lastAuditDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        saveHouseholdData(household);

        // Sync to MongoDB backend if online
        if (window.FixNowAPI && typeof window.FixNowAPI.addAppliance === 'function') {
          window.FixNowAPI.addAppliance(newApp);
        }

        // Re-render
        renderHealthScoreSection(household);
        renderAiInsights(household.appliances);
        renderApplianceCards(household.appliances);

        closeAddModal();
        form.reset();

        if (window.FixNow && window.FixNow.showToast) {
          window.FixNow.showToast(`Registered "${name}"! Computed Health Score: ${prediction.healthScore}%.`, 'success');
        }
      });
    }
  }

  /**
   * Load Realistic Sample Household Appliances
   * Enables one-click testing of live predictive scoring without manual typing
   */
  function loadSampleAppliances() {
    const today = new Date();
    const pastDate = (monthsAgo) => {
      const d = new Date(today);
      d.setMonth(d.getMonth() - monthsAgo);
      return d.toISOString().split('T')[0];
    };

    const samples = [
      {
        type: 'AC',
        name: 'Master Bedroom Split AC',
        brand: 'Daikin 1.5T 5-Star Inverter',
        installDateVal: pastDate(14),
        lastServiceVal: pastDate(4),
        usage: 'high',
        issue: 'none',
        repairs: 0,
        notes: '5-year comprehensive PCB and compressor warranty. Scheduled pre-summer chemical cleaning.'
      },
      {
        type: 'Refrigerator',
        name: 'Kitchen Double Door Fridge',
        brand: 'Samsung 324L Digital Inverter',
        installDateVal: pastDate(24),
        lastServiceVal: pastDate(8),
        usage: 'medium',
        issue: 'none',
        repairs: 0,
        notes: '10-year inverter compressor warranty. Operates at 3°C.'
      },
      {
        type: 'RO',
        name: 'Water Purifier (Under Sink)',
        brand: 'Kent Grand Plus RO+UV+UF',
        installDateVal: pastDate(18),
        lastServiceVal: pastDate(7),
        usage: 'medium',
        issue: 'filter_clog',
        repairs: 1,
        notes: 'Sediment and carbon filter replacement recommended. TDS set at 95 ppm.'
      },
      {
        type: 'Washing Machine',
        name: 'Utility Balcony Washer',
        brand: 'Bosch 7kg Fully Automatic Front Load',
        installDateVal: pastDate(16),
        lastServiceVal: pastDate(10),
        usage: 'medium',
        issue: 'none',
        repairs: 0,
        notes: 'Runs 4 wash cycles per week with EcoSilence drive motor.'
      }
    ];

    const household = {
      appliances: [],
      overallHealthScore: 0,
      lastAuditDate: today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    samples.forEach((s, idx) => {
      const prediction = predictApplianceHealth({
        type: s.type,
        installedDate: s.installDateVal,
        lastServiceDate: s.lastServiceVal,
        usageIntensity: s.usage,
        reportedIssue: s.issue,
        repairsCount: s.repairs
      });

      const formattedInstall = new Date(s.installDateVal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const formattedLastService = new Date(s.lastServiceVal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      household.appliances.push({
        id: 'app-' + (Date.now() + idx),
        name: s.name,
        type: s.type,
        brandModel: s.brand,
        installedDate: formattedInstall,
        installedDateRaw: s.installDateVal,
        age: prediction.ageText,
        lastServiceDate: formattedLastService,
        usageIntensity: s.usage,
        reportedIssue: s.issue,
        repairsCount: s.repairs,
        healthScore: prediction.healthScore,
        status: prediction.status,
        statusCode: prediction.statusCode,
        aiRiskScore: prediction.aiRiskScore,
        aiRecommendation: prediction.aiRecommendation,
        nextServiceDue: prediction.nextServiceDue,
        notes: s.notes,
        createdAt: new Date().toISOString()
      });
    });

    household.overallHealthScore = computeOverallScore(household.appliances);
    saveHouseholdData(household);

    renderHealthScoreSection(household);
    renderAiInsights(household.appliances);
    renderApplianceCards(household.appliances);

    if (window.FixNow && window.FixNow.showToast) {
      window.FixNow.showToast(`Loaded 4 realistic appliances into Digital Twin! Overall Vitality: ${household.overallHealthScore}%.`, 'success');
    }
  }

  /**
   * Clear All Appliances from Digital Twin
   */
  function clearAllAppliances() {
    if (confirm("Are you sure you want to clear all equipment from your Household Digital Twin?")) {
      const household = {
        appliances: [],
        overallHealthScore: 0,
        lastAuditDate: null
      };
      saveHouseholdData(household);

      renderHealthScoreSection(household);
      renderAiInsights(household.appliances);
      renderApplianceCards(household.appliances);

      if (window.FixNow && window.FixNow.showToast) {
        window.FixNow.showToast('Digital Twin equipment cleared.', 'info');
      }
    }
  }

  // Export Global API
  window.FixNowHousehold = {
    init: function () {
      const data = getHouseholdData();
      renderHealthScoreSection(data);
      renderAiInsights(data.appliances);
      renderApplianceCards(data.appliances);
      initAddApplianceModal();
    },
    predictApplianceHealth: predictApplianceHealth,
    bookForAppliance: bookForAppliance,
    openLogModal: openLogModal,
    deleteAppliance: deleteAppliance,
    openAddModal: openAddModal,
    closeAddModal: closeAddModal,
    loadSampleAppliances: loadSampleAppliances,
    clearAllAppliances: clearAllAppliances,
    getHouseholdData: getHouseholdData
  };

  // Safe DOM ready execution that handles already-loaded documents
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('appliancesContainer')) {
        window.FixNowHousehold.init();
      }
    });
  } else {
    if (document.getElementById('appliancesContainer')) {
      window.FixNowHousehold.init();
    }
  }
})();
