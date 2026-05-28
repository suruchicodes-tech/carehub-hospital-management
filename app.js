const initialData = {
  patients: [
    { id: "P1001", name: "Aarav Sharma", age: "36", gender: "Male", phone: "+91 98765 43210", department: "Cardiology", doctor: "Dr. Meera Kapoor", address: "Indore, MP" },
    { id: "P1002", name: "Nisha Verma", age: "28", gender: "Female", phone: "+91 91234 56780", department: "Emergency", doctor: "Dr. Kabir Rao", address: "Bhopal, MP" }
  ],
  doctors: [
    { name: "Dr. Meera Kapoor", specialization: "Cardiology", timing: "10:00 AM - 4:00 PM", status: "Available" },
    { name: "Dr. Kabir Rao", specialization: "Emergency", timing: "24x7 Shift", status: "Available" },
    { name: "Dr. Sana Ali", specialization: "Neurology", timing: "11:00 AM - 5:00 PM", status: "In Surgery" }
  ],
  appointments: [
    { patient: "Aarav Sharma", doctor: "Dr. Meera Kapoor", date: "2026-05-08", time: "11:30", purpose: "ECG review" }
  ],
  rooms: [
    { number: "101", type: "General", status: "Available", patient: "" },
    { number: "204", type: "Private", status: "Occupied", patient: "Nisha Verma" },
    { number: "ICU-2", type: "ICU", status: "Cleaning", patient: "" }
  ],
  prescriptionOrders: [
    { id: "RX1001", patient: "Aarav Sharma", doctor: "Dr. Meera Kapoor", medicine: "As advised after ECG review", notes: "Dispense only after reception confirmation.", status: "Pending", createdAt: "2026-05-08" }
  ],
  bills: [
    { patient: "Aarav Sharma", service: "Consultation", amount: "1200", status: "Paid" },
    { patient: "Nisha Verma", service: "Emergency Care", amount: "3600", status: "Pending" }
  ]
};

const storeKey = "carehub-hms-data";
const sessionKey = "carehub-hms-session";
let state = loadState();
let session = loadSession();
let searchTerm = "";
let pendingOtp = "";
let selectedPatientId = "";

const rolePermissions = {
  Admin: [
    ["Full Hospital Control", "Patients, doctors, rooms, bills, reports and staff access overview."],
    ["Operations Review", "Use reports dashboard to track beds, billing and department load."],
    ["Escalation Desk", "Monitor emergency beds, pending bills and staff availability."]
  ],
  Doctor: [
    ["Patient Medical Records", "View patient detail, diagnosis, allergies, prescription and visit timeline."],
    ["Appointments", "Track upcoming consultations and follow-up purposes."],
    ["Clinical Notes", "Add visit history notes for each patient record."]
  ],
  Reception: [
    ["Patient Registration", "Add new patients, update contact details and assign departments."],
    ["Appointment Booking", "Book, search and manage patient appointments."],
    ["Room Desk", "Check available beds and assign rooms for admitted patients."]
  ],
  Staff: [
    ["Today Work Queue", "See prescriptions, rooms, appointments and pending billing handovers."],
    ["Patient Support", "Help reception, pharmacy and lab teams complete patient requests."],
    ["Status Updates", "Mark medicines dispensed and coordinate room or billing follow-up."]
  ],
  Lab: [
    ["Lab Work Queue", "Use patient history to track report review and test notes."],
    ["Report Coordination", "Coordinate report status with doctor visits and appointments."],
    ["Patient Search", "Find patients quickly using global search before updating notes."]
  ],
  Pharmacy: [
    ["Prescription Review", "Read prescription fields from patient medical records."],
    ["Billing Support", "Add medicine charges and monitor pending payment status."],
    ["Stock Planning", "Use prescription patterns to plan medicine stock in next phase."]
  ],
  Patient: [
    ["Patient Portal", "View login profile, QR access, appointments, bills and care assistant."],
    ["Care Assistant", "Ask doctor availability, room status, billing and first-aid questions."],
    ["Contact Update", "Update mobile number after OTP login."]
  ]
};

const portalAccess = {
  Admin: ["roleWorkspace", "reports", "patients", "doctors", "appointments", "rooms", "billing"],
  Doctor: ["roleWorkspace"],
  Reception: ["roleWorkspace", "patients", "appointments", "rooms", "billing"],
  Staff: ["roleWorkspace", "patients", "appointments", "rooms", "billing"],
  Lab: ["roleWorkspace", "patients"],
  Pharmacy: ["roleWorkspace", "billing"],
  Patient: ["roleWorkspace"],
  Guest: ["roleWorkspace", "reports", "patients", "doctors", "appointments", "rooms", "billing"]
};

const portalLabels = {
  Admin: ["Admin App", "Complete hospital control panel"],
  Doctor: ["Doctor App", "My patients, appointments and prescriptions"],
  Reception: ["Reception App", "Registrations, appointments, rooms and medicine handover"],
  Staff: ["Staff App", "Daily patient service and handover tasks"],
  Lab: ["Lab App", "Report and test coordination queue"],
  Pharmacy: ["Pharmacy App", "Doctor prescriptions and medicine dispensing"],
  Patient: ["Patient App", "My appointments, doctor, billing and care updates"],
  Guest: ["Hospital App", "Choose a role to open a focused portal"]
};

function loadState() {
  const saved = localStorage.getItem(storeKey);
  return normalizeState(saved ? JSON.parse(saved) : structuredClone(initialData));
}

function normalizeState(data) {
  data.patients = (data.patients || []).map((patient) => ({
    bloodGroup: "Unknown",
    allergies: "",
    diagnosis: "",
    prescription: "",
    visits: [],
    ...patient,
    visits: Array.isArray(patient.visits) ? patient.visits : []
  }));
  data.doctors = data.doctors || [];
  data.appointments = data.appointments || [];
  data.rooms = data.rooms || [];
  data.prescriptionOrders = data.prescriptionOrders || [];
  data.bills = (data.bills || []).map(normalizeBill);
  return data;
}

function loadSession() {
  const saved = localStorage.getItem(sessionKey);
  return saved ? JSON.parse(saved) : null;
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function saveSession() {
  if (session) {
    localStorage.setItem(sessionKey, JSON.stringify(session));
  } else {
    localStorage.removeItem(sessionKey);
  }
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function matchesSearch(item) {
  if (!searchTerm) return true;
  return Object.values(item).join(" ").toLowerCase().includes(searchTerm);
}

function badgeClass(status) {
  if (["Available", "Paid", "Logged in"].includes(status)) return "badge";
  if (["Cleaning", "Pending", "In Surgery"].includes(status)) return "badge warn";
  return "badge danger";
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function normalizeBill(bill) {
  const serviceAmount = Number(bill.amount || 0);
  const roomDays = Number(bill.roomDays || 0);
  const roomRate = Number(bill.roomRate || 0);
  const roomCharge = roomDays * roomRate;
  const total = serviceAmount + roomCharge;
  const paid = Number(bill.paid || (bill.status === "Paid" ? total : 0));
  const due = Math.max(total - paid, 0);
  return {
    roomNumber: "",
    roomDays: "0",
    roomRate: "0",
    paid: String(paid),
    ...bill,
    amount: String(serviceAmount),
    roomCharge,
    total,
    due,
    status: due <= 0 ? "Paid" : "Pending"
  };
}

function renderStats() {
  document.querySelector("#patientCount").textContent = state.patients.length;
  document.querySelector("#doctorCount").textContent = state.doctors.length;
  document.querySelector("#appointmentCount").textContent = state.appointments.length;
  document.querySelector("#freeBedCount").textContent = state.rooms.filter((room) => room.status === "Available").length;
}

function renderPatients() {
  const rows = state.patients.filter(matchesSearch).map((patient, index) => `
    <tr>
      <td>${safe(patient.id)}</td>
      <td>${safe(patient.name)}<div class="meta">${safe(patient.gender)} - ${safe(patient.address)}</div></td>
      <td>${safe(patient.age)}</td>
      <td>${safe(patient.department)}</td>
      <td>${safe(patient.doctor)}</td>
      <td>${safe(patient.phone)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="View patient record" data-view-patient="${safe(patient.id)}">View</button>
          <button class="icon-btn" title="Edit patient" data-edit-patient="${safe(patient.id)}">Edit</button>
          <button class="icon-btn" title="Delete patient" data-delete="patients" data-index="${index}">Delete</button>
        </div>
      </td>
    </tr>
  `);
  document.querySelector("#patientRows").innerHTML = rows.join("") || `<tr><td colspan="7">No patient records found.</td></tr>`;
}

function findPatient(patientId) {
  return state.patients.find((patient) => patient.id === patientId);
}

function renderPatientDetail(patientId) {
  const patient = findPatient(patientId);
  const detail = document.querySelector("#patientDetail");
  if (!patient) {
    detail.classList.add("hidden");
    selectedPatientId = "";
    return;
  }

  selectedPatientId = patient.id;
  detail.classList.remove("hidden");
  document.querySelector("#detailTitle").textContent = `${patient.name} (${patient.id})`;
  document.querySelector("#visitForm").elements.patientId.value = patient.id;
  document.querySelector("#visitForm").elements.doctor.value = patient.doctor || "";
  document.querySelector("#detailSummary").innerHTML = [
    ["Age / Gender", `${patient.age} / ${patient.gender}`],
    ["Phone", patient.phone],
    ["Department", patient.department],
    ["Doctor", patient.doctor],
    ["Blood Group", patient.bloodGroup || "Unknown"],
    ["Allergies", patient.allergies || "None recorded"],
    ["Diagnosis", patient.diagnosis || "None recorded"],
    ["Prescription", patient.prescription || "None recorded"]
  ].map(([label, value]) => `
    <article class="summary-item">
      <span>${safe(label)}</span>
      <strong>${safe(value)}</strong>
    </article>
  `).join("");

  renderVisitTimeline(patient);
}

function renderVisitTimeline(patient) {
  const visits = [...(patient.visits || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  document.querySelector("#visitTimeline").innerHTML = visits.map((visit) => `
    <article class="timeline-item">
      <span>${safe(visit.date)} - ${safe(visit.doctor)}</span>
      <strong>${safe(visit.diagnosis)}</strong>
      <p>${safe(visit.notes)}</p>
    </article>
  `).join("") || `<div class="empty">No visit history yet. Add the first visit note above.</div>`;
}

function renderDoctors() {
  const cards = state.doctors.filter(matchesSearch).map((doctor, index) => `
    <article class="mini-card">
      <strong>${safe(doctor.name)}</strong>
      <span class="meta">${safe(doctor.specialization)}</span>
      <span>${safe(doctor.timing)}</span>
      <span class="${badgeClass(doctor.status)}">${safe(doctor.status)}</span>
      <button class="icon-btn" title="Delete doctor" data-delete="doctors" data-index="${index}">Delete</button>
    </article>
  `);
  document.querySelector("#doctorCards").innerHTML = cards.join("") || `<div class="empty">No doctor records found.</div>`;
}

function renderAppointments() {
  const rows = state.appointments.filter(matchesSearch).map((appointment, index) => `
    <tr>
      <td>${safe(appointment.patient)}</td>
      <td>${safe(appointment.doctor)}</td>
      <td>${safe(appointment.date)}</td>
      <td>${safe(appointment.time)}</td>
      <td>${safe(appointment.purpose)}</td>
      <td><button class="icon-btn" title="Delete appointment" data-delete="appointments" data-index="${index}">Delete</button></td>
    </tr>
  `);
  document.querySelector("#appointmentRows").innerHTML = rows.join("") || `<tr><td colspan="6">No appointments found.</td></tr>`;
}

function renderRooms() {
  const rooms = state.rooms.filter(matchesSearch).map((room, index) => `
    <article class="room-card">
      <strong>Room ${safe(room.number)}</strong>
      <span class="meta">${safe(room.type)}</span>
      <span class="${badgeClass(room.status)}">${safe(room.status)}</span>
      <span>${safe(room.patient || "No patient assigned")}</span>
      <button class="icon-btn" title="Delete room" data-delete="rooms" data-index="${index}">Delete</button>
    </article>
  `);
  document.querySelector("#roomCards").innerHTML = rooms.join("") || `<div class="empty">No room records found.</div>`;
}

function renderBills() {
  state.bills = state.bills.map(normalizeBill);
  const rows = state.bills.filter(matchesSearch).map((bill, index) => `
    <tr>
      <td>${safe(bill.patient)}</td>
      <td>${safe(bill.service)}</td>
      <td>${safe(bill.roomNumber || "-")}<div class="meta">${bill.roomDays || 0} days x ${money(bill.roomRate)}</div></td>
      <td>${money(bill.total)}</td>
      <td>${money(bill.paid)}</td>
      <td>${money(bill.due)}</td>
      <td><span class="${badgeClass(bill.status)}">${safe(bill.status)}</span></td>
      <td><button class="icon-btn" title="Delete bill" data-delete="bills" data-index="${index}">Delete</button></td>
    </tr>
  `);
  document.querySelector("#billRows").innerHTML = rows.join("") || `<tr><td colspan="8">No bill records found.</td></tr>`;
  renderBillingSummary();
  renderPatientLedger();
}

function renderBillingSummary() {
  const totals = state.bills.map(normalizeBill).reduce((sum, bill) => {
    sum.total += bill.total;
    sum.paid += Number(bill.paid || 0);
    sum.due += bill.due;
    sum.room += bill.roomCharge;
    return sum;
  }, { total: 0, paid: 0, due: 0, room: 0 });

  document.querySelector("#billingSummary").innerHTML = [
    ["Total Billing", money(totals.total), "All service and room charges"],
    ["Payment Received", money(totals.paid), "Collected amount"],
    ["Pending Balance", money(totals.due), "Amount still due"],
    ["Room Charges", money(totals.room), "Room/bed billing total"]
  ].map(([label, value, note]) => `
    <article class="ledger-card">
      <span>${safe(label)}</span>
      <strong>${safe(value)}</strong>
      <small>${safe(note)}</small>
    </article>
  `).join("");
}

function renderPatientLedger() {
  const ledger = state.bills.map(normalizeBill).reduce((items, bill) => {
    if (!items[bill.patient]) items[bill.patient] = { total: 0, paid: 0, due: 0, room: 0 };
    items[bill.patient].total += bill.total;
    items[bill.patient].paid += Number(bill.paid || 0);
    items[bill.patient].due += bill.due;
    items[bill.patient].room += bill.roomCharge;
    return items;
  }, {});

  document.querySelector("#patientLedger").innerHTML = Object.entries(ledger).map(([patient, total]) => `
    <article class="ledger-card">
      <span>${safe(patient)}</span>
      <strong>${money(total.due)} due</strong>
      <small>Paid ${money(total.paid)} / Total ${money(total.total)} / Room ${money(total.room)}</small>
    </article>
  `).join("") || `<div class="empty">No patient payment ledger yet.</div>`;
}

function countBy(items, key) {
  return items.reduce((totals, item) => {
    const label = item[key] || "Other";
    totals[label] = (totals[label] || 0) + 1;
    return totals;
  }, {});
}

function drawBarChart(canvasId, data, label) {
  const canvas = document.querySelector(canvasId);
  const ctx = canvas.getContext("2d");
  const entries = Object.entries(data);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#687388";
  ctx.font = "13px Inter, sans-serif";

  if (!entries.length) {
    ctx.fillText(`No ${label} data yet`, 20, 40);
    return;
  }

  const maxValue = Math.max(...entries.map(([, value]) => value), 1);
  const barHeight = 28;
  const gap = 16;
  entries.slice(0, 6).forEach(([name, value], index) => {
    const y = 38 + index * (barHeight + gap);
    const width = Math.max(16, (value / maxValue) * (canvas.width - 190));
    ctx.fillStyle = "#107c7a";
    ctx.fillRect(140, y, width, barHeight);
    ctx.fillStyle = "#172033";
    ctx.fillText(name.slice(0, 18), 18, y + 19);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(value), 150, y + 19);
  });
}

function renderCharts() {
  drawBarChart("#departmentChart", countBy(state.patients, "department"), "department");
  drawBarChart("#roomChart", countBy(state.rooms, "status"), "room");
  drawBarChart("#billingChart", countBy(state.bills, "status"), "billing");
}

function renderAuth() {
  const authStatus = document.querySelector("#authStatus");
  const loginForm = document.querySelector("#loginForm");
  const profileForm = document.querySelector("#profileForm");
  const loginShortcut = document.querySelector("#loginShortcut");

  if (session) {
    authStatus.textContent = "Logged in";
    authStatus.className = badgeClass("Logged in");
    loginForm.classList.add("hidden");
    profileForm.classList.remove("hidden");
    document.querySelector("#profileEmail").value = session.email;
    document.querySelector("#profileMobile").value = session.mobile;
    document.querySelector("#profileRole").value = session.role || "Patient";
    loginShortcut.textContent = "Profile";
  } else {
    authStatus.textContent = "Not logged in";
    authStatus.className = "badge warn";
    loginForm.classList.remove("hidden");
    profileForm.classList.add("hidden");
    loginShortcut.textContent = "Login";
  }
}

function renderRoleWorkspace() {
  const role = session?.role || "Guest";
  const name = session?.name || session?.email || "Guest";
  const [portalName, portalDescription] = portalLabels[role] || portalLabels.Guest;
  const cards = rolePermissions[role] || [
    ["Login Required", "Use OTP login or staff role access to open a role-based workspace."],
    ["Safe Demo Mode", "No section is locked yet, so you can keep building and testing freely."],
    ["Next Upgrade", "Database and strict permissions can be connected after role flow is final."]
  ];

  document.querySelector("#roleWorkspaceTitle").textContent = `${portalName} - ${name}`;
  document.querySelector("#roleBadge").textContent = role;
  document.querySelector("#roleBadge").className = role === "Guest" ? "badge warn" : "badge";
  document.querySelector("#roleCards").innerHTML = `
    <article class="portal-shell">
      <strong>${safe(portalName)}</strong>
      <span>${safe(portalDescription)}</span>
    </article>
  ` + cards.map(([title, body]) => `
    <article class="role-card">
      <strong>${safe(title)}</strong>
      <p>${safe(body)}</p>
    </article>
  `).join("");
  renderRoleWorkflow(role, name);
}

function applyPortalMode() {
  const role = session?.role || "Guest";
  const allowed = new Set(portalAccess[role] || portalAccess.Guest);
  const portalSections = ["roleWorkspace", "reports", "patients", "doctors", "appointments", "rooms", "billing"];
  portalSections.forEach((id) => {
    const section = document.querySelector(`#${id}`);
    if (section) section.classList.toggle("hidden", !allowed.has(id));
    const navLink = document.querySelector(`.nav a[href="#${id}"]`);
    if (navLink) navLink.classList.toggle("hidden", !allowed.has(id));
  });

  const addPatientButton = document.querySelector('[data-scroll="patients"]');
  if (addPatientButton) addPatientButton.classList.toggle("hidden", !allowed.has("patients"));
}

function normalizeName(value) {
  return String(value || "").replace(/^dr\.?\s*/i, "").trim().toLowerCase();
}

function patientByName(name) {
  return state.patients.find((patient) => normalizeName(patient.name) === normalizeName(name));
}

function currentPatientRecord() {
  if (!session) return null;
  const mobile = String(session.mobile || "").replace(/\D/g, "");
  return state.patients.find((patient) => {
    const patientMobile = String(patient.phone || "").replace(/\D/g, "");
    return patientMobile && mobile && patientMobile.endsWith(mobile.slice(-10));
  }) || state.patients.find((patient) => normalizeName(patient.name) === normalizeName(session.name));
}

function appointmentsForDoctor(name) {
  const doctorName = normalizeName(name);
  return state.appointments.filter((appointment) => !doctorName || normalizeName(appointment.doctor).includes(doctorName) || doctorName.includes(normalizeName(appointment.doctor)));
}

function renderRoleWorkflow(role, name) {
  const workflow = document.querySelector("#roleWorkflow");
  if (role === "Doctor") {
    renderDoctorWorkflow(workflow, name);
    return;
  }
  if (role === "Reception" || role === "Pharmacy" || role === "Staff") {
    renderReceptionWorkflow(workflow, role);
    return;
  }
  if (role === "Lab") {
    renderLabWorkflow(workflow);
    return;
  }
  if (role === "Patient") {
    renderPatientWorkflow(workflow);
    return;
  }
  if (role === "Admin") {
    renderAdminWorkflow(workflow);
    return;
  }
  workflow.innerHTML = `<div class="empty">Role select karein to yahan role-specific kaam dikhne lagenge.</div>`;
}

function renderDoctorWorkflow(container, doctorName) {
  const appointments = appointmentsForDoctor(doctorName);
  container.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">Doctor Queue</p>
        <h2>Patients to check today</h2>
      </div>
    </div>
    <div class="workflow-grid">
      ${appointments.map((appointment, index) => {
        const patient = patientByName(appointment.patient) || {};
        return `
          <article class="workflow-card">
            <strong>${safe(appointment.patient)}</strong>
            <div class="meta">${safe(appointment.date)} at ${safe(appointment.time)}<br>${safe(appointment.purpose)}<br>${safe(patient.phone || "No phone saved")}</div>
            <form class="workflow-form" data-prescription-form>
              <input type="hidden" name="appointmentIndex" value="${index}" />
              <input type="hidden" name="patient" value="${safe(appointment.patient)}" />
              <input type="hidden" name="doctor" value="${safe(appointment.doctor)}" />
              <label>Medicine<input name="medicine" required placeholder="Medicine name and dose" /></label>
              <label>Notes<input name="notes" required placeholder="After food, 2 days..." /></label>
              <button class="secondary-btn" type="submit">Send to Reception</button>
            </form>
          </article>
        `;
      }).join("") || `<div class="empty">Is doctor ke liye appointment queue empty hai.</div>`}
    </div>
  `;
}

function renderReceptionWorkflow(container, role) {
  const orders = state.prescriptionOrders || [];
  container.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">${safe(role)} Queue</p>
        <h2>Doctor prescriptions to dispense</h2>
      </div>
    </div>
    <div class="workflow-grid">
      ${orders.map((order, index) => `
        <article class="workflow-card">
          <strong>${safe(order.patient)}</strong>
          <div class="meta">Doctor: ${safe(order.doctor)}<br>Medicine: ${safe(order.medicine)}<br>Notes: ${safe(order.notes)}<br>Status: ${safe(order.status)}</div>
          <button class="secondary-btn" type="button" data-dispense-order="${index}">${order.status === "Dispensed" ? "Dispensed" : "Mark Dispensed"}</button>
        </article>
      `).join("") || `<div class="empty">Abhi koi prescription order pending nahi hai.</div>`}
    </div>
  `;
}

function renderLabWorkflow(container) {
  const labPatients = state.patients.filter((patient) => /test|report|lab|blood|xray|scan/i.test(`${patient.diagnosis} ${patient.prescription}`));
  container.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">Lab Queue</p>
        <h2>Patients needing report coordination</h2>
      </div>
    </div>
    <div class="workflow-grid">
      ${labPatients.map((patient) => `
        <article class="workflow-card">
          <strong>${safe(patient.name)}</strong>
          <div class="meta">${safe(patient.department)}<br>${safe(patient.diagnosis || "No diagnosis")}<br>${safe(patient.prescription || "No report notes")}</div>
        </article>
      `).join("") || `<div class="empty">Abhi lab/report queue empty hai.</div>`}
    </div>
  `;
}

function renderPatientWorkflow(container) {
  const patient = currentPatientRecord();
  const appointments = patient ? state.appointments.filter((appointment) => normalizeName(appointment.patient) === normalizeName(patient.name)) : [];
  container.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">Patient Portal</p>
        <h2>My doctor and appointment details</h2>
      </div>
    </div>
    <div class="workflow-grid">
      ${patient ? appointments.map((appointment) => `
        <article class="workflow-card">
          <strong>${safe(appointment.doctor)}</strong>
          <div class="meta">Patient: ${safe(patient.name)}<br>Date: ${safe(appointment.date)}<br>Time: ${safe(appointment.time)}<br>Purpose: ${safe(appointment.purpose)}</div>
        </article>
      `).join("") || `<div class="empty">${safe(patient.name)} ke liye abhi appointment record nahi hai.</div>` : `<div class="empty">Patient record phone number se match nahi hua. Reception se patient phone update karwayein.</div>`}
    </div>
  `;
}

function renderAdminWorkflow(container) {
  const pendingOrders = (state.prescriptionOrders || []).filter((order) => order.status !== "Dispensed").length;
  const pendingBills = state.bills.map(normalizeBill).filter((bill) => bill.due > 0).length;
  container.innerHTML = `
    <div class="workflow-grid">
      <article class="workflow-card"><strong>${pendingOrders} pending prescriptions</strong><div class="meta">Reception/pharmacy queue mein dispense hona baaki.</div></article>
      <article class="workflow-card"><strong>${pendingBills} pending bills</strong><div class="meta">Billing panel mein follow-up required.</div></article>
      <article class="workflow-card"><strong>${getAvailableRooms().length} free rooms</strong><div class="meta">Rooms panel se allocation track karein.</div></article>
    </div>
  `;
}

function renderQr() {
  document.querySelector("#loginQr").src = "assets/carehms-qr.png";
}

function renderAll() {
  renderStats();
  renderPatients();
  renderDoctors();
  renderAppointments();
  renderRooms();
  renderBills();
  renderCharts();
  renderAuth();
  renderRoleWorkspace();
  applyPortalMode();
  if (selectedPatientId) renderPatientDetail(selectedPatientId);
}

function addRecord(formId, collection, transform = (item) => item) {
  document.querySelector(formId).addEventListener("submit", (event) => {
    event.preventDefault();
    const record = transform(formToObject(event.currentTarget));
    state[collection].push(record);
    saveState();
    event.currentTarget.reset();
    renderAll();
  });
}

function getAvailableDoctors() {
  return state.doctors.filter((doctor) => doctor.status === "Available");
}

function getAvailableRooms() {
  return state.rooms.filter((room) => room.status === "Available");
}

function buildBotReply(message) {
  const text = message.toLowerCase();
  if (["hello", "hi", "hey", "namaste", "hii", "helo"].some((word) => text.includes(word))) {
    return "Hello, namaste. Main CareHub assistant hoon. Aap doctor availability, room/bed status, appointment, billing ya first-aid ke baare mein pooch sakte hain.";
  }

  if (text.includes("doctor") || text.includes("doc") || text.includes("available")) {
    const doctors = getAvailableDoctors();
    if (!doctors.length) return "Abhi koi doctor Available status mein nahi hai. Reception se emergency desk connect karwa sakte hain.";
    return `Available doctors: ${doctors.map((doctor) => `${doctor.name} (${doctor.specialization}, ${doctor.timing})`).join("; ")}.`;
  }

  if (text.includes("room") || text.includes("bed") || text.includes("icu")) {
    const rooms = getAvailableRooms();
    if (!rooms.length) return "Abhi free bed record mein nahi dikh raha. Room list update karke reception se confirm karein.";
    return `Available rooms: ${rooms.map((room) => `Room ${room.number} (${room.type})`).join(", ")}.`;
  }

  if (text.includes("appointment") || text.includes("booking")) {
    return "Appointment ke liye Appointments section mein patient name, doctor, date, time aur purpose fill karke Book Appointment dabaiye.";
  }

  if (text.includes("bill") || text.includes("payment")) {
    const pending = state.bills.map(normalizeBill).filter((bill) => bill.due > 0);
    return pending.length ? `Pending bills: ${pending.map((bill) => `${bill.patient} - due ${money(bill.due)}, paid ${money(bill.paid)}`).join("; ")}.` : "Abhi pending bill record mein nahi hai.";
  }

  if (text.includes("medicine") || text.includes("injury") || text.includes("pain") || text.includes("cut") || text.includes("burn")) {
    return "Medicine doctor ki advice ke bina start na karein. Injury mein wound ko clean water se gently rinse karein, bleeding ho to clean cloth se pressure dein, burn par cool running water use karein, aur severe pain, deep wound, fever, swelling, head injury ya breathing issue ho to emergency/reception se turant contact karein.";
  }

  if (text.includes("login") || text.includes("otp")) {
    return "Login section mein QR scan karein ya email/mobile daalein. Demo mode mein OTP screen par dikhega; real SMS/email ke liye backend gateway connect karna hoga.";
  }

  return "Main doctor availability, room/bed status, appointment, billing, login OTP aur first-aid guidance mein help kar sakta hoon. Aap apna question thoda specific likhein.";
}

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.timeout = 60000;
    request.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(request.responseText || "{}");
      } catch {
        reject(new Error("Server ne invalid response bheja."));
        return;
      }

      if (request.status >= 200 && request.status < 300 && payload.ok !== false) {
        resolve(payload);
      } else {
        reject(new Error(payload.message || `Request failed (${request.status}).`));
      }
    };
    request.onerror = () => reject(new Error("Backend se connection nahi ho paya."));
    request.ontimeout = () => reject(new Error("OTP request timed out."));
    request.send(JSON.stringify(data));
  });
}

document.querySelector("#patientForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const patient = formToObject(form);
  const existing = patient.id ? findPatient(patient.id) : null;

  if (existing) {
    Object.assign(existing, patient, { visits: existing.visits || [] });
    selectedPatientId = existing.id;
  } else {
    const nextIdNumber = 1001 + state.patients.length;
    state.patients.push({
      ...patient,
      id: `P${nextIdNumber}`,
      visits: []
    });
  }

  saveState();
  form.reset();
  form.elements.id.value = "";
  document.querySelector("#cancelPatientEdit").classList.add("hidden");
  form.querySelector("button[type='submit']").textContent = "Save Patient";
  renderAll();
});
addRecord("#doctorForm", "doctors");
addRecord("#appointmentForm", "appointments");
addRecord("#roomForm", "rooms");
addRecord("#billForm", "bills", normalizeBill);

document.querySelector("#visitForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const visit = formToObject(event.currentTarget);
  const patient = findPatient(visit.patientId);
  if (!patient) return;
  patient.visits = patient.visits || [];
  patient.visits.push({
    date: visit.date,
    doctor: visit.doctor,
    diagnosis: visit.diagnosis,
    notes: visit.notes
  });
  saveState();
  event.currentTarget.reset();
  renderPatientDetail(patient.id);
});

document.querySelector("#cancelPatientEdit").addEventListener("click", () => {
  const form = document.querySelector("#patientForm");
  form.reset();
  form.elements.id.value = "";
  document.querySelector("#cancelPatientEdit").classList.add("hidden");
  form.querySelector("button[type='submit']").textContent = "Save Patient";
});

document.querySelector("#closePatientDetail").addEventListener("click", () => {
  selectedPatientId = "";
  document.querySelector("#patientDetail").classList.add("hidden");
});

document.querySelector("#globalSearch").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderAll();
});

document.querySelector("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formToObject(event.currentTarget);
  const sendButton = event.currentTarget.querySelector("button[type='submit']");
  sendButton.disabled = true;
  sendButton.textContent = "Sending...";
  document.querySelector("#demoOtp").textContent = "Sending OTP...";
  postJson("/api/send-otp", { email: data.email, mobile: data.mobile })
    .then((payload) => {
      pendingOtp = "server";
      event.currentTarget.classList.add("otp-visible");
      document.querySelector("#demoOtp").textContent = `${payload.message} OTP SMS par aane ke baad code enter karein.`;
    })
    .catch((error) => {
      pendingOtp = "";
      document.querySelector("#demoOtp").textContent = `${error.message} MSG91 Logs bhi check karein.`;
    })
    .finally(() => {
      sendButton.disabled = false;
      sendButton.textContent = "Send OTP";
    });
});

document.querySelector("#verifyOtpBtn").addEventListener("click", () => {
  const form = document.querySelector("#loginForm");
  const data = formToObject(form);
  if (!pendingOtp) {
    document.querySelector("#demoOtp").textContent = "Please send OTP first.";
    return;
  }
  document.querySelector("#demoOtp").textContent = "Verifying OTP...";
  postJson("/api/verify-otp", { email: data.email, mobile: data.mobile, otp: data.otp })
    .then((payload) => {
      session = { email: payload.user.email, mobile: payload.user.mobile, role: "Patient", name: "Patient", loggedInAt: new Date().toISOString() };
      saveSession();
      pendingOtp = "";
      form.reset();
      form.classList.remove("otp-visible");
      document.querySelector("#demoOtp").textContent = "";
      renderAll();
    })
    .catch((error) => {
      document.querySelector("#demoOtp").textContent = error.message;
    });
});

document.querySelector("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!session) return;
  session.mobile = document.querySelector("#profileMobile").value.trim();
  saveSession();
  renderAll();
});

document.querySelector("#roleForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = formToObject(event.currentTarget);
  if (data.passcode !== "1234") {
    document.querySelector("#roleMessage").textContent = "Wrong passcode. Demo passcode 1234 use karein.";
    return;
  }

  session = {
    email: `${data.name.toLowerCase().replace(/\s+/g, ".")}@carehub.local`,
    mobile: session?.mobile || "",
    role: data.role,
    name: data.name,
    loggedInAt: new Date().toISOString()
  };
  saveSession();
  document.querySelector("#roleMessage").textContent = `${data.role} workspace opened.`;
  renderAll();
  document.querySelector("#roleWorkspace").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.addEventListener("submit", (event) => {
  const prescriptionForm = event.target.closest("[data-prescription-form]");
  if (!prescriptionForm) return;
  event.preventDefault();
  const data = formToObject(prescriptionForm);
  const patient = patientByName(data.patient);
  const order = {
    id: `RX${1001 + (state.prescriptionOrders || []).length}`,
    patient: data.patient,
    doctor: data.doctor,
    medicine: data.medicine,
    notes: data.notes,
    status: "Pending",
    createdAt: new Date().toISOString().slice(0, 10)
  };
  state.prescriptionOrders = state.prescriptionOrders || [];
  state.prescriptionOrders.push(order);
  if (patient) {
    patient.prescription = data.medicine;
    patient.visits = patient.visits || [];
    patient.visits.push({
      date: order.createdAt,
      doctor: data.doctor,
      diagnosis: "Prescription issued",
      notes: `${data.medicine} - ${data.notes}`
    });
  }
  saveState();
  prescriptionForm.reset();
  renderAll();
  document.querySelector("#roleMessage").textContent = `Prescription ${order.id} reception/pharmacy queue mein add ho gaya.`;
});

document.querySelector("#logoutBtn").addEventListener("click", () => {
  session = null;
  saveSession();
  renderAll();
});

document.querySelector("#chatLauncher").addEventListener("click", () => {
  document.querySelector("#chatbot").classList.toggle("hidden");
});

document.querySelector("#closeChat").addEventListener("click", () => {
  document.querySelector("#chatbot").classList.add("hidden");
});

document.querySelector("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = event.currentTarget.elements.message;
  const message = input.value.trim();
  if (!message) return;
  const messages = document.querySelector("#chatMessages");
  messages.insertAdjacentHTML("beforeend", `<div class="user-message">${safe(message)}</div>`);
  messages.insertAdjacentHTML("beforeend", `<div class="bot-message">${safe(buildBotReply(message))}</div>`);
  input.value = "";
  messages.scrollTop = messages.scrollHeight;
});

document.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete]");
  const scrollButton = event.target.closest("[data-scroll]");
  const viewPatientButton = event.target.closest("[data-view-patient]");
  const editPatientButton = event.target.closest("[data-edit-patient]");
  const dispenseButton = event.target.closest("[data-dispense-order]");

  if (dispenseButton) {
    const order = state.prescriptionOrders?.[Number(dispenseButton.dataset.dispenseOrder)];
    if (order) {
      order.status = "Dispensed";
      order.dispensedAt = new Date().toISOString().slice(0, 10);
      saveState();
      renderAll();
    }
  }

  if (viewPatientButton) {
    renderPatientDetail(viewPatientButton.dataset.viewPatient);
  }

  if (editPatientButton) {
    const patient = findPatient(editPatientButton.dataset.editPatient);
    const form = document.querySelector("#patientForm");
    if (patient) {
      Object.entries(patient).forEach(([key, value]) => {
        if (form.elements[key] && key !== "visits") {
          form.elements[key].value = value;
        }
      });
      document.querySelector("#cancelPatientEdit").classList.remove("hidden");
      form.querySelector("button[type='submit']").textContent = "Update Patient";
      renderPatientDetail(patient.id);
      document.querySelector("#patients").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (deleteButton) {
    const collection = deleteButton.dataset.delete;
    const visibleItem = state[collection].filter(matchesSearch)[Number(deleteButton.dataset.index)];
    const actualIndex = state[collection].indexOf(visibleItem);
    if (actualIndex >= 0) {
      if (collection === "patients" && state[collection][actualIndex].id === selectedPatientId) {
        selectedPatientId = "";
        document.querySelector("#patientDetail").classList.add("hidden");
      }
      state[collection].splice(actualIndex, 1);
      saveState();
      renderAll();
    }
  }

  if (scrollButton) {
    document.querySelector(`#${scrollButton.dataset.scroll}`).scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

renderQr();
renderAll();
