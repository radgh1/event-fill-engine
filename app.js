(function () {
  const STORAGE_KEY = "eventFillEngine.v1";

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

  const state = {
    event: {
      name: "",
      date: "",
      time: "",
      location: "",
      goal: 0,
      topic: "",
      audienceNotes: ""
    },
    leads: [],
    attendees: [],
    selectedLeadId: null
  };

  const els = {
    dashboardMetrics: document.getElementById("dashboardMetrics"),
    goalProgressBar: document.getElementById("goalProgressBar"),
    goalProgressText: document.getElementById("goalProgressText"),

    eventForm: document.getElementById("eventForm"),
    eventSaveStatus: document.getElementById("eventSaveStatus"),

    leadImportForm: document.getElementById("leadImportForm"),
    leadCsvInput: document.getElementById("leadCsvInput"),
    leadImportStatus: document.getElementById("leadImportStatus"),
    leadsTableBody: document.getElementById("leadsTableBody"),

    scriptLeadLabel: document.getElementById("scriptLeadLabel"),
    scriptsOutput: document.getElementById("scriptsOutput"),

    attendeeForm: document.getElementById("attendeeForm"),
    attendeeSaveStatus: document.getElementById("attendeeSaveStatus"),
    attendeesTableBody: document.getElementById("attendeesTableBody"),

    reminderTableBody: document.getElementById("reminderTableBody"),

    checkinSearchInput: document.getElementById("checkinSearchInput"),
    checkedInCount: document.getElementById("checkedInCount"),
    checkinList: document.getElementById("checkinList"),

    analyticsGrid: document.getElementById("analyticsGrid"),
    leadNeedPanel: document.getElementById("leadNeedPanel"),

    loadDemoBtn: document.getElementById("loadDemoBtn"),
    clearDataBtn: document.getElementById("clearDataBtn")
  };

  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeLeadStatus(status) {
    const cleaned = (status || "").trim();
    const found = LEAD_STATUSES.find(function (option) {
      return option.toLowerCase() === cleaned.toLowerCase();
    });
    return found || "New";
  }

  function normalizeAttendeeStatus(status) {
    const cleaned = (status || "").trim();
    const found = ATTENDEE_STATUSES.find(function (option) {
      return option.toLowerCase() === cleaned.toLowerCase();
    });
    return found || "Registered";
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ event: state.event, leads: state.leads, attendees: state.attendees })
    );
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        state.event = {
          name: parsed.event && parsed.event.name ? parsed.event.name : "",
          date: parsed.event && parsed.event.date ? parsed.event.date : "",
          time: parsed.event && parsed.event.time ? parsed.event.time : "",
          location: parsed.event && parsed.event.location ? parsed.event.location : "",
          goal: parsed.event ? toNumber(parsed.event.goal) : 0,
          topic: parsed.event && parsed.event.topic ? parsed.event.topic : "",
          audienceNotes: parsed.event && parsed.event.audienceNotes ? parsed.event.audienceNotes : ""
        };

        state.leads = Array.isArray(parsed.leads)
          ? parsed.leads.map(function (lead) {
              return {
                id: lead.id || uid("lead"),
                name: lead.name || "",
                phone: lead.phone || "",
                email: lead.email || "",
                condition: lead.condition || "",
                city: lead.city || "",
                status: normalizeLeadStatus(lead.status),
                notes: lead.notes || "",
                createdAt: lead.createdAt || new Date().toISOString()
              };
            })
          : [];

        state.attendees = Array.isArray(parsed.attendees)
          ? parsed.attendees.map(function (attendee) {
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
          : [];
      }
    } catch (_error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function setStatusText(node, text, durationMs) {
    node.textContent = text;
    if (durationMs && durationMs > 0) {
      window.setTimeout(function () {
        if (node.textContent === text) {
          node.textContent = "";
        }
      }, durationMs);
    }
  }

  function bindEventForm() {
    const fields = ["name", "date", "time", "location", "goal", "topic", "audienceNotes"];

    fields.forEach(function (field) {
      if (Object.prototype.hasOwnProperty.call(state.event, field)) {
        els.eventForm.elements[field].value = state.event[field];
      }
    });

    els.eventForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(els.eventForm);

      state.event = {
        name: String(formData.get("name") || "").trim(),
        date: String(formData.get("date") || "").trim(),
        time: String(formData.get("time") || "").trim(),
        location: String(formData.get("location") || "").trim(),
        goal: toNumber(formData.get("goal")),
        topic: String(formData.get("topic") || "").trim(),
        audienceNotes: String(formData.get("audienceNotes") || "").trim()
      };

      saveState();
      renderAll();
      setStatusText(els.eventSaveStatus, "Event details saved.", 1800);
    });
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

  function importLeadsFromCsv(rawInput) {
    const lines = rawInput
      .split(/\r?\n/)
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean);

    if (lines.length === 0) {
      return 0;
    }

    let imported = 0;

    lines.forEach(function (line, index) {
      const cols = parseCsvLine(line);

      // If first row looks like a header, skip it.
      if (
        index === 0 &&
        cols.length >= 2 &&
        cols[0].toLowerCase() === "name" &&
        cols[1].toLowerCase() === "phone"
      ) {
        return;
      }

      const lead = {
        id: uid("lead"),
        name: cols[0] || "",
        phone: cols[1] || "",
        email: cols[2] || "",
        condition: cols[3] || "",
        city: cols[4] || "",
        status: normalizeLeadStatus(cols[5] || "New"),
        notes: "",
        createdAt: new Date().toISOString()
      };

      if (!lead.name && !lead.phone && !lead.email) {
        return;
      }

      state.leads.push(lead);
      imported += 1;
    });

    return imported;
  }

  function bindLeadImport() {
    els.leadImportForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const importedCount = importLeadsFromCsv(els.leadCsvInput.value);

      if (importedCount > 0) {
        els.leadCsvInput.value = "";
        saveState();
        renderAll();
        setStatusText(els.leadImportStatus, "Imported " + importedCount + " lead(s).", 2000);
      } else {
        setStatusText(els.leadImportStatus, "No valid rows found.", 2000);
      }
    });
  }

  function generateOutreachScripts(lead) {
    const eventName = state.event.name || "our health education event";
    const topic = state.event.topic || "wellness education";
    const datePart = state.event.date ? " on " + state.event.date : "";
    const locationPart = state.event.location ? " at " + state.event.location : "";
    const disclaimer =
      "Educational event only. Not medical advice. Please consult your healthcare provider.";

    const name = lead.name || "there";
    const condition = lead.condition ? " related to " + lead.condition : "";

    return {
      call:
        "Hello " +
        name +
        ", this is [Your Name] with " +
        eventName +
        ". We are inviting local community members to a " +
        topic +
        " session" +
        condition +
        datePart +
        locationPart +
        ". Would you be open to hearing quick details and seeing if this is a fit for you?\n\n" +
        disclaimer,
      voicemail:
        "Hi " +
        name +
        ", this is [Your Name] calling about " +
        eventName +
        ". We are hosting an educational session on " +
        topic +
        datePart +
        locationPart +
        ". If you would like details or to reserve a spot, please call us back at [Phone].\n\n" +
        disclaimer,
      sms:
        "Hi " +
        name +
        ", this is [Your Name]. We are inviting you to " +
        eventName +
        " (" +
        topic +
        ")" +
        datePart +
        locationPart +
        ". Reply YES for details or STOP to opt out. " +
        disclaimer,
      email:
        "Subject: Invitation to " +
        eventName +
        "\n\nHello " +
        name +
        ",\n\nWe would like to invite you to an upcoming educational event focused on " +
        topic +
        ". The event is scheduled" +
        datePart +
        locationPart +
        ".\n\nIf you would like to attend, reply to this message and we can reserve your spot.\n\n" +
        disclaimer
    };
  }

  function renderScriptSection() {
    const selected = state.leads.find(function (lead) {
      return lead.id === state.selectedLeadId;
    });

    if (!selected) {
      els.scriptLeadLabel.textContent = "Select a lead from the table to generate compliant scripts.";
      els.scriptsOutput.className = "script-grid empty-state";
      els.scriptsOutput.innerHTML = "<p>No lead selected yet.</p>";
      return;
    }

    const scripts = generateOutreachScripts(selected);

    els.scriptLeadLabel.textContent = "Scripts for: " + selected.name + " (" + selected.phone + ")";
    els.scriptsOutput.className = "script-grid";
    els.scriptsOutput.innerHTML =
      "<article class=\"script-card\"><h3>Call Script</h3><p>" +
      escapeHtml(scripts.call) +
      "</p></article>" +
      "<article class=\"script-card\"><h3>Voicemail Script</h3><p>" +
      escapeHtml(scripts.voicemail) +
      "</p></article>" +
      "<article class=\"script-card\"><h3>SMS Message</h3><p>" +
      escapeHtml(scripts.sms) +
      "</p></article>" +
      "<article class=\"script-card\"><h3>Email Message</h3><p>" +
      escapeHtml(scripts.email) +
      "</p></article>";
  }

  function onLeadStatusChange(leadId, status) {
    const lead = state.leads.find(function (item) {
      return item.id === leadId;
    });
    if (!lead) {
      return;
    }
    lead.status = normalizeLeadStatus(status);
    saveState();
    renderAll();
  }

  function renderLeadTable() {
    if (state.leads.length === 0) {
      els.leadsTableBody.innerHTML =
        "<tr><td colspan=\"7\"><span class=\"save-status\">No leads imported yet.</span></td></tr>";
      return;
    }

    els.leadsTableBody.innerHTML = state.leads
      .map(function (lead) {
        const options = LEAD_STATUSES.map(function (status) {
          const selected = status === lead.status ? " selected" : "";
          return "<option value=\"" + escapeHtml(status) + "\"" + selected + ">" + escapeHtml(status) + "</option>";
        }).join("");

        return (
          "<tr data-lead-id=\"" +
          escapeHtml(lead.id) +
          "\">" +
          "<td>" +
          escapeHtml(lead.name) +
          "</td>" +
          "<td>" +
          escapeHtml(lead.phone) +
          "</td>" +
          "<td>" +
          escapeHtml(lead.email) +
          "</td>" +
          "<td>" +
          escapeHtml(lead.condition) +
          "</td>" +
          "<td>" +
          escapeHtml(lead.city) +
          "</td>" +
          "<td><select data-action=\"lead-status\" data-id=\"" +
          escapeHtml(lead.id) +
          "\">" +
          options +
          "</select></td>" +
          "<td><button class=\"small-btn\" type=\"button\" data-action=\"select-lead\" data-id=\"" +
          escapeHtml(lead.id) +
          "\">Generate Scripts</button></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function bindLeadTableActions() {
    els.leadsTableBody.addEventListener("change", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) {
        return;
      }
      if (target.dataset.action === "lead-status") {
        onLeadStatusChange(target.dataset.id, target.value);
      }
    });

    els.leadsTableBody.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.dataset.action === "select-lead") {
        state.selectedLeadId = target.dataset.id;
        renderScriptSection();
      }
    });
  }

  function tryLinkLeadToRegistration(attendee) {
    const match = state.leads.find(function (lead) {
      const samePhone = attendee.phone && lead.phone && attendee.phone === lead.phone;
      const sameEmail = attendee.email && lead.email && attendee.email.toLowerCase() === lead.email.toLowerCase();
      return samePhone || sameEmail;
    });

    if (match && LEAD_STATUSES.indexOf(match.status) < LEAD_STATUSES.indexOf("Registered")) {
      match.status = "Registered";
    }
  }

  function bindAttendeeForm() {
    els.attendeeForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(els.attendeeForm);

      const attendee = {
        id: uid("att"),
        name: String(formData.get("name") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        guestCount: toNumber(formData.get("guestCount")),
        status: "Registered",
        checkedIn: false,
        notes: String(formData.get("notes") || "").trim(),
        createdAt: new Date().toISOString()
      };

      if (!attendee.name || !attendee.phone) {
        setStatusText(els.attendeeSaveStatus, "Name and phone are required.", 2200);
        return;
      }

      state.attendees.push(attendee);
      tryLinkLeadToRegistration(attendee);
      saveState();
      renderAll();
      els.attendeeForm.reset();
      els.attendeeForm.elements.guestCount.value = "0";
      setStatusText(els.attendeeSaveStatus, "Attendee registered.", 1800);
    });
  }

  function updateAttendeeStatus(attendeeId, status) {
    const attendee = state.attendees.find(function (item) {
      return item.id === attendeeId;
    });
    if (!attendee) {
      return;
    }

    const normalized = normalizeAttendeeStatus(status);
    attendee.status = normalized;
    attendee.checkedIn = normalized === "Checked In";

    saveState();
    renderAll();
  }

  function renderAttendeesTable() {
    if (state.attendees.length === 0) {
      els.attendeesTableBody.innerHTML =
        "<tr><td colspan=\"7\"><span class=\"save-status\">No attendees registered yet.</span></td></tr>";
      return;
    }

    els.attendeesTableBody.innerHTML = state.attendees
      .map(function (attendee) {
        const statusOptions = ATTENDEE_STATUSES.map(function (status) {
          const selected = status === attendee.status ? " selected" : "";
          return "<option value=\"" + status + "\"" + selected + ">" + status + "</option>";
        }).join("");

        const checkedLabel = attendee.checkedIn
          ? "<span class=\"status-chip\">Yes</span>"
          : "<span class=\"status-chip\">No</span>";

        return (
          "<tr>" +
          "<td>" +
          escapeHtml(attendee.name) +
          "</td>" +
          "<td>" +
          escapeHtml(attendee.phone) +
          "</td>" +
          "<td>" +
          escapeHtml(attendee.email) +
          "</td>" +
          "<td>" +
          escapeHtml(String(attendee.guestCount)) +
          "</td>" +
          "<td><select data-action=\"attendee-status\" data-id=\"" +
          escapeHtml(attendee.id) +
          "\">" +
          statusOptions +
          "</select></td>" +
          "<td>" +
          checkedLabel +
          "</td>" +
          "<td>" +
          escapeHtml(attendee.notes || "") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function bindAttendeesTableActions() {
    els.attendeesTableBody.addEventListener("change", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement)) {
        return;
      }
      if (target.dataset.action === "attendee-status") {
        updateAttendeeStatus(target.dataset.id, target.value);
      }
    });
  }

  function reminderNeedsForAttendee(attendee) {
    if (attendee.checkedIn) {
      return [];
    }

    if (attendee.status === "Registered") {
      return ["Confirmation Call", "Reminder SMS", "Day-Before Reminder", "Day-Of Reminder"];
    }

    if (attendee.status === "Confirmed") {
      return ["Reminder SMS", "Day-Before Reminder", "Day-Of Reminder"];
    }

    return [];
  }

  function reminderCopy(attendee) {
    const eventName = state.event.name || "our event";
    const date = state.event.date || "the scheduled date";
    const time = state.event.time || "the scheduled time";
    const location = state.event.location || "our venue";
    return (
      "Hi " +
      attendee.name +
      ", this is a reminder for " +
      eventName +
      " on " +
      date +
      " at " +
      time +
      " at " +
      location +
      ". Please reply if you need to update your attendance. " +
      "Educational event only. Not medical advice. Please consult your healthcare provider."
    );
  }

  function renderReminderQueue() {
    const queue = state.attendees.filter(function (attendee) {
      return reminderNeedsForAttendee(attendee).length > 0;
    });

    if (queue.length === 0) {
      els.reminderTableBody.innerHTML =
        "<tr><td colspan=\"4\"><span class=\"save-status\">No reminders pending.</span></td></tr>";
      return;
    }

    els.reminderTableBody.innerHTML = queue
      .map(function (attendee) {
        const needs = reminderNeedsForAttendee(attendee).join(", ");
        return (
          "<tr>" +
          "<td>" +
          escapeHtml(attendee.name) +
          "</td>" +
          "<td><span class=\"status-chip\">" +
          escapeHtml(attendee.status) +
          "</span></td>" +
          "<td>" +
          escapeHtml(needs) +
          "</td>" +
          "<td>" +
          escapeHtml(reminderCopy(attendee)) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function markCheckedIn(attendeeId) {
    const attendee = state.attendees.find(function (item) {
      return item.id === attendeeId;
    });
    if (!attendee) {
      return;
    }
    attendee.checkedIn = true;
    attendee.status = "Checked In";
    saveState();
    renderAll();
  }

  function renderCheckinList() {
    const query = (els.checkinSearchInput.value || "").trim().toLowerCase();

    const results = state.attendees.filter(function (attendee) {
      if (!query) {
        return true;
      }
      return (
        attendee.name.toLowerCase().indexOf(query) >= 0 || attendee.phone.toLowerCase().indexOf(query) >= 0
      );
    });

    const checkedInCount = state.attendees.filter(function (attendee) {
      return attendee.checkedIn;
    }).length;
    els.checkedInCount.textContent = "Checked In: " + checkedInCount;

    if (results.length === 0) {
      els.checkinList.innerHTML = "<div class=\"save-status\">No matching attendees.</div>";
      return;
    }

    els.checkinList.innerHTML = results
      .map(function (attendee) {
        const buttonHtml = attendee.checkedIn
          ? "<span class=\"status-chip\">Checked In</span>"
          : "<button class=\"small-btn success\" data-action=\"check-in\" data-id=\"" +
            escapeHtml(attendee.id) +
            "\" type=\"button\">Mark Checked In</button>";

        return (
          "<div class=\"checkin-row\">" +
          "<div><strong>" +
          escapeHtml(attendee.name) +
          "</strong><div class=\"checkin-meta\">" +
          escapeHtml(attendee.phone) +
          " | Guests: " +
          escapeHtml(String(attendee.guestCount)) +
          "</div></div>" +
          "<div>" +
          buttonHtml +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function bindCheckinActions() {
    els.checkinSearchInput.addEventListener("input", renderCheckinList);

    els.checkinList.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.dataset.action === "check-in") {
        markCheckedIn(target.dataset.id);
      }
    });
  }

  function computeMetrics() {
    const totalLeads = state.leads.length;
    const registered = state.attendees.length;
    const confirmed = state.attendees.filter(function (attendee) {
      return attendee.status === "Confirmed" || attendee.status === "Checked In";
    }).length;
    const checkedIn = state.attendees.filter(function (attendee) {
      return attendee.checkedIn;
    }).length;
    const goal = toNumber(state.event.goal);

    return {
      totalLeads: totalLeads,
      registered: registered,
      confirmed: confirmed,
      checkedIn: checkedIn,
      goal: goal,
      progressPct: goal > 0 ? clamp(Math.round((checkedIn / goal) * 100), 0, 100) : 0,
      leadToRegistrationRate: totalLeads > 0 ? (registered / totalLeads) * 100 : 0,
      registrationToCheckinRate: registered > 0 ? (checkedIn / registered) * 100 : 0,
      remainingSeats: Math.max(goal - checkedIn, 0)
    };
  }

  function renderDashboard() {
    const metrics = computeMetrics();

    const metricList = [
      { label: "Total Leads", value: String(metrics.totalLeads) },
      { label: "Registered Attendees", value: String(metrics.registered) },
      { label: "Confirmed Attendees", value: String(metrics.confirmed) },
      { label: "Checked-In Attendees", value: String(metrics.checkedIn) },
      { label: "Target Attendance Goal", value: String(metrics.goal) }
    ];

    els.dashboardMetrics.innerHTML = metricList
      .map(function (metric) {
        return (
          "<div class=\"metric\">" +
          "<span class=\"label\">" +
          escapeHtml(metric.label) +
          "</span>" +
          "<span class=\"value\">" +
          escapeHtml(metric.value) +
          "</span>" +
          "</div>"
        );
      })
      .join("");

    els.goalProgressBar.style.width = metrics.progressPct + "%";
    els.goalProgressText.textContent = metrics.progressPct + "%";
    const progressWrap = els.goalProgressBar.parentElement;
    if (progressWrap) {
      progressWrap.setAttribute("aria-valuenow", String(metrics.progressPct));
    }
  }

  function renderAnalytics() {
    const metrics = computeMetrics();

    const items = [
      {
        label: "Lead-to-Registration Rate",
        value: metrics.leadToRegistrationRate.toFixed(1) + "%"
      },
      {
        label: "Registration-to-Check-In Rate",
        value: metrics.registrationToCheckinRate.toFixed(1) + "%"
      },
      { label: "Remaining Seats", value: String(metrics.remainingSeats) }
    ];

    els.analyticsGrid.innerHTML = items
      .map(function (item) {
        return (
          "<div class=\"metric\">" +
          "<span class=\"label\">" +
          escapeHtml(item.label) +
          "</span>" +
          "<span class=\"value\">" +
          escapeHtml(item.value) +
          "</span>" +
          "</div>"
        );
      })
      .join("");

    const remaining = metrics.remainingSeats;
    const conversions = [0.2, 0.3, 0.4];

    const requiredLeadItems = conversions
      .map(function (rate) {
        const needed = remaining > 0 ? Math.ceil(remaining / rate) : 0;
        return "<li>At " + (rate * 100).toFixed(0) + "% conversion: " + needed + " additional leads</li>";
      })
      .join("");

    els.leadNeedPanel.innerHTML =
      "<strong>Suggested additional leads needed</strong>" +
      "<ul>" +
      requiredLeadItems +
      "</ul>";
  }

  function loadDemoData() {
    const now = new Date().toISOString();

    state.event = {
      name: "Healthy Living Community Night",
      date: "2026-05-15",
      time: "18:30",
      location: "Westside Wellness Center",
      goal: 40,
      topic: "Nutrition, mobility, and heart health",
      audienceNotes: "Adults 40+ seeking practical wellness education in a community setting."
    };

    state.leads = [
      {
        id: uid("lead"),
        name: "Alicia Green",
        phone: "555-201-1198",
        email: "alicia.green@example.com",
        condition: "joint stiffness",
        city: "Austin",
        status: "Interested",
        notes: "Prefers evening calls",
        createdAt: now
      },
      {
        id: uid("lead"),
        name: "Marcus Hill",
        phone: "555-334-8821",
        email: "marcus.hill@example.com",
        condition: "blood pressure management",
        city: "Round Rock",
        status: "Contacted",
        notes: "Requested text follow-up",
        createdAt: now
      },
      {
        id: uid("lead"),
        name: "Nina Patel",
        phone: "555-717-2249",
        email: "nina.patel@example.com",
        condition: "weight management",
        city: "Cedar Park",
        status: "New",
        notes: "",
        createdAt: now
      },
      {
        id: uid("lead"),
        name: "Robert Kim",
        phone: "555-888-7650",
        email: "robert.kim@example.com",
        condition: "sleep quality",
        city: "Austin",
        status: "Registered",
        notes: "",
        createdAt: now
      }
    ];

    state.attendees = [
      {
        id: uid("att"),
        name: "Robert Kim",
        phone: "555-888-7650",
        email: "robert.kim@example.com",
        guestCount: 1,
        status: "Registered",
        checkedIn: false,
        notes: "Bringing spouse",
        createdAt: now
      },
      {
        id: uid("att"),
        name: "Dana Lopez",
        phone: "555-901-4501",
        email: "dana.lopez@example.com",
        guestCount: 0,
        status: "Confirmed",
        checkedIn: false,
        notes: "",
        createdAt: now
      },
      {
        id: uid("att"),
        name: "Steven Cole",
        phone: "555-112-0090",
        email: "steven.cole@example.com",
        guestCount: 2,
        status: "Checked In",
        checkedIn: true,
        notes: "Needs front row seating",
        createdAt: now
      }
    ];

    state.selectedLeadId = state.leads[0] ? state.leads[0].id : null;
    saveState();
    renderAll();
  }

  function bindGlobalActions() {
    els.loadDemoBtn.addEventListener("click", function () {
      loadDemoData();
    });

    els.clearDataBtn.addEventListener("click", function () {
      const shouldClear = window.confirm("Clear all event, lead, and attendee data?");
      if (!shouldClear) {
        return;
      }

      state.event = {
        name: "",
        date: "",
        time: "",
        location: "",
        goal: 0,
        topic: "",
        audienceNotes: ""
      };
      state.leads = [];
      state.attendees = [];
      state.selectedLeadId = null;
      saveState();

      els.eventForm.reset();
      renderAll();
      setStatusText(els.eventSaveStatus, "All data cleared.", 1500);
    });
  }

  function renderEventFormFromState() {
    const fields = ["name", "date", "time", "location", "goal", "topic", "audienceNotes"];
    fields.forEach(function (field) {
      if (els.eventForm.elements[field]) {
        els.eventForm.elements[field].value = state.event[field] || "";
      }
    });
  }

  function renderAll() {
    renderEventFormFromState();
    renderDashboard();
    renderLeadTable();
    renderScriptSection();
    renderAttendeesTable();
    renderReminderQueue();
    renderCheckinList();
    renderAnalytics();
  }

  function init() {
    loadState();
    bindEventForm();
    bindLeadImport();
    bindLeadTableActions();
    bindAttendeeForm();
    bindAttendeesTableActions();
    bindCheckinActions();
    bindGlobalActions();

    renderAll();

    // Demo mode seed for first run to make evaluation easier.
    if (state.leads.length === 0 && state.attendees.length === 0 && !state.event.name) {
      loadDemoData();
    }
  }

  init();
})();
