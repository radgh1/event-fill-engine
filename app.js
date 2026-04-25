(function () {
  const STORAGE_KEY = "eventFillEngine.v3";
  const LEGACY_STORAGE_KEY = "eventFillEngine.v1";

  const LEAD_STATUSES = [
    "New",
    "Contacted",
    "Interested",
    "Registered",
    "Confirmed",
    "Checked In",
    "Not Interested"
  ];

  const ATTENDEE_STATUSES = ["Registered", "Confirmed", "Checked In"];

  const DEFAULT_PLANNER = {
    targetAttendance: 75,
    showRate: 60,
    conversionRate: 25
  };

  const state = {
    events: [],
    activeEventId: null,
    selectedLeadId: null,
    cityFilter: "all",
    planner: {
      targetAttendance: DEFAULT_PLANNER.targetAttendance,
      showRate: DEFAULT_PLANNER.showRate,
      conversionRate: DEFAULT_PLANNER.conversionRate
    },
    activeTab: "overview"
  };

  const els = {
    tabList: document.getElementById("tabList"),
    tabPanels: Array.from(document.querySelectorAll(".tab-panel")),

    eventSelector: document.getElementById("eventSelector"),
    newEventBtn: document.getElementById("newEventBtn"),

    loadDemoBtn: document.getElementById("loadDemoBtn"),
    resetDemoBtn: document.getElementById("resetDemoBtn"),
    clearDataBtn: document.getElementById("clearDataBtn"),
    exportPlanBtn: document.getElementById("exportPlanBtn"),

    readyBadge: document.getElementById("readyBadge"),
    architectureDialog: document.getElementById("architectureDialog"),
    closeArchitectureDialog: document.getElementById("closeArchitectureDialog"),

    outcomeBanner: document.getElementById("outcomeBanner"),
    campaignStatusBadge: document.getElementById("campaignStatusBadge"),
    campaignStatusBullets: document.getElementById("campaignStatusBullets"),
    nextActionsList: document.getElementById("nextActionsList"),

    dashboardMetrics: document.getElementById("dashboardMetrics"),
    goalProgressText: document.getElementById("goalProgressText"),
    goalProgressBar: document.getElementById("goalProgressBar"),

    eventForm: document.getElementById("eventForm"),
    eventSaveStatus: document.getElementById("eventSaveStatus"),

    leadImportForm: document.getElementById("leadImportForm"),
    leadCsvInput: document.getElementById("leadCsvInput"),
    leadImportStatus: document.getElementById("leadImportStatus"),
    leadsTableBody: document.getElementById("leadsTableBody"),

    cityFilterSelect: document.getElementById("cityFilterSelect"),
    cityCounts: document.getElementById("cityCounts"),
    topCityInsight: document.getElementById("topCityInsight"),

    scriptLeadLabel: document.getElementById("scriptLeadLabel"),
    scriptsOutput: document.getElementById("scriptsOutput"),

    reminderTableBody: document.getElementById("reminderTableBody"),

    campaignPlannerForm: document.getElementById("campaignPlannerForm"),
    plannerTargetAttendance: document.getElementById("plannerTargetAttendance"),
    plannerShowRate: document.getElementById("plannerShowRate"),
    plannerConversionRate: document.getElementById("plannerConversionRate"),
    funnelTargetSummary: document.getElementById("funnelTargetSummary"),
    campaignPlannerMetrics: document.getElementById("campaignPlannerMetrics"),
    campaignFunnel: document.getElementById("campaignFunnel"),
    expectedFunnelOutput: document.getElementById("expectedFunnelOutput"),

    attendeeForm: document.getElementById("attendeeForm"),
    attendeeSaveStatus: document.getElementById("attendeeSaveStatus"),
    attendeesTableBody: document.getElementById("attendeesTableBody"),

    checkinSearchInput: document.getElementById("checkinSearchInput"),
    checkedInCount: document.getElementById("checkedInCount"),
    checkinList: document.getElementById("checkinList"),

    analyticsGrid: document.getElementById("analyticsGrid"),
    leadNeedPanel: document.getElementById("leadNeedPanel"),
    performanceInsightsGrid: document.getElementById("performanceInsightsGrid"),
    improvementTips: document.getElementById("improvementTips")
  };

  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeLeadStatus(status) {
    const cleaned = String(status || "").trim();
    const found = LEAD_STATUSES.find(function (item) {
      return item.toLowerCase() === cleaned.toLowerCase();
    });
    return found || "New";
  }

  function normalizeAttendeeStatus(status) {
    const cleaned = String(status || "").trim();
    const found = ATTENDEE_STATUSES.find(function (item) {
      return item.toLowerCase() === cleaned.toLowerCase();
    });
    return found || "Registered";
  }

  function statusClass(status) {
    return "status-" + String(status || "").toLowerCase().replace(/\s+/g, "");
  }

  function getHeadcount(attendee) {
    return 1 + Math.max(0, toNumber(attendee.guestCount));
  }

  function normalizeEvent(event) {
    const normalized = {
      id: event.id || uid("evt"),
      name: event.name || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || "",
      goal: toNumber(event.goal),
      topic: event.topic || "",
      audienceNotes: event.audienceNotes || "",
      leads: Array.isArray(event.leads)
        ? event.leads.map(function (lead) {
            return {
              id: lead.id || uid("lead"),
              name: lead.name || "",
              phone: lead.phone || "",
              email: lead.email || "",
              condition: lead.condition || "",
              city: lead.city || "Unknown",
              status: normalizeLeadStatus(lead.status),
              notes: lead.notes || "",
              createdAt: lead.createdAt || new Date().toISOString()
            };
          })
        : [],
      attendees: Array.isArray(event.attendees)
        ? event.attendees.map(function (attendee) {
            const status = normalizeAttendeeStatus(attendee.status);
            const checkedIn = Boolean(attendee.checkedIn) || status === "Checked In";
            return {
              id: attendee.id || uid("att"),
              name: attendee.name || "",
              phone: attendee.phone || "",
              email: attendee.email || "",
              guestCount: toNumber(attendee.guestCount),
              status: checkedIn ? "Checked In" : status,
              checkedIn: checkedIn,
              notes: attendee.notes || "",
              createdAt: attendee.createdAt || new Date().toISOString()
            };
          })
        : []
    };

    return normalized;
  }

  function migrateLegacy(parsed) {
    if (Array.isArray(parsed.events) && parsed.events.length > 0) {
      return {
        events: parsed.events.map(normalizeEvent),
        activeEventId: parsed.activeEventId || parsed.events[0].id,
        selectedLeadId: parsed.selectedLeadId || null,
        cityFilter: parsed.cityFilter || "all",
        planner: {
          targetAttendance: toNumber(parsed.planner && parsed.planner.targetAttendance) || DEFAULT_PLANNER.targetAttendance,
          showRate: toNumber(parsed.planner && parsed.planner.showRate) || DEFAULT_PLANNER.showRate,
          conversionRate: toNumber(parsed.planner && parsed.planner.conversionRate) || DEFAULT_PLANNER.conversionRate
        },
        activeTab:
          (parsed.activeTab === "dashboard"
            ? "overview"
            : parsed.activeTab === "registration"
            ? "attendees"
            : parsed.activeTab === "analytics"
            ? "performance"
            : parsed.activeTab) || "overview"
      };
    }

    if (parsed.event || parsed.leads || parsed.attendees) {
      const legacyEvent = normalizeEvent({
        id: uid("evt"),
        name: parsed.event && parsed.event.name,
        date: parsed.event && parsed.event.date,
        time: parsed.event && parsed.event.time,
        location: parsed.event && parsed.event.location,
        goal: parsed.event && parsed.event.goal,
        topic: parsed.event && parsed.event.topic,
        audienceNotes: parsed.event && parsed.event.audienceNotes,
        leads: parsed.leads || [],
        attendees: parsed.attendees || []
      });
      return {
        events: [legacyEvent],
        activeEventId: legacyEvent.id,
        selectedLeadId: null,
        cityFilter: "all",
        planner: {
          targetAttendance: DEFAULT_PLANNER.targetAttendance,
          showRate: DEFAULT_PLANNER.showRate,
          conversionRate: DEFAULT_PLANNER.conversionRate
        },
        activeTab: "overview"
      };
    }

    return null;
  }

  function saveState() {
    const payload = {
      events: state.events,
      activeEventId: state.activeEventId,
      selectedLeadId: state.selectedLeadId,
      cityFilter: state.cityFilter,
      planner: state.planner,
      activeTab: state.activeTab
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        return false;
      }
      const parsed = JSON.parse(raw);
      const migrated = migrateLegacy(parsed);
      if (!migrated) {
        return false;
      }

      state.events = migrated.events;
      state.activeEventId = migrated.activeEventId;
      state.selectedLeadId = migrated.selectedLeadId;
      state.cityFilter = migrated.cityFilter;
      state.planner = migrated.planner;
      state.activeTab = migrated.activeTab;

      if (!state.events.find(function (evt) { return evt.id === state.activeEventId; })) {
        state.activeEventId = state.events[0] ? state.events[0].id : null;
      }

      return state.events.length > 0;
    } catch (_error) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }

  function setStatusText(node, text, duration) {
    node.textContent = text;
    if (duration && duration > 0) {
      window.setTimeout(function () {
        if (node.textContent === text) {
          node.textContent = "";
        }
      }, duration);
    }
  }

  function getActiveEvent() {
    return state.events.find(function (event) {
      return event.id === state.activeEventId;
    }) || null;
  }

  function setActiveEvent(eventId) {
    if (!state.events.find(function (event) { return event.id === eventId; })) {
      return;
    }
    state.activeEventId = eventId;
    state.selectedLeadId = null;
    state.cityFilter = "all";
    saveState();
    renderAll();
  }

  function switchTab(tab) {
    state.activeTab = tab;
    renderTabs();
    saveState();
  }

  function renderTabs() {
    const buttons = Array.from(document.querySelectorAll(".tab-btn"));
    buttons.forEach(function (button) {
      const isActive = button.dataset.tab === state.activeTab;
      button.classList.toggle("active", isActive);
    });

    els.tabPanels.forEach(function (panel) {
      const isActive = panel.dataset.panel === state.activeTab;
      panel.classList.toggle("active", isActive);
    });
  }

  function renderEventSelector() {
    const active = getActiveEvent();
    els.eventSelector.innerHTML = state.events
      .map(function (event) {
        const selected = active && event.id === active.id ? " selected" : "";
        return "<option value=\"" + escapeHtml(event.id) + "\"" + selected + ">" + escapeHtml(event.name || "Untitled Event") + "</option>";
      })
      .join("");
  }

  function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      const next = line[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }

    values.push(current.trim());
    return values;
  }

  function computeMetrics(event) {
    const totalLeads = event.leads.length;
    const registrations = event.attendees.length;
    const confirmed = event.attendees.filter(function (attendee) {
      return attendee.status === "Confirmed" || attendee.status === "Checked In";
    }).length;
    const expectedAttendance = event.attendees.reduce(function (sum, attendee) {
      return sum + getHeadcount(attendee);
    }, 0);
    const checkedInHeadcount = event.attendees.reduce(function (sum, attendee) {
      return attendee.checkedIn ? sum + getHeadcount(attendee) : sum;
    }, 0);
    const checkedInPeople = event.attendees.filter(function (attendee) {
      return attendee.checkedIn;
    }).length;
    const goal = Math.max(0, toNumber(event.goal));

    return {
      totalLeads: totalLeads,
      registrations: registrations,
      confirmed: confirmed,
      expectedAttendance: expectedAttendance,
      checkedInHeadcount: checkedInHeadcount,
      checkedInPeople: checkedInPeople,
      goal: goal,
      seatsRemaining: Math.max(goal - expectedAttendance, 0),
      progressPct: goal > 0 ? clamp(Math.round((expectedAttendance / goal) * 100), 0, 100) : 0,
      leadToRegistrationPct: totalLeads > 0 ? (expectedAttendance / totalLeads) * 100 : 0,
      registrationToShowPct: expectedAttendance > 0 ? (checkedInHeadcount / expectedAttendance) * 100 : 0,
      overallConversionPct: totalLeads > 0 ? (checkedInHeadcount / totalLeads) * 100 : 0
    };
  }

  function computePlanner() {
    const event = getActiveEvent();
    const metrics = computeMetrics(event);

    const targetAttendance = Math.max(1, toNumber(state.planner.targetAttendance));
    const showRatePct = clamp(toNumber(state.planner.showRate), 1, 100);
    const conversionRatePct = clamp(toNumber(state.planner.conversionRate), 1, 100);

    const showRate = showRatePct / 100;
    const conversionRate = conversionRatePct / 100;

    const requiredRegistrations = Math.ceil(targetAttendance / showRate);
    const requiredLeads = Math.ceil(requiredRegistrations / conversionRate);
    const projectedLow = Math.floor(requiredRegistrations * 0.75);
    const projectedHigh = Math.ceil(requiredRegistrations * 1.0);

    // Current-trajectory: what the actual lead count is expected to produce in attendees
    const currentProjectedRegistrations = Math.floor(event.leads.length * conversionRate);
    const currentProjectedLowRaw = Math.floor(currentProjectedRegistrations * showRate * 0.75);
    const currentProjectedHighRaw = Math.ceil(currentProjectedRegistrations * showRate);
    // Never show a projected range lower than what is already confirmed via attendees
    const currentProjectedLow = Math.max(currentProjectedLowRaw, metrics.expectedAttendance);
    const currentProjectedHigh = Math.max(currentProjectedHighRaw, metrics.expectedAttendance);

    // Lead needs to close the gap to goal, using high and low conversion rate assumptions
    const highConversionRate = conversionRate;
    const lowConversionRate = Math.max(conversionRate * 0.75, 0.01);
    const seatsRemaining = metrics.seatsRemaining;
    const lowLeadNeed = seatsRemaining > 0 ? Math.ceil(seatsRemaining / highConversionRate) : 0;
    const highLeadNeed = seatsRemaining > 0 ? Math.ceil(seatsRemaining / lowConversionRate) : 0;

    const gapVsCurrentLeads = Math.max(requiredLeads - event.leads.length, 0);
    const gapVsCurrentRegistered = Math.max(requiredRegistrations - event.attendees.length, 0);

    const contacts = Math.ceil(requiredLeads * 0.65);
    const interested = Math.ceil(contacts * 0.55);

    return {
      targetAttendance: targetAttendance,
      showRatePct: showRatePct,
      conversionRatePct: conversionRatePct,
      requiredRegistrations: requiredRegistrations,
      requiredLeads: requiredLeads,
      projectedLow: projectedLow,
      projectedHigh: projectedHigh,
      currentProjectedLow: currentProjectedLow,
      currentProjectedHigh: currentProjectedHigh,
      lowLeadNeed: lowLeadNeed,
      highLeadNeed: highLeadNeed,
      gapVsCurrentLeads: gapVsCurrentLeads,
      gapVsCurrentRegistered: gapVsCurrentRegistered,
      expectedFunnel: {
        leads: requiredLeads,
        contacts: contacts,
        interested: interested,
        registered: requiredRegistrations,
        attended: targetAttendance
      },
      metrics: metrics
    };
  }

  function findLeadCityForAttendee(event, attendee) {
    const match = event.leads.find(function (lead) {
      const samePhone = attendee.phone && lead.phone && attendee.phone === lead.phone;
      const sameEmail = attendee.email && lead.email && attendee.email.toLowerCase() === lead.email.toLowerCase();
      return samePhone || sameEmail;
    });
    return match && match.city ? match.city : "Unknown";
  }

  function topPerformingCityByRegistrations(event) {
    if (event.attendees.length === 0) {
      return null;
    }

    const cityTotals = {};
    event.attendees.forEach(function (attendee) {
      if (
        attendee.status !== "Registered" &&
        attendee.status !== "Confirmed" &&
        attendee.status !== "Checked In"
      ) {
        return;
      }
      const city = findLeadCityForAttendee(event, attendee);
      cityTotals[city] = (cityTotals[city] || 0) + getHeadcount(attendee);
    });

    const entries = Object.entries(cityTotals);
    if (entries.length === 0) {
      return null;
    }

    entries.sort(function (a, b) {
      return b[1] - a[1];
    });

    return {
      city: entries[0][0],
      expectedAttendees: entries[0][1]
    };
  }

  function getCampaignStatus() {
    const event = getActiveEvent();
    const planner = computePlanner();
    const metrics = planner.metrics; // use same metrics as banner

    const seatsRemaining = metrics.seatsRemaining;
    const expectedAttendance = metrics.expectedAttendance;
    const hasCheckinSignal = expectedAttendance > 0;
    const checkinRatio = hasCheckinSignal
      ? metrics.checkedInHeadcount / expectedAttendance
      : 0;

    let label;
    if (seatsRemaining === 0 && expectedAttendance > metrics.goal) {
      label = "Above Target";
    } else if (seatsRemaining === 0) {
      label = "On Track";
    } else if (planner.currentProjectedHigh >= planner.targetAttendance) {
      label = seatsRemaining === 0 ? "On Track" : "On Track";
    } else {
      label = "Needs More Leads";
    }
    // Refine downward only when not already in a "needs leads" state
    if (label !== "Needs More Leads" && hasCheckinSignal && checkinRatio < 0.3) {
      label = "Check-In Risk";
    }

    const leadBullet =
      seatsRemaining === 0
        ? "✔ Registrations meet attendance goal"
        : planner.currentProjectedHigh >= planner.targetAttendance
        ? "✔ Lead volume sufficient for target attendance"
        : "⚠ Approximately " + planner.lowLeadNeed + "–" + planner.highLeadNeed + " more leads needed to fill remaining " + seatsRemaining + " seat" + (seatsRemaining === 1 ? "" : "s");

    const registrationBullet =
      expectedAttendance >= planner.requiredRegistrations
        ? "✔ Registration pacing meets projection"
        : "⚠ Registration slightly behind target";

    const showBullet =
      !hasCheckinSignal || checkinRatio >= 0.3
        ? "✔ Show-up rate within expected range"
        : "⚠ Check-in rate is low for current expected attendance";

    return {
      label: label,
      bullets: [leadBullet, registrationBullet, showBullet]
    };
  }

  function getNextActions() {
    const event = getActiveEvent();
    const planner = computePlanner();
    const metrics = planner.metrics;
    const actions = [];

    if (metrics.seatsRemaining > 0) {
      const low = planner.lowLeadNeed;
      const high = planner.highLeadNeed;
      const rangeText = low === high ? String(low) : low + "–" + high;
      actions.push(
        "Add approximately " + rangeText + " more qualified leads to close the remaining " +
        metrics.seatsRemaining + "-seat gap."
      );
    }

    const interestedCount = event.leads.filter(function (lead) {
      return lead.status === "Interested";
    }).length;
    if (interestedCount > 0) {
      actions.push("Increase follow-up touches for Interested leads.");
    }

    const confirmedCount = event.attendees.filter(function (attendee) {
      return attendee.status === "Confirmed" || attendee.status === "Checked In";
    }).length;
    if (confirmedCount > 0) {
      actions.push("Send day-before reminders to confirmed attendees.");
    }

    const unconfirmedRegistered = event.attendees.filter(function (attendee) {
      return attendee.status === "Registered";
    }).length;
    if (unconfirmedRegistered > 0) {
      actions.push("Call registered attendees who are not yet confirmed.");
    }

    const topCity = topPerformingCityByRegistrations(event);
    if (topCity) {
      actions.push("Focus outreach on the top-performing city: " + topCity.city + ".");
    }

    if (metrics.registrationToShowPct < 30 && metrics.expectedAttendance > 0) {
      actions.push("Tighten same-day check-in reminders to reduce attendance leakage.");
    }

    if (actions.length < 3) {
      actions.push("Review lead source mix and increase high-performing channel spend.");
    }

    return actions.slice(0, 5);
  }

  function renderOutcomeBanner() {
    const planner = computePlanner();
    const metrics = planner.metrics;
    const expectedAttendance = metrics.expectedAttendance;
    const goal = metrics.goal;
    const seatsRemaining = metrics.seatsRemaining;

    let text =
      "Current expected attendance is " +
      expectedAttendance +
      " of " +
      goal +
      " seats. " +
      seatsRemaining +
      " seat" + (seatsRemaining === 1 ? "" : "s") + " remain.";

    if (seatsRemaining > 0) {
      const low = planner.lowLeadNeed;
      const high = planner.highLeadNeed;
      const rangeText = low === high ? String(low) : low + "–" + high;
      text +=
        " Based on the selected lead-to-registration assumptions, add approximately " +
        rangeText +
        " more qualified leads to close the gap.";
    } else {
      text += " Your current registrations meet or exceed the attendance goal.";
    }

    els.outcomeBanner.textContent = text;
  }

  function renderCampaignCards() {
    const status = getCampaignStatus();
    const badgeClass = "status-chip " +
      (status.label === "Above Target"
        ? "status-checked-in"
        : status.label === "On Track"
        ? "status-confirmed"
        : status.label === "Needs More Leads"
        ? "status-registered"
        : status.label === "Registration Behind"
        ? "status-interested"
        : "status-contacted");

    els.campaignStatusBadge.className = badgeClass;
    els.campaignStatusBadge.textContent = status.label;
    els.campaignStatusBullets.innerHTML = status.bullets
      .map(function (bullet) {
        return "<li>" + escapeHtml(bullet) + "</li>";
      })
      .join("");

    const actions = getNextActions();
    els.nextActionsList.innerHTML = actions
      .map(function (action) {
        return "<li>" + escapeHtml(action) + "</li>";
      })
      .join("");
  }

  function filteredLeads(event) {
    if (state.cityFilter === "all") {
      return event.leads;
    }
    return event.leads.filter(function (lead) {
      return (lead.city || "Unknown") === state.cityFilter;
    });
  }

  function renderDashboard() {
    const event = getActiveEvent();
    const metrics = computeMetrics(event);

    const items = [
      { label: "Total Leads", value: metrics.totalLeads },
      { label: "Registered Attendees", value: metrics.registrations },
      { label: "Confirmed Attendees", value: metrics.confirmed },
      { label: "Checked-In Headcount", value: metrics.checkedInHeadcount },
      { label: "Attendance Goal", value: metrics.goal },
      { label: "Seats Remaining", value: metrics.seatsRemaining }
    ];

    els.dashboardMetrics.innerHTML = items
      .map(function (item) {
        return "<div class=\"metric\"><span class=\"label\">" + escapeHtml(item.label) + "</span><span class=\"value\">" + escapeHtml(item.value) + "</span></div>";
      })
      .join("");

    els.goalProgressText.textContent = metrics.progressPct + "%";
    els.goalProgressBar.style.width = metrics.progressPct + "%";
    const track = els.goalProgressBar.parentElement;
    if (track) {
      track.setAttribute("aria-valuenow", String(metrics.progressPct));
    }
  }

  function renderEventForm() {
    const event = getActiveEvent();
    const fields = ["name", "date", "time", "location", "goal", "topic", "audienceNotes"];
    fields.forEach(function (field) {
      if (els.eventForm.elements[field]) {
        els.eventForm.elements[field].value = event[field] || "";
      }
    });
  }

  function renderCitySegmentation() {
    const event = getActiveEvent();
    const cityTotals = {};

    event.leads.forEach(function (lead) {
      const city = lead.city || "Unknown";
      cityTotals[city] = (cityTotals[city] || 0) + 1;
    });

    const cities = Object.keys(cityTotals).sort();
    els.cityFilterSelect.innerHTML = ["<option value=\"all\">All Cities</option>"]
      .concat(
        cities.map(function (city) {
          const selected = state.cityFilter === city ? " selected" : "";
          return "<option value=\"" + escapeHtml(city) + "\"" + selected + ">" + escapeHtml(city) + "</option>";
        })
      )
      .join("");

    if (cities.length === 0) {
      els.cityCounts.innerHTML = "<span class=\"save-status\">No city data yet.</span>";
    } else {
      els.cityCounts.innerHTML = cities
        .map(function (city) {
          return "<span class=\"city-pill\">" + escapeHtml(city) + ": " + cityTotals[city] + " lead(s)</span>";
        })
        .join("");
    }

    const topCity = topPerformingCityByRegistrations(event);
    els.topCityInsight.textContent = topCity
      ? "Top Performing City: " +
        topCity.city +
        " (" +
        topCity.expectedAttendees +
        " expected attendees). Prioritize follow-up and referrals in this city."
      : "Top Performing City: Not enough attendee data yet.";
  }

  function renderLeadTable() {
    const event = getActiveEvent();
    const leads = filteredLeads(event);

    if (leads.length === 0) {
      els.leadsTableBody.innerHTML = "<tr><td colspan=\"7\"><span class=\"save-status\">No leads in this segment yet.</span></td></tr>";
      return;
    }

    els.leadsTableBody.innerHTML = leads
      .map(function (lead) {
        const options = LEAD_STATUSES.map(function (status) {
          const selected = status === lead.status ? " selected" : "";
          return "<option value=\"" + escapeHtml(status) + "\"" + selected + ">" + escapeHtml(status) + "</option>";
        }).join("");

        return (
          "<tr>" +
          "<td>" + escapeHtml(lead.name) + "</td>" +
          "<td>" + escapeHtml(lead.phone) + "</td>" +
          "<td>" + escapeHtml(lead.email) + "</td>" +
          "<td>" + escapeHtml(lead.condition) + "</td>" +
          "<td>" + escapeHtml(lead.city || "Unknown") + "</td>" +
          "<td><span class=\"status-chip " + statusClass(lead.status) + "\">" + escapeHtml(lead.status) + "</span><div><select data-action=\"lead-status\" data-id=\"" + escapeHtml(lead.id) + "\">" + options + "</select></div></td>" +
          "<td><button class=\"small-btn\" type=\"button\" data-action=\"select-lead\" data-id=\"" + escapeHtml(lead.id) + "\">Generate Scripts</button></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function generateOutreachScripts(lead, event) {
    const disclaimer = "Educational event only. Not medical advice. Please consult your healthcare provider.";
    const eventName = event.name || "our health education event";
    const topic = event.topic || "wellness education";
    const datePart = event.date ? " on " + event.date : "";
    const locationPart = event.location ? " at " + event.location : "";
    const name = lead.name || "there";
    const condition = lead.condition ? " related to " + lead.condition : "";

    return {
      call:
        "Hello " + name + ", this is [Your Name] with " + eventName + ". We are inviting local community members to a " + topic +
        " session" + condition + datePart + locationPart + ". Would you be open to hearing quick details and seeing if this is a fit for you?\n\n" + disclaimer,
      voicemail:
        "Hi " + name + ", this is [Your Name] calling about " + eventName + ". We are hosting an educational session on " + topic +
        datePart + locationPart + ". If you would like details or to reserve a spot, please call us back at [Phone].\n\n" + disclaimer,
      sms:
        "Hi " + name + ", this is [Your Name]. We are inviting you to " + eventName + " (" + topic + ")" +
        datePart + locationPart + ". Reply YES for details or STOP to opt out. " + disclaimer,
      email:
        "Subject: Invitation to " + eventName + "\n\nHello " + name + ",\n\nWe would like to invite you to an upcoming educational event focused on " + topic +
        ". The event is scheduled" + datePart + locationPart + ".\n\nIf you would like to attend, reply to this message and we can reserve your spot.\n\n" + disclaimer
    };
  }

  function renderScripts() {
    const event = getActiveEvent();
    const selected = event.leads.find(function (lead) {
      return lead.id === state.selectedLeadId;
    });

    if (!selected) {
      els.scriptLeadLabel.textContent = "Select a lead from the table to generate compliant scripts.";
      els.scriptsOutput.className = "script-grid empty-state";
      els.scriptsOutput.innerHTML = "<p>No lead selected yet.</p>";
      return;
    }

    const scripts = generateOutreachScripts(selected, event);
    els.scriptLeadLabel.textContent = "Scripts for: " + selected.name + " (" + selected.phone + ")";
    els.scriptsOutput.className = "script-grid";
    els.scriptsOutput.innerHTML =
      "<article class=\"script-card\"><h3>Call Script</h3><p>" + escapeHtml(scripts.call) + "</p></article>" +
      "<article class=\"script-card\"><h3>Voicemail Script</h3><p>" + escapeHtml(scripts.voicemail) + "</p></article>" +
      "<article class=\"script-card\"><h3>SMS Message</h3><p>" + escapeHtml(scripts.sms) + "</p></article>" +
      "<article class=\"script-card\"><h3>Email Message</h3><p>" + escapeHtml(scripts.email) + "</p></article>";
  }

  function reminderNeeds(attendee) {
    if (attendee.checkedIn) {
      return [];
    }
    if (attendee.status === "Registered") {
      return ["Confirmation Call", "Day-Before Reminder", "Day-Of Reminder"];
    }
    if (attendee.status === "Confirmed") {
      return ["Day-Before Reminder", "Day-Of Reminder"];
    }
    return [];
  }

  function reminderCopy(attendee, event) {
    const disclaimer = "Educational event only. Not medical advice. Please consult your healthcare provider.";
    const date = event.date || "the scheduled date";
    const time = event.time || "the scheduled time";
    const location = event.location || "our venue";
    return "Hi " + attendee.name + ", reminder for " + (event.name || "our event") + " on " + date + " at " + time +
      " at " + location + ". Reply if you need to update attendance. " + disclaimer;
  }

  function renderReminderQueue() {
    const event = getActiveEvent();
    const queue = event.attendees.filter(function (attendee) {
      return reminderNeeds(attendee).length > 0;
    });

    if (queue.length === 0) {
      els.reminderTableBody.innerHTML = "<tr><td colspan=\"4\"><span class=\"save-status\">No reminders pending.</span></td></tr>";
      return;
    }

    els.reminderTableBody.innerHTML = queue
      .map(function (attendee) {
        return (
          "<tr>" +
          "<td>" + escapeHtml(attendee.name) + "</td>" +
          "<td><span class=\"status-chip " + statusClass(attendee.status) + "\">" + escapeHtml(attendee.status) + "</span></td>" +
          "<td>" + escapeHtml(reminderNeeds(attendee).join(", ")) + "</td>" +
          "<td>" + escapeHtml(reminderCopy(attendee, event)) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderAttendees() {
    const event = getActiveEvent();

    if (event.attendees.length === 0) {
      els.attendeesTableBody.innerHTML = "<tr><td colspan=\"7\"><span class=\"save-status\">No attendees registered yet.</span></td></tr>";
      return;
    }

    els.attendeesTableBody.innerHTML = event.attendees
      .map(function (attendee) {
        const options = ATTENDEE_STATUSES.map(function (status) {
          const selected = status === attendee.status ? " selected" : "";
          return "<option value=\"" + status + "\"" + selected + ">" + status + "</option>";
        }).join("");

        return (
          "<tr>" +
          "<td>" + escapeHtml(attendee.name) + "</td>" +
          "<td>" + escapeHtml(attendee.phone) + "</td>" +
          "<td>" + escapeHtml(attendee.email) + "</td>" +
          "<td>" + escapeHtml(attendee.guestCount) + "</td>" +
          "<td><select data-action=\"attendee-status\" data-id=\"" + escapeHtml(attendee.id) + "\">" + options + "</select></td>" +
          "<td><span class=\"status-chip " + (attendee.checkedIn ? "status-checkedin" : "status-new") + "\">" + (attendee.checkedIn ? "Yes" : "No") + "</span></td>" +
          "<td>" + escapeHtml(attendee.notes || "") + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderCheckin() {
    const event = getActiveEvent();
    const query = String(els.checkinSearchInput.value || "").trim().toLowerCase();

    const checkedInHeadcount = event.attendees.reduce(function (sum, attendee) {
      return attendee.checkedIn ? sum + getHeadcount(attendee) : sum;
    }, 0);

    els.checkedInCount.textContent = "Checked In: " + checkedInHeadcount + " / " + Math.max(0, toNumber(event.goal));

    const results = event.attendees.filter(function (attendee) {
      if (!query) {
        return true;
      }
      return attendee.name.toLowerCase().indexOf(query) >= 0 || attendee.phone.toLowerCase().indexOf(query) >= 0;
    });

    if (results.length === 0) {
      els.checkinList.innerHTML = "<div class=\"save-status\">No matching attendees.</div>";
      return;
    }

    els.checkinList.innerHTML = results
      .map(function (attendee) {
        const action = attendee.checkedIn
          ? "<span class=\"status-chip status-checkedin\">Checked In</span>"
          : "<button class=\"small-btn success\" data-action=\"check-in\" data-id=\"" + escapeHtml(attendee.id) + "\" type=\"button\">Mark Checked In</button>";

        return (
          "<div class=\"checkin-row\">" +
          "<div><strong>" + escapeHtml(attendee.name) + "</strong><div class=\"checkin-meta\">" + escapeHtml(attendee.phone) + " | Guests: " + escapeHtml(attendee.guestCount) + "</div></div>" +
          "<div>" + action + "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderPlanner() {
    const event = getActiveEvent();
    const planner = computePlanner();

    els.plannerTargetAttendance.value = planner.targetAttendance;
    els.plannerShowRate.value = planner.showRatePct;
    els.plannerConversionRate.value = planner.conversionRatePct;

    const attendanceGap = Math.max(planner.requiredRegistrations - planner.metrics.expectedAttendance, 0);
    els.funnelTargetSummary.textContent =
      "To fill " +
      planner.targetAttendance +
      " seats at a " +
      planner.showRatePct +
      "% show-up rate, this campaign needs about " +
      planner.requiredRegistrations +
      " registrations and " +
      planner.requiredLeads +
      " leads at a " +
      planner.conversionRatePct +
      "% lead-to-registration rate.";

    const cards = [
      { label: "Leads Needed", value: planner.requiredLeads },
      { label: "Current Leads", value: event.leads.length },
      { label: "Lead Gap", value: planner.gapVsCurrentLeads },
      { label: "Registrations Needed", value: planner.requiredRegistrations },
      { label: "Current Expected Attendance", value: planner.metrics.expectedAttendance },
      { label: "Attendance Gap", value: attendanceGap }
    ];

    els.campaignPlannerMetrics.innerHTML = cards
      .map(function (card) {
        return "<div class=\"metric\"><span class=\"label\">" + escapeHtml(card.label) + "</span><span class=\"value\">" + escapeHtml(card.value) + "</span></div>";
      })
      .join("");

    els.campaignFunnel.innerHTML =
      "<div class=\"funnel-stage\"><strong>Leads</strong><div>" + planner.requiredLeads + " target | " + event.leads.length + " current</div></div>" +
      "<div class=\"funnel-arrow\">-></div>" +
      "<div class=\"funnel-stage\"><strong>Registered</strong><div>" + planner.requiredRegistrations + " target | " + event.attendees.length + " current</div></div>" +
      "<div class=\"funnel-arrow\">-></div>" +
      "<div class=\"funnel-stage\"><strong>Attended</strong><div>" + planner.targetAttendance + " target | " + planner.metrics.expectedAttendance + " expected</div></div>";

    const expected = planner.expectedFunnel;
    els.expectedFunnelOutput.innerHTML = [
      { label: "Leads", value: expected.leads },
      { label: "Contacts", value: expected.contacts },
      { label: "Interested", value: expected.interested },
      { label: "Registered", value: expected.registered },
      { label: "Attended", value: expected.attended }
    ]
      .map(function (item) {
        return "<div class=\"funnel-output-item\"><strong>" + escapeHtml(item.label) + "</strong><div>" + escapeHtml(item.value) + "</div></div>";
      })
      .join("");
  }

  function renderAnalytics() {
    const event = getActiveEvent();
    const metrics = computeMetrics(event);

    els.analyticsGrid.innerHTML = [
      { label: "Lead -> Registration %", value: metrics.leadToRegistrationPct.toFixed(1) + "%" },
      { label: "Registration -> Show %", value: metrics.registrationToShowPct.toFixed(1) + "%" },
      { label: "Overall Conversion %", value: metrics.overallConversionPct.toFixed(1) + "%" }
    ]
      .map(function (item) {
        return "<div class=\"metric\"><span class=\"label\">" + item.label + "</span><span class=\"value\">" + item.value + "</span></div>";
      })
      .join("");

    const remaining = metrics.seatsRemaining;
    const requiredLeadItems = [0.2, 0.3, 0.4]
      .map(function (rate) {
        const needed = remaining > 0 ? Math.ceil(remaining / rate) : 0;
        return "<li>At " + (rate * 100).toFixed(0) + "% conversion: " + needed + " additional leads</li>";
      })
      .join("");
    els.leadNeedPanel.innerHTML = "<strong>Suggested additional leads needed</strong><ul>" + requiredLeadItems + "</ul>";

    const statusCounts = {};
    event.leads.forEach(function (lead) {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });
    const bestStatus = Object.keys(statusCounts).sort(function (a, b) {
      return statusCounts[b] - statusCounts[a];
    })[0] || "None";

    els.performanceInsightsGrid.innerHTML = [
      { label: "Lead -> Registration %", value: metrics.leadToRegistrationPct.toFixed(1) + "%" },
      { label: "Registration -> Show %", value: metrics.registrationToShowPct.toFixed(1) + "%" },
      { label: "Overall Conversion %", value: metrics.overallConversionPct.toFixed(1) + "%" },
      { label: "Best Lead Status Bucket", value: bestStatus }
    ]
      .map(function (item) {
        return "<div class=\"metric\"><span class=\"label\">" + escapeHtml(item.label) + "</span><span class=\"value\">" + escapeHtml(item.value) + "</span></div>";
      })
      .join("");

    const tips = [];
    if (metrics.leadToRegistrationPct < 20) {
      tips.push("Low registration rate: increase follow-up touches.");
    }
    if (metrics.leadToRegistrationPct >= 20 && metrics.registrationToShowPct < 60) {
      tips.push("High registration but low show-up: improve reminders.");
    }
    if (metrics.overallConversionPct >= 20) {
      tips.push("Strong conversion trend: keep current outreach cadence and replicate in nearby cities.");
    }
    if (tips.length === 0) {
      tips.push("Add more lead volume and track outcomes per city to improve predictability.");
    }

    els.improvementTips.innerHTML = tips.map(function (tip) {
      return "<li>" + escapeHtml(tip) + "</li>";
    }).join("");
  }

  function renderAll() {
    if (!getActiveEvent()) {
      return;
    }

    renderTabs();
    renderOutcomeBanner();
    renderEventSelector();
    renderEventForm();
    renderDashboard();
    renderCampaignCards();
    renderPlanner();
    renderCitySegmentation();
    renderLeadTable();
    renderScripts();
    renderReminderQueue();
    renderAttendees();
    renderCheckin();
    renderAnalytics();
  }

  function bindTabs() {
    els.tabList.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.classList.contains("tab-btn")) {
        switchTab(target.dataset.tab);
      }
    });
  }

  function bindEventSwitcher() {
    els.eventSelector.addEventListener("change", function () {
      setActiveEvent(els.eventSelector.value);
    });

    els.newEventBtn.addEventListener("click", function () {
      const name = window.prompt("Name for the new event:", "New Event Campaign");
      if (!name) {
        return;
      }

      const event = normalizeEvent({
        id: uid("evt"),
        name: name,
        date: "",
        time: "",
        location: "",
        goal: 75,
        topic: "",
        audienceNotes: "",
        leads: [],
        attendees: []
      });

      state.events.push(event);
      state.activeEventId = event.id;
      state.selectedLeadId = null;
      state.cityFilter = "all";
      saveState();
      renderAll();
      setStatusText(els.eventSaveStatus, "New event created.", 1600);
    });
  }

  function bindEventForm() {
    els.eventForm.addEventListener("submit", function (eventObj) {
      eventObj.preventDefault();
      const active = getActiveEvent();
      const formData = new FormData(els.eventForm);

      active.name = String(formData.get("name") || "").trim();
      active.date = String(formData.get("date") || "").trim();
      active.time = String(formData.get("time") || "").trim();
      active.location = String(formData.get("location") || "").trim();
      active.goal = toNumber(formData.get("goal"));
      active.topic = String(formData.get("topic") || "").trim();
      active.audienceNotes = String(formData.get("audienceNotes") || "").trim();

      saveState();
      renderAll();
      setStatusText(els.eventSaveStatus, "Event details saved.", 1500);
    });
  }

  function bindLeadImport() {
    els.leadImportForm.addEventListener("submit", function (eventObj) {
      eventObj.preventDefault();
      const active = getActiveEvent();
      const lines = String(els.leadCsvInput.value || "")
        .split(/\r?\n/)
        .map(function (line) { return line.trim(); })
        .filter(Boolean);

      if (lines.length === 0) {
        setStatusText(els.leadImportStatus, "No valid rows found.", 2000);
        return;
      }

      let imported = 0;

      lines.forEach(function (line, index) {
        const cols = parseCsvLine(line);
        if (index === 0 && cols[0] && cols[0].toLowerCase() === "name") {
          return;
        }

        const lead = {
          id: uid("lead"),
          name: cols[0] || "",
          phone: cols[1] || "",
          email: cols[2] || "",
          condition: cols[3] || "",
          city: cols[4] || "Unknown",
          status: normalizeLeadStatus(cols[5] || "New"),
          notes: "",
          createdAt: new Date().toISOString()
        };

        if (!lead.name && !lead.phone && !lead.email) {
          return;
        }

        active.leads.push(lead);
        imported += 1;
      });

      if (imported === 0) {
        setStatusText(els.leadImportStatus, "No valid rows found.", 2000);
        return;
      }

      els.leadCsvInput.value = "";
      saveState();
      renderAll();
      setStatusText(els.leadImportStatus, "Imported " + imported + " lead(s).", 1800);
    });
  }

  function bindCityFilter() {
    els.cityFilterSelect.addEventListener("change", function () {
      state.cityFilter = els.cityFilterSelect.value;
      saveState();
      renderLeadTable();
      renderScripts();
    });
  }

  function bindLeadActions() {
    els.leadsTableBody.addEventListener("change", function (eventObj) {
      const target = eventObj.target;
      if (!(target instanceof HTMLSelectElement)) {
        return;
      }
      if (target.dataset.action !== "lead-status") {
        return;
      }

      const active = getActiveEvent();
      const lead = active.leads.find(function (item) {
        return item.id === target.dataset.id;
      });
      if (!lead) {
        return;
      }
      lead.status = normalizeLeadStatus(target.value);
      saveState();
      renderAll();
    });

    els.leadsTableBody.addEventListener("click", function (eventObj) {
      const target = eventObj.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.dataset.action === "select-lead") {
        state.selectedLeadId = target.dataset.id;
        saveState();
        renderScripts();
      }
    });
  }

  function tryLinkLeadToRegistration(event, attendee) {
    const match = event.leads.find(function (lead) {
      const samePhone = attendee.phone && lead.phone && attendee.phone === lead.phone;
      const sameEmail = attendee.email && lead.email && attendee.email.toLowerCase() === lead.email.toLowerCase();
      return samePhone || sameEmail;
    });

    if (match && LEAD_STATUSES.indexOf(match.status) < LEAD_STATUSES.indexOf("Registered")) {
      match.status = "Registered";
    }
  }

  function bindAttendeeForm() {
    els.attendeeForm.addEventListener("submit", function (eventObj) {
      eventObj.preventDefault();
      const active = getActiveEvent();
      const formData = new FormData(els.attendeeForm);

      const attendee = {
        id: uid("att"),
        name: String(formData.get("name") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        guestCount: Math.max(0, toNumber(formData.get("guestCount"))),
        status: "Registered",
        checkedIn: false,
        notes: String(formData.get("notes") || "").trim(),
        createdAt: new Date().toISOString()
      };

      if (!attendee.name || !attendee.phone) {
        setStatusText(els.attendeeSaveStatus, "Name and phone are required.", 1800);
        return;
      }

      active.attendees.push(attendee);
      tryLinkLeadToRegistration(active, attendee);
      els.attendeeForm.reset();
      els.attendeeForm.elements.guestCount.value = "0";
      saveState();
      renderAll();
      setStatusText(els.attendeeSaveStatus, "Attendee registered.", 1600);
    });
  }

  function bindAttendeeActions() {
    els.attendeesTableBody.addEventListener("change", function (eventObj) {
      const target = eventObj.target;
      if (!(target instanceof HTMLSelectElement)) {
        return;
      }
      if (target.dataset.action !== "attendee-status") {
        return;
      }

      const active = getActiveEvent();
      const attendee = active.attendees.find(function (item) {
        return item.id === target.dataset.id;
      });
      if (!attendee) {
        return;
      }

      attendee.status = normalizeAttendeeStatus(target.value);
      attendee.checkedIn = attendee.status === "Checked In";
      saveState();
      renderAll();
    });
  }

  function bindCheckinActions() {
    els.checkinSearchInput.addEventListener("input", function () {
      renderCheckin();
    });

    els.checkinList.addEventListener("click", function (eventObj) {
      const target = eventObj.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.dataset.action !== "check-in") {
        return;
      }

      const active = getActiveEvent();
      const attendee = active.attendees.find(function (item) {
        return item.id === target.dataset.id;
      });
      if (!attendee) {
        return;
      }

      attendee.checkedIn = true;
      attendee.status = "Checked In";
      saveState();
      renderAll();
    });
  }

  function bindPlannerForm() {
    function updatePlannerFromInputs() {
      state.planner.targetAttendance = Math.max(1, toNumber(els.plannerTargetAttendance.value) || DEFAULT_PLANNER.targetAttendance);
      state.planner.showRate = clamp(toNumber(els.plannerShowRate.value) || DEFAULT_PLANNER.showRate, 1, 100);
      state.planner.conversionRate = clamp(toNumber(els.plannerConversionRate.value) || DEFAULT_PLANNER.conversionRate, 1, 100);
      saveState();
      renderAll();
    }

    els.campaignPlannerForm.addEventListener("input", updatePlannerFromInputs);
    els.campaignPlannerForm.addEventListener("change", updatePlannerFromInputs);
  }

  function buildExportText() {
    const event = getActiveEvent();
    const planner = computePlanner();
    const metrics = computeMetrics(event);
    const status = getCampaignStatus();
    const nextActions = getNextActions();
    const outreachSequence = [
      "Day 1: AI Call Attempt",
      "Day 2: SMS Follow-Up",
      "Day 3: Voicemail (if compliant)",
      "Day 5: Reminder SMS",
      "Day 6: Confirmation Call"
    ];

    const lines = [
      "Event Fill Campaign Plan",
      "Generated: " + new Date().toISOString(),
      "",
      "Event",
      "- Name: " + (event.name || "N/A"),
      "- Date: " + (event.date || "N/A"),
      "- Location: " + (event.location || "N/A"),
      "- Attendance Goal: " + metrics.goal,
      "",
      "Current Performance",
      "- Current Leads: " + metrics.totalLeads,
      "- Expected Attendance: " + metrics.expectedAttendance,
      "- Required Leads: " + planner.requiredLeads,
      "- Required Registrations: " + planner.requiredRegistrations,
      "- Campaign Status: " + status.label,
      "",
      "What To Do Next"
    ];

    nextActions.forEach(function (action) {
      lines.push("- " + action);
    });

    lines.push("");
    lines.push("Outreach Sequence");
    outreachSequence.forEach(function (step) {
      lines.push("- " + step);
    });

    lines.push("");
    lines.push("Production Stack Summary");
    lines.push("- n8n / Make automation");
    lines.push("- Retell AI calling");
    lines.push("- Twilio SMS");
    lines.push("- Supabase DB");
    lines.push("- CRM sync");

    return lines.join("\n");
  }

  function bindHeaderActions() {
    els.loadDemoBtn.addEventListener("click", function () {
      loadDemoData();
    });

    els.resetDemoBtn.addEventListener("click", function () {
      loadDemoData();
      setStatusText(els.eventSaveStatus, "Demo dataset reset.", 1600);
    });

    els.clearDataBtn.addEventListener("click", function () {
      if (!window.confirm("Clear all events, leads, and attendees?")) {
        return;
      }
      state.events = [];
      state.activeEventId = null;
      state.selectedLeadId = null;
      state.cityFilter = "all";
      saveState();
      loadDemoData();
      setStatusText(els.eventSaveStatus, "Data cleared, demo reloaded.", 1800);
    });

    els.exportPlanBtn.addEventListener("click", function () {
      const active = getActiveEvent();
      if (!active) {
        return;
      }
      const textSummary = buildExportText();
      const blob = new Blob([textSummary], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "event-fill-campaign-plan.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  function bindArchitectureBadge() {
    els.readyBadge.addEventListener("click", function () {
      if (typeof els.architectureDialog.showModal === "function") {
        els.architectureDialog.showModal();
      }
    });

    els.closeArchitectureDialog.addEventListener("click", function () {
      els.architectureDialog.close();
    });
  }

  function createDemoEvents() {
    const now = new Date().toISOString();

    const firstNames = [
      "Alicia", "Marcus", "Nina", "Robert", "Dana", "Steven", "Martha", "Trent", "Felicia", "Howard",
      "Janet", "Peter", "Elaine", "Carlos", "Linda", "Derrick", "Grace", "Oscar", "Mina", "Tommy",
      "Paula", "Brian", "Janelle", "Ibrahim", "Monica", "Victor", "Rachel", "Thomas", "Sonia", "Kevin"
    ];
    const lastNames = [
      "Green", "Hill", "Patel", "Kim", "Lopez", "Cole", "Wells", "Dawson", "Romero", "Lin",
      "Cruz", "Vaughn", "Brooks", "Benitez", "Ochoa", "Morgan", "Rivera", "Song", "Tate", "Ford",
      "Khan", "Miles", "Turner", "Diaz", "Reyes", "Owens", "Grant", "Rice", "Yoon", "Parker"
    ];
    const cities = ["Austin", "Round Rock", "Cedar Park", "Pflugerville", "Georgetown", "Leander", "Buda", "Kyle"];
    const conditions = [
      "foot numbness", "tingling in toes", "balance concerns", "burning sensation", "leg discomfort",
      "nighttime nerve pain", "ankle numbness", "pins and needles", "cold feet sensation", "mobility confidence"
    ];
    const statusByBucket = function (index) {
      if (index < 60) {
        return "New";
      }
      if (index < 120) {
        return "Contacted";
      }
      if (index < 170) {
        return "Interested";
      }
      if (index < 195) {
        return "Registered";
      }
      if (index < 215) {
        return "Confirmed";
      }
      if (index < 230) {
        return "Checked In";
      }
      return "Not Interested";
    };

    const leads = [];
    for (let i = 0; i < 240; i += 1) {
      const first = firstNames[i % firstNames.length];
      const last = lastNames[(i * 3) % lastNames.length];
      const city = cities[i % cities.length];
      const emailName = (first + "." + last + i).toLowerCase();
      leads.push({
        id: uid("lead"),
        name: first + " " + last,
        phone: "555-" + String(200 + (i % 700)).padStart(3, "0") + "-" + String(1000 + (i % 9000)).padStart(4, "0"),
        email: emailName + "@example.com",
        condition: conditions[i % conditions.length],
        city: city,
        status: statusByBucket(i),
        notes: i % 9 === 0 ? "Preferred follow-up window: evenings" : "",
        createdAt: now
      });
    }

    const attendees = [];
    for (let i = 0; i < 48; i += 1) {
      const lead = leads[i * 2];
      const status = i < 30 ? "Confirmed" : i < 40 ? "Checked In" : "Registered";
      const checkedIn = status === "Checked In";
      const guestCount = checkedIn && i < 38 ? 1 : 0;
      attendees.push({
        id: uid("att"),
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        guestCount: guestCount,
        status: status,
        checkedIn: checkedIn,
        notes: checkedIn ? "Arrived and seated" : "Pending arrival",
        createdAt: now
      });
    }

    const eventOne = normalizeEvent({
      id: uid("evt"),
      name: "Free Neuropathy Relief Seminar",
      date: "2026-06-04",
      time: "19:00",
      location: "Riverside Community Wellness Hall",
      goal: 75,
      topic: "Neuropathy-friendly lifestyle, movement, and nutrition education",
      audienceNotes: "Adults seeking educational guidance for nerve discomfort and mobility confidence.",
      leads: leads,
      attendees: attendees
    });

    const eventTwoLeads = leads.slice(0, 80).map(function (lead, idx) {
      return {
        id: uid("lead"),
        name: lead.name,
        phone: "555-77" + String(idx).padStart(2, "0") + "-" + String(1100 + idx).padStart(4, "0"),
        email: "south." + idx + "@example.com",
        condition: lead.condition,
        city: cities[(idx + 2) % cities.length],
        status: idx % 5 === 0 ? "Registered" : idx % 4 === 0 ? "Interested" : "Contacted",
        createdAt: now
      };
    });

    const eventTwoAttendees = eventTwoLeads.slice(0, 20).map(function (lead, idx) {
      const status = idx < 8 ? "Confirmed" : idx < 12 ? "Checked In" : "Registered";
      return {
        id: uid("att"),
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        guestCount: idx % 6 === 0 ? 1 : 0,
        status: status,
        checkedIn: status === "Checked In",
        createdAt: now
      };
    });

    const eventTwo = normalizeEvent({
      id: uid("evt"),
      name: "Healthy Mobility Workshop - South Market",
      date: "2026-06-12",
      time: "18:30",
      location: "South Market Community Center",
      goal: 60,
      topic: "Balance, nerve comfort, and confidence in movement",
      audienceNotes: "Adults 50+ in South Market and neighboring suburbs.",
      leads: eventTwoLeads,
      attendees: eventTwoAttendees
    });

    return [eventOne, eventTwo];
  }

  function loadDemoData() {
    state.events = createDemoEvents();
    state.activeEventId = state.events[0].id;
    state.selectedLeadId = null;
    state.cityFilter = "all";
    state.planner = {
      targetAttendance: DEFAULT_PLANNER.targetAttendance,
      showRate: DEFAULT_PLANNER.showRate,
      conversionRate: DEFAULT_PLANNER.conversionRate
    };
    state.activeTab = "overview";

    saveState();
    renderAll();
  }

  function init() {
    const hasState = loadState();

    bindTabs();
    bindEventSwitcher();
    bindEventForm();
    bindLeadImport();
    bindCityFilter();
    bindLeadActions();
    bindAttendeeForm();
    bindAttendeeActions();
    bindCheckinActions();
    bindPlannerForm();
    bindHeaderActions();
    bindArchitectureBadge();

    if (!hasState) {
      loadDemoData();
      return;
    }

    renderAll();
  }

  init();
})();
