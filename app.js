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
    activeTab: "dashboard"
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
        activeTab: parsed.activeTab || "dashboard"
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
        activeTab: "dashboard"
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
      leadToRegistrationPct: totalLeads > 0 ? (registrations / totalLeads) * 100 : 0,
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
      registrations: entries[0][1]
    };
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
      ? "Top performing city by registrations: " + topCity.city + " (" + topCity.registrations + ")"
      : "Top performing city by registrations: Not enough attendee data yet";
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

    const cards = [
      { label: "Required Registrations", value: planner.requiredRegistrations },
      { label: "Required Leads", value: planner.requiredLeads },
      { label: "Gap vs Current Leads", value: planner.gapVsCurrentLeads },
      { label: "Gap vs Current Registered", value: planner.gapVsCurrentRegistered }
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
    renderEventSelector();
    renderEventForm();
    renderDashboard();
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
      renderPlanner();
    }

    els.campaignPlannerForm.addEventListener("input", updatePlannerFromInputs);
    els.campaignPlannerForm.addEventListener("change", updatePlannerFromInputs);
  }

  function buildExportPayload() {
    const event = getActiveEvent();
    const planner = computePlanner();
    return {
      generatedAt: new Date().toISOString(),
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
        goal: event.goal,
        topic: event.topic,
        audienceNotes: event.audienceNotes
      },
      planner: {
        targetAttendance: planner.targetAttendance,
        showUpRatePercent: planner.showRatePct,
        conversionRatePercent: planner.conversionRatePct,
        requiredRegistrations: planner.requiredRegistrations,
        requiredLeads: planner.requiredLeads,
        gapVsCurrentLeads: planner.gapVsCurrentLeads,
        gapVsCurrentRegistered: planner.gapVsCurrentRegistered
      },
      funnelTargets: planner.expectedFunnel,
      outreachStrategy: {
        leadSources: [
          "Purchased opt-in lists",
          "Local ads (55+ demographic)",
          "Referral incentives",
          "Community partnerships"
        ],
        outreachTimeline: [
          "Day 1: AI Call Attempt",
          "Day 2: SMS Follow-Up",
          "Day 3: Voicemail (if compliant)",
          "Day 5: Reminder SMS",
          "Day 6: Confirmation Call"
        ]
      }
    };
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
      const payload = buildExportPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = (active.name || "campaign-plan").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      link.href = url;
      link.download = (slug || "campaign-plan") + ".json";
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

    const eventOne = normalizeEvent({
      id: uid("evt"),
      name: "Free Neuropathy Relief Seminar",
      date: "2026-06-04",
      time: "19:00",
      location: "Riverside Community Wellness Hall",
      goal: 75,
      topic: "Neuropathy-friendly lifestyle, movement, and nutrition education",
      audienceNotes: "Adults seeking educational guidance for nerve discomfort and mobility confidence.",
      leads: [
        { id: uid("lead"), name: "Alicia Green", phone: "555-201-1198", email: "alicia.green@example.com", condition: "foot numbness", city: "Austin", status: "Interested", notes: "Prefers evening calls", createdAt: now },
        { id: uid("lead"), name: "Marcus Hill", phone: "555-334-8821", email: "marcus.hill@example.com", condition: "tingling in toes", city: "Round Rock", status: "Contacted", notes: "Requested text follow-up", createdAt: now },
        { id: uid("lead"), name: "Nina Patel", phone: "555-717-2249", email: "nina.patel@example.com", condition: "balance concerns", city: "Cedar Park", status: "New", notes: "", createdAt: now },
        { id: uid("lead"), name: "Robert Kim", phone: "555-888-7650", email: "robert.kim@example.com", condition: "burning sensation", city: "Austin", status: "Registered", notes: "", createdAt: now },
        { id: uid("lead"), name: "Dana Lopez", phone: "555-901-4501", email: "dana.lopez@example.com", condition: "leg discomfort", city: "Pflugerville", status: "Confirmed", notes: "", createdAt: now },
        { id: uid("lead"), name: "Steven Cole", phone: "555-112-0090", email: "steven.cole@example.com", condition: "nighttime nerve pain", city: "Georgetown", status: "Checked In", notes: "Arrives early", createdAt: now },
        { id: uid("lead"), name: "Martha Wells", phone: "555-234-7744", email: "martha.wells@example.com", condition: "ankle numbness", city: "Austin", status: "Not Interested", notes: "Declined this month", createdAt: now },
        { id: uid("lead"), name: "Trent Dawson", phone: "555-418-3002", email: "trent.dawson@example.com", condition: "tingling fingers", city: "Round Rock", status: "Contacted", notes: "Call after 5pm", createdAt: now },
        { id: uid("lead"), name: "Felicia Romero", phone: "555-620-1174", email: "felicia.romero@example.com", condition: "cold feet sensation", city: "Buda", status: "Interested", notes: "", createdAt: now },
        { id: uid("lead"), name: "Howard Lin", phone: "555-623-9955", email: "howard.lin@example.com", condition: "mobility confidence", city: "Leander", status: "New", notes: "", createdAt: now },
        { id: uid("lead"), name: "Janet Cruz", phone: "555-730-4470", email: "janet.cruz@example.com", condition: "heel nerve discomfort", city: "Kyle", status: "Registered", notes: "", createdAt: now },
        { id: uid("lead"), name: "Peter Vaughn", phone: "555-801-4451", email: "peter.vaughn@example.com", condition: "pins and needles", city: "Austin", status: "Contacted", notes: "Spouse may attend", createdAt: now }
      ],
      attendees: [
        { id: uid("att"), name: "Robert Kim", phone: "555-888-7650", email: "robert.kim@example.com", guestCount: 1, status: "Registered", checkedIn: false, notes: "Bringing spouse", createdAt: now },
        { id: uid("att"), name: "Dana Lopez", phone: "555-901-4501", email: "dana.lopez@example.com", guestCount: 0, status: "Confirmed", checkedIn: false, notes: "", createdAt: now },
        { id: uid("att"), name: "Steven Cole", phone: "555-112-0090", email: "steven.cole@example.com", guestCount: 2, status: "Checked In", checkedIn: true, notes: "Needs front row seating", createdAt: now },
        { id: uid("att"), name: "Janet Cruz", phone: "555-730-4470", email: "janet.cruz@example.com", guestCount: 1, status: "Registered", checkedIn: false, notes: "", createdAt: now },
        { id: uid("att"), name: "Mila Porter", phone: "555-940-3099", email: "mila.porter@example.com", guestCount: 0, status: "Checked In", checkedIn: true, notes: "", createdAt: now }
      ]
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
      leads: [
        { id: uid("lead"), name: "Olivia Grant", phone: "555-321-1101", email: "olivia.grant@example.com", condition: "tingling feet", city: "South Market", status: "Interested", createdAt: now },
        { id: uid("lead"), name: "Henry Cole", phone: "555-381-2204", email: "henry.cole@example.com", condition: "numb ankles", city: "South Market", status: "Contacted", createdAt: now },
        { id: uid("lead"), name: "Maya Reyes", phone: "555-761-8800", email: "maya.reyes@example.com", condition: "burning toes", city: "Lakeview", status: "Registered", createdAt: now },
        { id: uid("lead"), name: "Chris Owens", phone: "555-703-4122", email: "chris.owens@example.com", condition: "balance concerns", city: "Lakeview", status: "New", createdAt: now },
        { id: uid("lead"), name: "Pat Rice", phone: "555-301-2218", email: "pat.rice@example.com", condition: "sensitive feet", city: "South Market", status: "Confirmed", createdAt: now },
        { id: uid("lead"), name: "Rita Yoon", phone: "555-352-1882", email: "rita.yoon@example.com", condition: "leg tingling", city: "Brookfield", status: "Not Interested", createdAt: now }
      ],
      attendees: [
        { id: uid("att"), name: "Maya Reyes", phone: "555-761-8800", email: "maya.reyes@example.com", guestCount: 1, status: "Registered", checkedIn: false, createdAt: now },
        { id: uid("att"), name: "Pat Rice", phone: "555-301-2218", email: "pat.rice@example.com", guestCount: 0, status: "Confirmed", checkedIn: false, createdAt: now }
      ]
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
    state.activeTab = "dashboard";

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
