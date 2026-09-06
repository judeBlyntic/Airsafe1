/* AirSafe report app — multi-template engine.
   Templates are defined in templates.js (TEMPLATES / TEMPLATE_ORDER).
   Reports live in IndexedDB so photo-heavy history doesn't hit localStorage quotas. */

"use strict";

const LEGACY_LS_KEY = "airsafe_acc2026_classA_v1";
const DB_NAME = "airsafe_reports";
const DB_STORE = "reports";

/* ================= IndexedDB storage ================= */

let dbPromise = null;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
function dbOp(mode, fn) {
  return db().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(DB_STORE, mode);
    const out = fn(tx.objectStore(DB_STORE));
    tx.oncomplete = () => resolve(out && out.result);
    tx.onerror = () => reject(tx.error);
  }));
}
const dbPut = (report) => dbOp("readwrite", s => s.put(report));
const dbDelete = (id) => dbOp("readwrite", s => s.delete(id));
const dbGetAll = () => dbOp("readonly", s => s.getAll());

/* ================= Report model ================= */

let report = null;          // the currently open report (null on home screen)
let tpl = null;             // TEMPLATES[report.templateId]

function blankReport(templateId) {
  const t = TEMPLATES[templateId];
  const r = {
    id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    templateId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fields: {}, tables: {}, photos: {},
    hiddenSections: []
  };
  t.cover.fields.forEach(f => r.fields[f.key] = f.def !== undefined ? f.def : "");
  t.sections.forEach(sec => (sec.blocks || []).forEach(b => {
    if (b.type === "text" || b.type === "sigtext" || b.type === "field") r.fields[b.key] = b.def !== undefined ? b.def : "";
    if (b.type === "fieldpair") b.keys.forEach(k => { if (!(k in r.fields)) r.fields[k] = ""; });
    if (b.type === "table") r.tables[b.key] = b.items.map(() => ({ verified: "", comments: "" }));
  }));
  t.sections.forEach(sec => {
    if (sec.photos) {
      r.photos[sec.id] = [];
    }
  });
  return r;
}

/* Merge saved data over a fresh blank so template additions appear in old reports. */
function hydrate(saved) {
  const base = blankReport(saved.templateId);
  const r = {
    ...base, ...saved,
    fields: Object.assign(base.fields, saved.fields || {}),
    tables: Object.assign(base.tables, saved.tables || {}),
    hiddenSections: Array.isArray(saved.hiddenSections) ? saved.hiddenSections : []
  };
  
  const photosObj = {};
  const t = TEMPLATES[r.templateId];
  t.sections.forEach(sec => {
    if (sec.photos) {
      photosObj[sec.id] = [];
    }
  });

  if (saved.photos) {
    if (Array.isArray(saved.photos)) {
      photosObj.appA = saved.photos;
    } else {
      Object.assign(photosObj, saved.photos);
    }
  }
  r.photos = photosObj;
  return r;
}

async function migrateLegacyDraft() {
  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY);
    if (!raw) return;
    const old = JSON.parse(raw);
    const r = blankReport("classA");
    Object.assign(r.fields, old.fields || {});
    Object.assign(r.tables, old.tables || {});
    r.photos = Array.isArray(old.photos) ? { appA: old.photos } : (old.photos || {});
    await dbPut(r);
    localStorage.removeItem(LEGACY_LS_KEY);
  } catch (e) { console.warn("Legacy draft migration skipped:", e); }
}

let saveTimer = null;
function scheduleSave() {
  setStatus("Editing…", true);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 600);
}
function saveNow() {
  if (!report) return;
  report.updatedAt = Date.now();
  dbPut(report).then(
    () => setStatus("Saved", false),
    (e) => { console.error(e); setStatus("Not saved — storage error", true); }
  );
}
function setStatus(txt, dirty) {
  const el = document.getElementById("saveStatus");
  el.textContent = txt;
  el.classList.toggle("dirty", !!dirty);
}

/* ================= Navigation ================= */

const views = { home: "homeView", edit: "editView", review: "reviewView", send: "sendView" };

let currentView = "home";
function showView(which) {
  currentView = which;
  Object.values(views).forEach(id => document.getElementById(id).classList.remove("active"));
  document.getElementById(views[which]).classList.add("active");
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === which));
  const onHome = which === "home";
  document.getElementById("tabsNav").hidden = onHome;
  document.getElementById("btnBack").hidden = onHome;
  document.getElementById("saveStatus").hidden = onHome;
  document.getElementById("appFooter").hidden = onHome;
  document.getElementById("topTitle").textContent = onHome ? "AirSafe Reports" : tpl.tileName;
  document.getElementById("topSubtitle").textContent = onHome ? "Clearance certificates & inspection records" : tpl.subtitle;
  window.scrollTo({ top: 0 });
}

async function goHome() {
  if (report) { clearTimeout(saveTimer); await new Promise(res => { report.updatedAt = Date.now(); dbPut(report).then(res, res); }); }
  report = null; tpl = null;
  // clear stale report content so it can never bleed into another view
  document.getElementById("editView").innerHTML = "";
  document.getElementById("reviewDoc").innerHTML = "";
  document.getElementById("reviewDoc").style.height = "";
  await renderHome();
  showView("home");
}

function openReport(r) {
  report = r;
  tpl = TEMPLATES[r.templateId];
  initHistory();
  renderEdit();
  document.getElementById("emailTo").value = "";
  document.getElementById("emailSubject").value = "";
  document.getElementById("emailBody").value = "";
  showView("edit");
}

async function createReport(templateId) {
  const r = blankReport(templateId);
  await dbPut(r);
  openReport(r);
}

/* ================= Home view (history) ================= */

async function renderHome() {
  const grid = document.getElementById("historyGrid");
  let reports = [];
  try { reports = await dbGetAll(); } catch (e) { console.error(e); }
  reports.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  grid.innerHTML = "";
  if (reports.length === 0) {
    grid.innerHTML = `<div class="history-empty">No reports yet.<br>Tap <b>+ New Report</b> to create your first one.</div>`;
    return;
  }
  reports.forEach(r => {
    const t = TEMPLATES[r.templateId];
    if (!t) return;
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "report-tile";
    tile.style.setProperty("--accent", t.accent);
    const addr = (r.fields && r.fields.siteAddress) || "";
    const repNo = (r.fields && r.fields.reportNo) || "";
    const when = new Date(r.updatedAt || r.createdAt);
    const photoCount = r.photos ? Object.values(r.photos).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0) : 0;
    tile.innerHTML = `
      <span class="tile-kind">${esc(t.tileName)}</span>
      <span class="tile-site">${addr ? esc(addr) : '<i>No site address yet</i>'}</span>
      <span class="tile-report">${esc(repNo)}</span>
      <span class="tile-meta">
        <span>${esc(when.toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }))}
        · ${esc(when.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" }))}</span>
        ${photoCount ? `<span>${photoCount} photo${photoCount > 1 ? "s" : ""}</span>` : ""}
      </span>`;
    const del = document.createElement("span");
    del.className = "tile-del";
    del.title = "Delete report";
    del.textContent = "✕";
    del.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      if (!confirm(`Delete this ${t.tileName}${addr ? " for " + addr : ""}? This cannot be undone.`)) return;
      await dbDelete(r.id);
      renderHome();
    });
    tile.appendChild(del);
    tile.addEventListener("click", () => openReport(hydrate(r)));
    grid.appendChild(tile);
  });
}

/* ---- Template picker ---- */

let pickerOpenedAt = 0;
function openPicker() {
  pickerOpenedAt = Date.now();
  const overlay = document.getElementById("pickerOverlay");
  const list = document.getElementById("pickerList");
  list.innerHTML = "";
  TEMPLATE_ORDER.forEach(id => {
    const t = TEMPLATES[id];
    const card = document.createElement("button");
    card.type = "button";
    card.className = "picker-card";
    card.style.setProperty("--accent", t.accent);
    card.innerHTML = `<b>${esc(t.tileName)}</b><span>${esc(t.docTitle)}</span>`;
    card.addEventListener("click", () => { closePicker(); createReport(id); });
    list.appendChild(card);
  });
  overlay.hidden = false;
}
function closePicker() { document.getElementById("pickerOverlay").hidden = true; }

/* ================= Undo/Redo State Manager ================= */
const undoStack = [];
const redoStack = [];
let lastSnapshot = null;
let typingTimer = null;

function getSnapshot() {
  if (!report) return null;
  return JSON.stringify({
    fields: report.fields,
    tables: report.tables,
    photos: report.photos
  });
}

/* Per-textarea Undo/Redo bars, registered as they're rendered so their
   disabled state stays in sync with the shared undo/redo stack. Reset on
   every renderEdit() since the old buttons are torn down with the DOM. */
let historyButtonEls = [];

function updateUndoRedoButtons() {
  const uBtn = document.getElementById("undoBtn");
  const rBtn = document.getElementById("redoBtn");
  if (uBtn) uBtn.disabled = undoStack.length === 0;
  if (rBtn) rBtn.disabled = redoStack.length === 0;
  historyButtonEls.forEach(pair => {
    pair.u.disabled = undoStack.length === 0;
    pair.r.disabled = redoStack.length === 0;
  });
}

function makeTaHistoryBar() {
  const bar = document.createElement("div");
  bar.className = "ta-hist-bar";

  const uBtn = document.createElement("button");
  uBtn.type = "button";
  uBtn.className = "ta-hist-btn";
  uBtn.title = "Undo last change";
  uBtn.textContent = "↶ Undo";
  uBtn.disabled = undoStack.length === 0;
  uBtn.addEventListener("click", (e) => { e.preventDefault(); undo(); });

  const rBtn = document.createElement("button");
  rBtn.type = "button";
  rBtn.className = "ta-hist-btn";
  rBtn.title = "Redo";
  rBtn.textContent = "↷ Redo";
  rBtn.disabled = redoStack.length === 0;
  rBtn.addEventListener("click", (e) => { e.preventDefault(); redo(); });

  bar.appendChild(uBtn);
  bar.appendChild(rBtn);
  historyButtonEls.push({ u: uBtn, r: rBtn });
  return bar;
}

function pushHistory() {
  const current = getSnapshot();
  if (!current) return;
  if (lastSnapshot && lastSnapshot === current) return;
  
  if (lastSnapshot) {
    undoStack.push(lastSnapshot);
    if (undoStack.length > 50) undoStack.shift();
  }
  lastSnapshot = current;
  redoStack.length = 0;
  updateUndoRedoButtons();
}

function initHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
  lastSnapshot = getSnapshot();
  updateUndoRedoButtons();
}

function restoreSnapshot(snapStr) {
  if (!report || !snapStr) return;
  const snap = JSON.parse(snapStr);
  
  // Keep active element to restore focus and selection
  const activeId = document.activeElement ? document.activeElement.id : null;
  const activeKey = document.activeElement ? document.activeElement.dataset.key : null;
  const activeSelStart = document.activeElement ? document.activeElement.selectionStart : null;
  const activeSelEnd = document.activeElement ? document.activeElement.selectionEnd : null;
  
  report.fields = snap.fields;
  report.tables = snap.tables;
  report.photos = snap.photos;
  
  if (currentView === "edit") {
    renderEdit();
    drawPhotoGrid();
    
    // Restore focus and cursor selection
    let el = null;
    if (activeId) el = document.getElementById(activeId);
    else if (activeKey) el = document.querySelector(`[data-key="${activeKey}"]`);
    
    if (el) {
      el.focus();
      if (activeSelStart !== null && activeSelEnd !== null && typeof el.setSelectionRange === "function") {
        el.setSelectionRange(activeSelStart, activeSelEnd);
      }
    }
  }
  scheduleSave();
}

function undo() {
  if (undoStack.length === 0) return;
  const prev = undoStack.pop();
  const current = getSnapshot();
  redoStack.push(current);
  lastSnapshot = prev;
  restoreSnapshot(prev);
  updateUndoRedoButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  const next = redoStack.pop();
  const current = getSnapshot();
  undoStack.push(current);
  lastSnapshot = next;
  restoreSnapshot(next);
  updateUndoRedoButtons();
}

function recordTyping() {
  if (!typingTimer) {
    pushHistory();
  }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    pushHistory();
    typingTimer = null;
  }, 1200);
}

/* ================= Edit view ================= */

const editView = document.getElementById("editView");

function autoGrow(ta) {
  ta.style.height = "auto";
  ta.style.height = (ta.scrollHeight + 2) + "px";
}

function makeInput(key, type, options) {
  let el;
  if (type === "checkbox") {
    // Tri-state tick box: 1 click = Yes, double-click = No, triple-click = N/A.
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "10px";
    container.style.marginTop = "6px";
    container.style.marginBottom = "6px";

    const box = document.createElement("div");
    box.className = "cycle-box cycle-box-sm";

    const normalize = (v) => {
      if (v === true) return "Yes";
      if (v === false) return "";
      return v || "";
    };

    const updateState = () => {
      const v = normalize(report.fields[key]);
      box.className = "cycle-box cycle-box-sm";
      if (v === "Yes") { box.classList.add("state-yes"); box.textContent = "Yes"; }
      else if (v === "No") { box.classList.add("state-no"); box.textContent = "No"; }
      else if (v === "N/A") { box.classList.add("state-na"); box.textContent = "N/A"; }
      else { box.textContent = "—"; }
    };
    updateState();

    let clickCount = 0;
    let clickTimer = null;
    box.addEventListener("click", () => {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        const next = clickCount === 1 ? "Yes" : clickCount === 2 ? "No" : "N/A";
        clickCount = 0;
        if (normalize(report.fields[key]) !== next) {
          pushHistory();
          report.fields[key] = next;
          updateState();
          scheduleSave();
        }
      }, 450);
    });

    container.appendChild(box);
    return container;
  }

  if (type === "yesno" || type === "select") {
    el = document.createElement("select");
    const opts = type === "yesno" ? ["", "Yes", "No", "N/A"] : [""].concat(options || []);
    opts.forEach(v => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v === "" ? "—" : v;
      el.appendChild(o);
    });
    el.value = report.fields[key] || "";
    el.addEventListener("change", () => {
      pushHistory();
      report.fields[key] = el.value;
      scheduleSave();
    });
  } else if (type === "date" || type === "time") {
    el = document.createElement("input");
    el.type = type;
    el.value = report.fields[key] || "";
    el.addEventListener("input", () => {
      recordTyping();
      report.fields[key] = el.value;
      scheduleSave();
    });
  } else {
    el = document.createElement("input");
    el.type = "text";
    el.spellcheck = true;
    el.lang = "en";
    el.value = report.fields[key] || "";
    el.addEventListener("input", () => {
      let val = el.value.replace(/(?<=\d|\b)m2\b/gi, (match) => match[0] === 'M' ? 'M²' : 'm²');
      if (val !== el.value) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        el.value = val;
        el.setSelectionRange(start, end);
      }
      recordTyping();
      report.fields[key] = el.value;
      scheduleSave();
    });
    if (isClientKey(key)) {
      clientInputEls[key] = el;
      attachClientAutocomplete(el, key);
    }
  }
  return el;
}

/* ================= Client directory (Supabase) ================= */
/* Live references to the client-field <input>s in the current edit view,
   so a chosen suggestion can fill all of them at once. Reset each render. */
let clientInputEls = {};

function isClientKey(key) {
  return typeof CLIENT_KEYS !== "undefined" && CLIENT_KEYS.includes(key);
}

/* Fill every client field from a Supabase row, updating both state and DOM. */
function applyClient(row) {
  CLIENT_KEYS.forEach(key => {
    const val = row[CLIENT_FIELD_MAP[key]] || "";
    report.fields[key] = val;
    const el = clientInputEls[key];
    if (el) el.value = val;
  });
  scheduleSave();
}

/* ---- shared autocomplete dropdown (one, reused for all client fields) ---- */
let acBox = null, acInput = null, acTimer = null;

function ensureAcBox() {
  if (acBox) return acBox;
  acBox = document.createElement("div");
  acBox.className = "client-ac";
  acBox.hidden = true;
  document.body.appendChild(acBox);
  document.addEventListener("mousedown", (e) => {
    if (acBox && !acBox.hidden && !acBox.contains(e.target) && e.target !== acInput) hideAc();
  });
  window.addEventListener("scroll", hideAc, true);
  window.addEventListener("resize", hideAc);
  return acBox;
}
function hideAc() {
  if (acBox) { acBox.hidden = true; acBox.innerHTML = ""; }
  acInput = null;
}
function positionAc(input) {
  const r = input.getBoundingClientRect();
  acBox.style.left = (r.left + window.scrollX) + "px";
  acBox.style.top = (r.bottom + window.scrollY + 2) + "px";
  acBox.style.width = r.width + "px";
}
function showAcResults(input, rows) {
  ensureAcBox();
  if (!rows.length) { hideAc(); return; }
  acInput = input;
  acBox.innerHTML = "";
  rows.forEach(row => {
    const item = document.createElement("div");
    item.className = "client-ac-item";
    const title = document.createElement("div");
    title.className = "client-ac-title";
    title.textContent = row.company_name || "(no company name)";
    item.appendChild(title);
    const subText = [row.contact_person, row.client_phone, row.client_email]
      .filter(Boolean).join(" · ");
    if (subText) {
      const sub = document.createElement("div");
      sub.className = "client-ac-sub";
      sub.textContent = subText;
      item.appendChild(sub);
    }
    // mousedown (not click) so it fires before the input's blur handler.
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      applyClient(row);
      hideAc();
    });
    acBox.appendChild(item);
  });
  positionAc(input);
  acBox.hidden = false;
}
function attachClientAutocomplete(input, key) {
  input.setAttribute("autocomplete", "off");
  input.addEventListener("input", () => {
    if (!clientsEnabled()) return;
    const q = input.value;
    clearTimeout(acTimer);
    if (q.trim().length < 2) { hideAc(); return; }
    acTimer = setTimeout(async () => {
      const rows = await clientSearch(key, q);
      if (document.activeElement === input) showAcResults(input, rows);
    }, 300);
  });
  input.addEventListener("blur", () => setTimeout(hideAc, 150));
}

/* A section holds the client details if it renders the Company Name field. */
function sectionHasClientFields(sec) {
  return (sec.blocks || []).some(b => b.key === "companyName");
}

/* "Save client to directory" button appended under the Client Information section. */
function renderClientSaveBar() {
  const bar = document.createElement("div");
  bar.className = "client-save-bar";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn secondary";
  btn.textContent = "💾 Save client to directory";

  const status = document.createElement("span");
  status.className = "client-save-status";

  if (!clientsEnabled()) {
    btn.disabled = true;
    status.textContent = "Client directory not configured (see clients.js).";
  } else {
    status.textContent = "Save these details to reuse in future reports.";
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    status.textContent = "Saving…";
    try {
      const result = await clientSave(report.fields);
      status.textContent = result === "added"
        ? "✓ Client added to directory."
        : "✓ Client updated in directory.";
    } catch (e) {
      status.textContent = "⚠ " + (e.message || "Could not save client.");
    } finally {
      btn.disabled = false;
    }
  });

  bar.appendChild(btn);
  bar.appendChild(status);
  return bar;
}

function renderEdit() {
  editView.innerHTML = "";
  clientInputEls = {};
  historyButtonEls = [];



  const cover = document.createElement("div");
  cover.className = "doc-cover";
  cover.style.setProperty("--accent", tpl.accent);
  cover.innerHTML = `<img src="logo.png" alt="AirSafe logo">
    <h1>${esc(tpl.docTitle)}</h1>
    <p>AirSafe Environmental Solutions Limited · info@airsafe.net.nz · 021-292-9688</p>`;
  editView.appendChild(cover);



  const coverCard = sectionCard("COVER PAGE & CERTIFICATE DETAILS", "cover");
  const grid = document.createElement("div");
  grid.className = "field-grid";
  tpl.cover.fields.forEach(f => {
    const wrap = document.createElement("div");
    const lab = document.createElement("label");
    lab.className = "field-label";
    lab.textContent = f.label;
    wrap.appendChild(lab);
    wrap.appendChild(makeInput(f.key, f.type, f.options));
    grid.appendChild(wrap);
  });
  coverCard.body.appendChild(grid);
  editView.appendChild(coverCard.card);

  tpl.sections.forEach(sec => {
    const { card, body } = sectionCard(sec.title, sec.id);
    (sec.blocks || []).forEach(b => body.appendChild(renderBlock(b)));
    if (sectionHasClientFields(sec)) body.appendChild(renderClientSaveBar());
    if (sec.photos) body.appendChild(renderPhotoSection(sec.id));
    editView.appendChild(card);
  });
}

function sectionCard(title, id) {
  const card = document.createElement("section");
  card.className = "section-card";
  card.id = "card-" + id;
  
  const head = document.createElement("div");
  head.className = "section-head";
  
  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  titleEl.addEventListener("click", () => card.classList.toggle("collapsed"));
  head.appendChild(titleEl);

  const actions = document.createElement("div");
  actions.className = "section-head-actions";

  if (tpl) {
    const switchLabel = document.createElement("label");
    switchLabel.className = "section-switch";
    switchLabel.title = "Toggle Section Visibility";
    
    const switchInput = document.createElement("input");
    switchInput.type = "checkbox";
    const isHidden = (report.hiddenSections || []).includes(id);
    switchInput.checked = !isHidden;
    
    if (isHidden) {
      card.classList.add("section-hidden");
    }

    const switchSlider = document.createElement("span");
    switchSlider.className = "section-slider";

    switchLabel.appendChild(switchInput);
    switchLabel.appendChild(switchSlider);

    switchInput.addEventListener("change", (e) => {
      e.stopPropagation();
      pushHistory();
      if (!report.hiddenSections) report.hiddenSections = [];
      const idx = report.hiddenSections.indexOf(id);
      if (!switchInput.checked) {
        if (idx === -1) report.hiddenSections.push(id);
        card.classList.add("section-hidden");
      } else {
        if (idx > -1) report.hiddenSections.splice(idx, 1);
        card.classList.remove("section-hidden");
      }
      scheduleSave();
    });
    actions.appendChild(switchLabel);
  }

  const chev = document.createElement("span");
  chev.className = "chev";
  chev.textContent = "▼";
  chev.addEventListener("click", () => card.classList.toggle("collapsed"));
  actions.appendChild(chev);

  head.appendChild(actions);

  head.addEventListener("click", (e) => {
    if (e.target === head || e.target === actions) {
      card.classList.toggle("collapsed");
    }
  });

  const body = document.createElement("div");
  body.className = "section-body";
  card.appendChild(head);
  card.appendChild(body);
  return { card, body };
}

function getVerifiedText(val) {
  if (val === true || val === "Yes") return "Yes";
  if (val === false || val === "No") return "No";
  if (val === "N/A") return "N/A";
  return "";
}

function getOriginalSectionIndex(sec) {
  if (sec.id.startsWith("app")) {
    const char = sec.id.slice(-1);
    return char.charCodeAt(0) - 64;
  }
  const match = sec.title.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

function renumberTitle(title, newIndex, isAppendix) {
  if (isAppendix) {
    const letter = String.fromCharCode(64 + newIndex);
    return title.replace(/APPENDIX\s+[A-Z]/i, `APPENDIX ${letter}`);
  } else {
    if (title.match(/^\d+\.0\b/)) {
      return title.replace(/^\d+\.0/, `${newIndex}.0`);
    } else if (title.match(/^\d+\./)) {
      return title.replace(/^\d+\./, `${newIndex}.`);
    }
    return title;
  }
}

function renumberText(text, oldSecIndex, newSecIndex) {
  if (typeof text !== "string") return text;
  const oldPrefix = oldSecIndex + ".";
  if (text.startsWith(oldPrefix)) {
    return newSecIndex + "." + text.slice(oldPrefix.length);
  }
  return text;
}

function getRenumberedSections() {
  if (!tpl) return [];
  const visible = tpl.sections.filter(sec => !(report.hiddenSections || []).includes(sec.id));
  
  let sectionCounter = 0;
  let appendixCounter = 0;

  return visible.map(sec => {
    const isApp = sec.id.startsWith("app");
    const oldIdx = getOriginalSectionIndex(sec);
    const newIdx = isApp ? ++appendixCounter : ++sectionCounter;

    const title = renumberTitle(sec.title, newIdx, isApp);
    const blocks = (sec.blocks || []).map(b => {
      const nb = { ...b };
      if (nb.type === "sub") {
        nb.text = renumberText(nb.text, oldIdx, newIdx);
      } else if (nb.type === "field") {
        nb.label = renumberText(nb.label, oldIdx, newIdx);
      } else if (nb.type === "fieldpair") {
        nb.labels = (nb.labels || []).map(l => renumberText(l, oldIdx, newIdx));
      } else if (nb.type === "table") {
        nb.title = renumberText(nb.title, oldIdx, newIdx);
      }
      return nb;
    });

    return {
      ...sec,
      title,
      blocks
    };
  });
}

function renderBlock(b) {
  if (b.type === "sub") {
    const h = document.createElement("div");
    h.className = "sub-title";
    h.textContent = b.text;
    return h;
  }
  if (b.type === "field") {
    const wrap = document.createElement("div");
    const lab = document.createElement("label");
    lab.className = "field-label";
    lab.textContent = b.label;
    wrap.appendChild(lab);
    wrap.appendChild(makeInput(b.key, b.fieldType || "text", b.options));
    return wrap;
  }
  if (b.type === "fieldpair") {
    const grid = document.createElement("div");
    grid.className = "field-grid";
    b.keys.forEach((k, i) => {
      const wrap = document.createElement("div");
      const lab = document.createElement("label");
      lab.className = "field-label";
      lab.textContent = b.labels[i];
      wrap.appendChild(lab);
      wrap.appendChild(makeInput(k, b.types[i]));
      grid.appendChild(wrap);
    });
    return grid;
  }
  if (b.type === "text" || b.type === "sigtext") {
    const ta = document.createElement("textarea");
    ta.rows = b.rows || 3;
    ta.spellcheck = true;
    ta.lang = "en";
    ta.value = report.fields[b.key] || "";
    ta.addEventListener("input", () => {
      let val = ta.value.replace(/(?<=\d|\b)m2\b/gi, (match) => match[0] === 'M' ? 'M²' : 'm²');
      if (val !== ta.value) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        ta.value = val;
        ta.setSelectionRange(start, end);
      }
      recordTyping();
      report.fields[b.key] = ta.value;
      autoGrow(ta);
      scheduleSave();
    });
    requestAnimationFrame(() => autoGrow(ta));

    const field = document.createElement("div");
    field.className = "ta-field";
    field.appendChild(makeTaHistoryBar());
    field.appendChild(ta);

    if (b.type === "text") return field;
    // sigtext: assessor text (with its own undo/redo bar) on the left, signature image on the right
    const row = document.createElement("div");
    row.className = "sig-edit-row";
    row.appendChild(field);
    const sig = document.createElement("img");
    sig.className = "sig-edit-img";
    sig.src = "signature.png";
    sig.alt = "Assessor signature";
    sig.title = "Signature (included automatically in the report)";
    row.appendChild(sig);
    return row;
  }
  if (b.type === "table") {
    const wrap = document.createElement("div");
    const h = document.createElement("div");
    h.className = "sub-title";
    h.textContent = b.title;
    wrap.appendChild(h);
    if (b.caption) {
      const cap = document.createElement("div");
      cap.className = "table-caption";
      cap.textContent = b.caption;
      wrap.appendChild(cap);
    }
    const tbl = document.createElement("table");
    tbl.className = "check-table";
    tbl.innerHTML = `<thead><tr><th>${esc(b.itemHeader || "Item")}</th><th>${esc(b.verHeader || "Verified")}</th><th>Comments</th></tr></thead>`;
    const tbody = document.createElement("tbody");
    b.items.forEach((item, i) => {
      const row = report.tables[b.key][i];
      const tr = document.createElement("tr");
      const tdItem = document.createElement("td");
      tdItem.className = "item-cell";
      tdItem.textContent = item;
      
      const tdVer = document.createElement("td");
      tdVer.dataset.col = b.verHeader || "Verified";
      tdVer.style.textAlign = "center";
      tdVer.style.verticalAlign = "middle";
      
      const box = document.createElement("div");
      box.className = "cycle-box";
      const updateBoxState = () => {
        box.className = "cycle-box";
        if (row.verified === "Yes" || row.verified === true) {
          box.classList.add("state-yes");
          box.textContent = "Yes";
        } else if (row.verified === "No" || row.verified === false) {
          box.classList.add("state-no");
          box.textContent = "No";
        } else if (row.verified === "N/A") {
          box.classList.add("state-na");
          box.textContent = "N/A";
        } else {
          box.classList.add("state-empty");
          box.textContent = "—";
        }
      };
      updateBoxState();
      box.addEventListener("click", () => {
        pushHistory();
        if (row.verified === "Yes" || row.verified === true) {
          row.verified = "No";
        } else if (row.verified === "No" || row.verified === false) {
          row.verified = "N/A";
        } else if (row.verified === "N/A") {
          row.verified = "";
        } else {
          row.verified = "Yes";
        }
        updateBoxState();
        scheduleSave();
      });
      tdVer.appendChild(box);
      
      const tdCom = document.createElement("td");
      tdCom.dataset.col = "Comments";
      const inp = document.createElement("input");
      inp.type = "text";
      inp.spellcheck = true;
      inp.lang = "en";
      inp.value = row.comments;
      inp.addEventListener("input", () => {
        let val = inp.value.replace(/(?<=\d|\b)m2\b/gi, (match) => match[0] === 'M' ? 'M²' : 'm²');
        if (val !== inp.value) {
          const start = inp.selectionStart;
          const end = inp.selectionEnd;
          inp.value = val;
          inp.setSelectionRange(start, end);
        }
        recordTyping();
        row.comments = inp.value;
        scheduleSave();
      });
      tdCom.appendChild(inp);
      tr.appendChild(tdItem); tr.appendChild(tdVer); tr.appendChild(tdCom);
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    wrap.appendChild(tbl);
    return wrap;
  }
  return document.createElement("div");
}

/* ================= Spelling & grammar check (LanguageTool) ================= */

function grammarTargets() {
  // every multi-line text editor in the report, plus photo comments
  const items = [];
  tpl.sections.forEach(sec => {
    let lastSub = "";
    (sec.blocks || []).forEach(b => {
      if (b.type === "sub") lastSub = b.text;
      if (b.type === "text" || b.type === "sigtext") {
        const text = report.fields[b.key] || "";
        if (text.trim()) items.push({
          kind: "field", key: b.key,
          label: lastSub ? `${sec.title} — ${lastSub}` : sec.title,
          text
        });
      }
    });
  });
  report.photos.forEach((p, i) => {
    if ((p.comment || "").trim()) items.push({ kind: "photo", idx: i, label: `Photo ${i + 1} comment`, text: p.comment });
  });
  return items;
}
function grammarGetText(item) {
  return item.kind === "photo" ? (report.photos[item.idx].comment || "") : (report.fields[item.key] || "");
}
function grammarSetText(item, text) {
  if (item.kind === "photo") report.photos[item.idx].comment = text;
  else report.fields[item.key] = text;
}

async function runGrammarCheck() {
  const overlay = document.getElementById("grammarOverlay");
  const status = document.getElementById("grammarStatus");
  const list = document.getElementById("grammarList");
  overlay.hidden = false;
  list.innerHTML = "";
  status.textContent = "Checking the whole report… this can take a few seconds.";

  const items = grammarTargets();
  if (items.length === 0) {
    status.textContent = "Nothing to check yet — the report has no text.";
    return;
  }
  const SEP = "\n\n";
  let joined = "";
  items.forEach(it => { it.start = joined.length; it.delta = 0; joined += it.text + SEP; });

  let data;
  try {
    const resp = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text: joined, language: "en-NZ" })
    });
    if (!resp.ok) throw new Error("service replied " + resp.status);
    data = await resp.json();
  } catch (e) {
    status.textContent = "Could not reach the grammar service (internet required). " + e.message;
    return;
  }

  const matches = (data.matches || []).filter(m => {
    // skip complaints about the template's placeholder text
    const snippet = joined.substr(m.offset, m.length);
    return !/^[Xx]+$/.test(snippet);
  });
  if (matches.length === 0) {
    status.textContent = "✅ No spelling or grammar issues found.";
    return;
  }
  status.textContent = `${matches.length} suggestion${matches.length > 1 ? "s" : ""} found — tap a replacement to apply it.`;

  matches.forEach(m => {
    const item = items.find(it => m.offset >= it.start && m.offset < it.start + it.text.length);
    if (!item) return;
    const row = document.createElement("div");
    row.className = "grammar-row";
    const ctx = m.context || {};
    const before = esc((ctx.text || "").slice(0, ctx.offset));
    const bad = esc((ctx.text || "").substr(ctx.offset, ctx.length));
    const after = esc((ctx.text || "").slice(ctx.offset + ctx.length));
    row.innerHTML = `<div class="g-where">${esc(item.label)}</div>
      <div class="g-msg">${esc(m.message)}</div>
      <div class="g-ctx">…${before}<mark>${bad}</mark>${after}…</div>`;
    const sugg = document.createElement("div");
    sugg.className = "g-sugg";
    (m.replacements || []).slice(0, 3).forEach(rep => {
      const b = document.createElement("button");
      b.className = "btn secondary g-fix";
      b.type = "button";
      b.textContent = rep.value === "" ? "(remove)" : rep.value;
      b.addEventListener("click", () => {
        const cur = grammarGetText(item);
        const pos = m.offset - item.start + item.delta;
        const expect = joined.substr(m.offset, m.length);
        if (cur.substr(pos, m.length) !== expect) {
          row.classList.add("g-stale");
          sugg.innerHTML = '<span class="hint">Text changed since the check — run the check again.</span>';
          return;
        }
        grammarSetText(item, cur.slice(0, pos) + rep.value + cur.slice(pos + m.length));
        item.delta += rep.value.length - m.length;
        scheduleSave();
        renderEdit();
        row.classList.add("g-done");
        sugg.innerHTML = '<span class="g-applied">✓ applied</span>';
      });
      sugg.appendChild(b);
    });
    if (!m.replacements || m.replacements.length === 0) {
      sugg.innerHTML = '<span class="hint">No automatic fix — edit manually.</span>';
    }
    row.appendChild(sugg);
    list.appendChild(row);
  });
}

document.getElementById("btnGrammarClose").addEventListener("click", () => {
  document.getElementById("grammarOverlay").hidden = true;
});
document.getElementById("grammarOverlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.hidden = true;
});

/* ================= Photos (Appendix A, B, C) ================= */

const photoInput = document.getElementById("photoInput");
let activePhotoSectionId = "appA";

function renderPhotoSection(secId) {
  const wrap = document.createElement("div");
  wrap.className = "photo-section-wrap";
  wrap.dataset.secId = secId;

  const actions = document.createElement("div");
  actions.className = "photo-actions";
  const addBtn = document.createElement("button");
  addBtn.className = "btn primary";
  addBtn.type = "button";
  addBtn.textContent = "📷 Add photos";
  addBtn.addEventListener("click", () => {
    activePhotoSectionId = secId;
    photoInput.click();
  });
  actions.appendChild(addBtn);
  wrap.appendChild(actions);

  const grid = document.createElement("div");
  grid.className = "photo-grid";
  grid.dataset.photoGrid = secId;
  wrap.appendChild(grid);

  drawPhotoGrid(grid, secId);
  return wrap;
}

function drawPhotoGrid(grid, secId) {
  if (!grid && !secId) {
    const grids = document.querySelectorAll("[data-photo-grid]");
    grids.forEach(g => {
      drawPhotoGrid(g, g.dataset.photoGrid);
    });
    return;
  }
  if (!grid) {
    grid = document.querySelector(`[data-photo-grid="${secId}"]`);
  }
  if (!grid) return;
  grid.innerHTML = "";
  
  const photos = report.photos[secId] || [];
  if (photos.length === 0) {
    const empty = document.createElement("div");
    empty.className = "photo-empty";
    empty.style.gridColumn = "1 / -1";
    empty.textContent = "No photos yet. Tap “Add photos” to take a picture or choose from your gallery. Each photo gets its own comment field.";
    grid.appendChild(empty);
    return;
  }
  photos.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "photo-card";
    const img = document.createElement("img");
    img.src = p.data;
    img.alt = "Photo " + (i + 1);
    img.loading = "lazy";
    const meta = document.createElement("div");
    meta.className = "photo-meta";
    const num = document.createElement("div");
    num.className = "photo-num";
    num.innerHTML = `<span>Photo ${i + 1}</span>`;
    const del = document.createElement("button");
    del.className = "del-photo";
    del.type = "button";
    del.textContent = "🗑 Remove";
    del.addEventListener("click", () => {
      if (!confirm(`Remove Photo ${i + 1}?`)) return;
      photos.splice(i, 1);
      drawPhotoGrid(grid, secId);
      scheduleSave();
    });
    num.appendChild(del);
    const comment = document.createElement("textarea");
    comment.rows = 2;
    comment.spellcheck = true;
    comment.lang = "en";
    comment.placeholder = "Comment for this photo…";
    comment.value = p.comment || "";
    comment.addEventListener("input", () => {
      p.comment = comment.value;
      autoGrow(comment);
      scheduleSave();
    });
    meta.appendChild(num);
    meta.appendChild(comment);
    card.appendChild(img);
    card.appendChild(meta);
    grid.appendChild(card);
  });
}

photoInput.addEventListener("change", async () => {
  const files = Array.from(photoInput.files || []);
  photoInput.value = "";
  const secId = activePhotoSectionId || "appA";
  if (!report.photos[secId]) {
    report.photos[secId] = [];
  }
  for (const file of files) {
    try {
      const data = await compressImage(file, 1400, 0.82);
      report.photos[secId].push({ data, comment: "" });
    } catch (e) {
      alert("Could not add photo " + file.name + ": " + e.message);
    }
  }
  drawPhotoGrid(null, secId);
  scheduleSave();
});

function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unsupported image")); };
    img.src = url;
  });
}

/* ================= Review view ================= */

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function orEmpty(v) { return v ? esc(v) : '<span class="r-empty">— not filled in —</span>'; }

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" });
}
function fieldDisplay(key) {
  const def = tpl.cover.fields.find(f => f.key === key);
  const v = report.fields[key] || "";
  return (def && def.type === "date") ? fmtDate(v) : v;
}

function pageHead(f) {
  return `<div class="page-head">
    <img src="logo.png" alt="AirSafe">
    <span class="head-report">Report: ${orEmpty(f.reportNo)}</span>
  </div>`;
}
function pageFoot(f, pageLabel) {
  return `<div class="page-foot">
    <span>${esc(pageLabel)}</span>
    <span>Date of Issue: ${orEmpty(fmtDate(f.dateOfIssue))}</span>
  </div>`;
}

/* Cover-page footer for all four templates: assessor name (left, white),
   live report number (centre) and date of issue (right). Both update as
   soon as the user edits those cover fields. */
function coverFoot(f) {
  return `<div class="cover-foot">
    <span class="cf-left">${orEmpty(f.assessor)}</span>
    <span class="cf-mid">${orEmpty(f.reportNo)}</span>
    <span class="cf-right">${orEmpty(fmtDate(f.dateOfIssue))}</span>
  </div>`;
}

function rf(label, value) {
  return `<div class="r-field"><b>${esc(label)}:</b> ${orEmpty(value)}</div>`;
}
function paras(text) {
  const t = String(text || "").trim();
  if (!t) return `<p>${orEmpty("")}</p>`;
  return t.split(/\n\s*\n/).map(chunk => `<p>${esc(chunk)}</p>`).join("");
}
function rTable(block) {
  let h = `<h3>${esc(block.title)}</h3>`;
  if (block.caption) h += `<p class="r-table-caption">${esc(block.caption)}</p>`;
  h += `<table><tr><th>${esc(block.itemHeader || "Item")}</th><th>${esc(block.verHeader || "Verified")}</th><th>Comments</th></tr>`;
  block.items.forEach((item, i) => {
    const row = (report.tables[block.key] || [])[i] || { verified: "", comments: "" };
    const val = getVerifiedText(row.verified);
    h += `<tr><td>${esc(item)}</td><td>${esc(val)}</td><td>${esc(row.comments)}</td></tr>`;
  });
  return h + `</table>`;
}

/* Generic report body driven entirely by the template definition. */
function buildReviewContent() {
  const f = report.fields;
  let html = "";
  const sections = getRenumberedSections();
  sections.forEach((sec, si) => {
    html += `<h2>${esc(sec.title)}</h2>`;
    if (si === 0 && tpl.cover.reportFields) {
      tpl.cover.reportFields.forEach(k => {
        const def = tpl.cover.fields.find(x => x.key === k);
        if (def) html += rf(def.label, fieldDisplay(k));
      });
    }
    (sec.blocks || []).forEach(b => {
      if (b.type === "sub") html += `<h3>${esc(b.text)}</h3>`;
      else if (b.type === "field") html += rf(b.label, f[b.key]);
      else if (b.type === "fieldpair") {
        const vals = b.keys.map((k, i) => {
          const v = f[k] || "";
          return b.types[i] === "date" ? fmtDate(v) : v;
        });
        html += rf(b.labels.join(" / "), vals.filter(Boolean).join(" · "));
      }
      else if (b.type === "text") html += `<div class="r-textblock">${paras(f[b.key])}</div>`;
      else if (b.type === "sigtext") {
        html += `<div class="r-sigrow"><div class="r-sigtext">${paras(f[b.key])}</div><img class="r-signature" src="signature.png" alt="Signature"></div>`;
      }
      else if (b.type === "table") html += rTable(b);
    });
    if (sec.photos) {
      const photos = report.photos[sec.id] || [];
      if (photos.length === 0) {
        html += `<p class="r-empty">No photographs added.</p>`;
      } else {
        photos.forEach((p, i) => {
          html += `
            <div class="r-photo-entry">
              <div class="r-photo-img-wrap">
                <img src="${p.data}" alt="Photo ${i + 1}">
              </div>
              <div class="r-photo-comment">
                <b>Photo ${i + 1}:</b> ${esc(p.comment || "")}
              </div>
            </div>
          `;
        });
      }
    }
  });
  return html;
}

function newBodyPage(wrap, f) {
  const page = document.createElement("div");
  page.className = "a4 body-page";
  page.innerHTML = pageHead(f) + `<div class="body-content"></div>` + pageFoot(f, "");
  wrap.appendChild(page);
  return { page, content: page.querySelector(".body-content"), foot: page.querySelector(".page-foot span") };
}

/* Class A gets a photo-banner cover page (with the site address filled in live);
   every other report keeps the plain logo + meta-list cover. */
function coverPageHtml(f) {
  if (tpl.id === "classA") {
    return `<div class="a4 cover-page cover-photo">
      <div class="cover-photo-img" style="background-image:url('cover-classA.jpg')"></div>
      <div class="cover-photo-banner">
        <div class="cover-photo-text">
          <h1>${esc(tpl.docTitle)}</h1>
          <div class="cover-photo-address">${f.siteAddress ? esc(f.siteAddress) : "Insert Address"}</div>
        </div>
        ${coverFoot(f)}
      </div>
    </div>`;
  }
  return `<div class="a4 cover-page">
    ${pageHead(f)}
    <div class="cover-center">
      <img src="logo.png" alt="AirSafe" class="cover-logo">
      <h1>${esc(tpl.docTitle)}</h1>
      <div class="cover-meta">
        <div><b>Date of Issue:</b> ${orEmpty(fmtDate(f.dateOfIssue))}</div>
        <div><b>Report Number:</b> ${orEmpty(f.reportNo)}</div>
        <div><b>Site Address:</b> ${orEmpty(f.siteAddress)}</div>
      </div>
    </div>
    ${coverFoot(f)}
  </div>`;
}

function renderReview() {
  const doc = document.getElementById("reviewDoc");
  const f = report.fields;

  doc.style.setProperty("--accent", tpl.accent);
  doc.innerHTML = `<div id="pagesWrap">${coverPageHtml(f)}</div>`;

  const wrap = doc.querySelector("#pagesWrap");
  const temp = document.createElement("div");
  temp.innerHTML = buildReviewContent();
  const queue = Array.from(temp.children);

  const pages = [];
  let cur = newBodyPage(wrap, f);
  pages.push(cur);

  let photosOnPage = 0;

  while (queue.length) {
    const block = queue.shift();
    const isPhoto = block.classList.contains("r-photo-entry");
    const isAppendixH2 = block.tagName === "H2" && block.textContent.startsWith("APPENDIX");

    let forceNewPage = false;
    if (isPhoto && photosOnPage >= 3) {
      forceNewPage = true;
    }
    if (isAppendixH2 && cur.content.children.length > 0) {
      forceNewPage = true;
    }

    if (forceNewPage) {
      cur = newBodyPage(wrap, f);
      pages.push(cur);
      photosOnPage = 0;
    }

    cur.content.appendChild(block);
    if (isPhoto) {
      photosOnPage++;
      cur.content.classList.add("justified-photos");
    }

    if (cur.content.scrollHeight <= cur.content.clientHeight) continue;

    // The block just added doesn't fit. If other content already sits above it on
    // this page, move the whole block (plus any heading directly introducing it) to
    // a fresh page rather than letting it spill past the page boundary.
    if (cur.content.children.length > 1) {
      const carry = [block];
      let prev = block.previousElementSibling;
      while (prev && /^H[23]$/.test(prev.tagName) && cur.content.children.length > carry.length) {
        carry.unshift(prev);
        prev = prev.previousElementSibling;
      }
      cur = newBodyPage(wrap, f);
      pages.push(cur);
      photosOnPage = 0;
      carry.forEach(el => {
        cur.content.appendChild(el);
        if (el.classList.contains("r-photo-entry")) {
          photosOnPage++;
          cur.content.classList.add("justified-photos");
        }
      });
    }

    // A multi-paragraph text block can still be taller than one whole page even by
    // itself. Rather than cut a paragraph in half, split the block between whole
    // paragraphs only — as many as fit stay here, the rest continue on the next page.
    if (block.classList.contains("r-textblock") && cur.content.scrollHeight > cur.content.clientHeight) {
      const paraEls = Array.from(block.children);
      if (paraEls.length > 1) {
        let lo = 1, hi = paraEls.length, best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          paraEls.forEach((p, i) => { p.style.display = i < mid ? "" : "none"; });
          if (cur.content.scrollHeight <= cur.content.clientHeight) { best = mid; lo = mid + 1; }
          else hi = mid - 1;
        }
        paraEls.forEach(p => { p.style.display = ""; });
        if (best > 0 && best < paraEls.length) {
          const rest = paraEls.slice(best);
          rest.forEach(p => block.removeChild(p));
          const cont = document.createElement("div");
          cont.className = "r-textblock";
          rest.forEach(p => cont.appendChild(p));
          queue.unshift(cont);
        }
      }
    }
  }

  const total = pages.length + 1;
  const coverFootEl = doc.querySelector(".cover-page .page-foot span");
  if (coverFootEl) coverFootEl.textContent = `Page 1 of ${total}`;
  pages.forEach((p, i) => { p.foot.textContent = `Page ${i + 2} of ${total}`; });

  fitReviewScale();
}

function fitReviewScale() {
  const doc = document.getElementById("reviewDoc");
  const wrap = document.getElementById("pagesWrap");
  if (!wrap) return;
  wrap.style.transform = "";
  doc.style.height = "";
  const pageW = wrap.querySelector(".a4").offsetWidth;
  const avail = doc.clientWidth;
  if (avail < pageW - 1) {
    const s = avail / pageW;
    wrap.style.transformOrigin = "top left";
    wrap.style.transform = `scale(${s})`;
    doc.style.height = wrap.getBoundingClientRect().height + "px";
  }
}
window.addEventListener("resize", () => {
  if (document.getElementById("reviewView").classList.contains("active") && report) fitReviewScale();
});

/* ================= DOCX export ================= */

async function buildDocx() {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
          ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
          Header, Footer, PageNumber, PageBreak, TabStopType } = docx;

  const f = report.fields;
  const NAVY = "1B1B6F";
  const BODY = 18; // 9pt (half-points)
  const children = [];

  const P = (text, opts = {}) => new Paragraph({
    spacing: { after: 300 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({ text, bold: !!opts.bold, size: opts.size || BODY, color: opts.color, font: "Arial" })]
  });
  const multi = (text) => String(text || "").split(/\r?\n/).map(line =>
    new Paragraph({
      spacing: { after: line.trim() === "" ? 150 : 250 },
      children: [new TextRun({ text: line, size: BODY, font: "Arial" })]
    })
  );
  const H1 = (text) => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 460, after: 300 },
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY, font: "Arial" })]
  });
  const H2 = (text) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 380, after: 240 },
    children: [new TextRun({ text, bold: true, size: 23, color: NAVY, font: "Arial" })]
  });
  const FIELD = (label, value) => new Paragraph({
    spacing: { after: 240 },
    children: [
      new TextRun({ text: label + ":  ", bold: true, size: BODY, color: NAVY, font: "Arial" }),
      new TextRun({ text: value || "", size: BODY, font: "Arial" })
    ]
  });

  let logoBuf = null;
  try { logoBuf = await fetch("logo.png").then(r => r.arrayBuffer()); } catch (e) { /* logo optional */ }
  let sigBuf = null;
  try { sigBuf = await fetch("signature.png").then(r => r.arrayBuffer()); } catch (e) { /* signature optional */ }

  // Assessor text left, signature right (borderless layout table)
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const sigRow = (text) => new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [6160, 3200],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: noBorders, width: { size: 6160, type: WidthType.DXA },
        children: String(text || "").split(/\r?\n/).map(line => new Paragraph({
          spacing: { after: 150 },
          children: [new TextRun({ text: line, size: BODY, font: "Arial" })]
        }))
      }),
      new TableCell({
        borders: noBorders, width: { size: 3200, type: WidthType.DXA },
        verticalAlign: docx.VerticalAlign ? docx.VerticalAlign.CENTER : undefined,
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: sigBuf ? [new ImageRun({ type: "png", data: sigBuf,
            transformation: { width: 170, height: 38 },
            altText: { title: "Signature", description: "Assessor signature", name: "sig" } })] : []
        })]
      })
    ] })]
  });

  // ---- Cover page ----
  if (logoBuf) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2800, after: 300 },
      children: [new ImageRun({ type: "png", data: logoBuf, transformation: { width: 260, height: 144 },
        altText: { title: "AirSafe", description: "AirSafe logo", name: "coverlogo" } })]
    }));
  }
  children.push(P(tpl.docTitle, { center: true, bold: true, size: 34, color: NAVY }));
  const coverLine = (label, value) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 140 },
    children: [
      new TextRun({ text: label + ": ", bold: true, size: 22, color: NAVY, font: "Arial" }),
      new TextRun({ text: value || "", size: 22, font: "Arial" })
    ]
  });
  children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));
  children.push(coverLine("Date of Issue", fmtDate(f.dateOfIssue)));
  children.push(coverLine("Report Number", f.reportNo));
  children.push(coverLine("Site Address", f.siteAddress));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ---- Generic body from template ----
  const border = { style: BorderStyle.SINGLE, size: 1, color: "9AA7B5" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };
  const mkCell = (text, width, opts = {}) => new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    shading: opts.head ? { fill: "EEF2FB", type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.head, size: BODY, color: opts.head ? NAVY : undefined, font: "Arial" })] })]
  });
  const checkTable = (block) => {
    const rows = [new TableRow({ children: [
      mkCell(block.itemHeader || "Item", 4200, { head: true }),
      mkCell(block.verHeader || "Verified", 1400, { head: true }),
      mkCell("Comments", 3760, { head: true })
    ] })];
    block.items.forEach((item, i) => {
      const r = (report.tables[block.key] || [])[i] || { verified: "", comments: "" };
      const val = getVerifiedText(r.verified);
      rows.push(new TableRow({ children: [mkCell(item, 4200), mkCell(val, 1400), mkCell(r.comments, 3760)] }));
    });
    const parts = [H2(block.title)];
    if (block.caption) parts.push(P(block.caption));
    parts.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [4200, 1400, 3760], rows }));
    return parts;
  };

  const sections = getRenumberedSections();
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    children.push(H1(sec.title));
    if (si === 0 && tpl.cover.reportFields) {
      tpl.cover.reportFields.forEach(k => {
        const def = tpl.cover.fields.find(x => x.key === k);
        if (def) children.push(FIELD(def.label, fieldDisplay(k)));
      });
    }
    for (const b of (sec.blocks || [])) {
      if (b.type === "sub") children.push(H2(b.text));
      else if (b.type === "field") children.push(FIELD(b.label, f[b.key]));
      else if (b.type === "fieldpair") {
        const vals = b.keys.map((k, i) => {
          const v = f[k] || "";
          return b.types[i] === "date" ? fmtDate(v) : v;
        });
        children.push(FIELD(b.labels.join(" / "), vals.filter(Boolean).join("  ·  ")));
      }
      else if (b.type === "text") children.push(...multi(f[b.key]));
      else if (b.type === "sigtext") children.push(sigRow(f[b.key]), new Paragraph({ spacing: { after: 180 }, children: [] }));
      else if (b.type === "table") {
        children.push(...checkTable(b));
        children.push(new Paragraph({ spacing: { after: 240 }, children: [] }));
      }
    }
    if (sec.photos) {
      const photos = report.photos[sec.id] || [];
      if (photos.length === 0) {
        children.push(P("No photographs included."));
      } else {
        for (let i = 0; i < photos.length; i++) {
          const p = photos[i];
          const bytes = dataUrlToBytes(p.data);
          const dims = await imageDims(p.data);
          const maxW = 430;
          const scale = Math.min(1, maxW / dims.w);
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 320, after: 180 },
            children: [new ImageRun({ type: "jpg", data: bytes,
              transformation: { width: Math.round(dims.w * scale), height: Math.round(dims.h * scale) },
              altText: { title: "Photo " + (i + 1), description: p.comment || "", name: "photo" + (i + 1) } })]
          }));
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [
              new TextRun({ text: `Photo ${i + 1}: `, bold: true, size: BODY, color: NAVY, font: "Arial" }),
              new TextRun({ text: p.comment || "", size: BODY, font: "Arial" })
            ]
          }));
        }
      }
    }
  }

  // ---- Running header/footer ----
  const CONTENT_W = 11906 - 1300 - 1300;
  const headerChildren = [
    ...(logoBuf ? [new ImageRun({ type: "png", data: logoBuf, transformation: { width: 96, height: 53 },
      altText: { title: "AirSafe", description: "AirSafe logo", name: "headlogo" } })] : []),
    new TextRun({ text: "\tReport: " + (f.reportNo || ""), size: 16, color: NAVY, font: "Arial" })
  ];
  const pageHeader = new Header({
    children: [new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "5FD7B5", space: 4 } },
      spacing: { after: 200 },
      children: headerChildren
    })]
  });
  const pageFooter = new Footer({
    children: [new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "DDE3EA", space: 4 } },
      children: [
        new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, font: "Arial", color: "6B7280" }),
        new TextRun({ text: "\tDate of Issue: " + (fmtDate(f.dateOfIssue) || ""), size: 16, font: "Arial", color: "6B7280" })
      ]
    })]
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: BODY } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1500, right: 1300, bottom: 1400, left: 1300 } } },
      headers: { default: pageHeader },
      footers: { default: pageFooter },
      children
    }]
  });
  return Packer.toBlob(doc);
}

function dataUrlToBytes(dataUrl) {
  const b64 = dataUrl.split(",")[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function imageDims(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 800, h: 600 });
    img.src = dataUrl;
  });
}

function docxFileName() {
  const addr = (report.fields.siteAddress || "Site").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_").slice(0, 40);
  return `${tpl.fileLabel}_${addr || "Site"}.docx`;
}

/* ================= Send ================= */

function defaultEmailFields() {
  const addr = report.fields.siteAddress || "[site address]";
  const subjEl = document.getElementById("emailSubject");
  const bodyEl = document.getElementById("emailBody");
  if (!subjEl.value) subjEl.value = `${tpl.shortName} — ${addr}`;
  if (!bodyEl.value) bodyEl.value =
`Hi,

Please find attached the ${tpl.shortName} for ${addr}.

If you have any questions, feel free to get in touch.

Kind regards,
${report.fields.assessor || "AirSafe"}
AirSafe Environmental Solutions Limited
info@airsafe.net.nz · 021-292-9688`;
}

function sendStatus(msg, isError) {
  const el = document.getElementById("sendStatus");
  el.hidden = false;
  el.textContent = msg;
  el.classList.toggle("error", !!isError);
}

async function withBusy(btn, fn) {
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Preparing document…";
  try { await fn(); }
  catch (e) {
    console.error(e);
    sendStatus("Something went wrong: " + e.message, true);
  }
  finally { btn.disabled = false; btn.textContent = old; }
}

document.getElementById("btnDownload").addEventListener("click", function () {
  withBusy(this, async () => {
    const blob = await buildDocx();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = docxFileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    sendStatus("Word file downloaded: " + docxFileName());
  });
});

document.getElementById("btnShare").addEventListener("click", function () {
  withBusy(this, async () => {
    const blob = await buildDocx();
    const file = new File([blob], docxFileName(), {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: document.getElementById("emailSubject").value,
        text: document.getElementById("emailBody").value
      }).catch(err => { if (err.name !== "AbortError") throw err; });
      sendStatus("Share sheet opened — choose your email app to send with the attachment.");
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = docxFileName();
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      openMailto();
      sendStatus("Sharing with attachments isn’t supported in this browser, so the Word file was downloaded and your email app was opened — just attach the downloaded file.");
    }
  });
});

document.getElementById("btnMailto").addEventListener("click", () => {
  openMailto();
  sendStatus("Email app opened. Remember to attach the downloaded Word file.");
});

function openMailto() {
  const to = document.getElementById("emailTo").value.trim();
  const subject = encodeURIComponent(document.getElementById("emailSubject").value);
  const body = encodeURIComponent(document.getElementById("emailBody").value);
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
}

/* ================= Tabs & misc ================= */

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (!report) return;
    const which = tab.dataset.tab;
    showView(which);
    if (which === "review") renderReview();
    if (which === "send") defaultEmailFields();
  });
});

document.getElementById("btnBack").addEventListener("click", goHome);

/* ---- Full screen toggle (PC, Android; hidden on iOS Safari which lacks the API) ---- */
const fsBtn = document.getElementById("btnFullscreen");
if (!document.documentElement.requestFullscreen) {
  fsBtn.hidden = true;
} else {
  fsBtn.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", () => {
    fsBtn.textContent = document.fullscreenElement ? "🗗" : "⛶";
    fsBtn.title = document.fullscreenElement ? "Exit full screen" : "Toggle full screen";
  });
}
document.getElementById("btnNewReport").addEventListener("click", openPicker);
document.getElementById("btnPickerCancel").addEventListener("click", closePicker);
document.getElementById("pickerOverlay").addEventListener("click", (e) => {
  // ignore the tail end of the tap that opened the picker (backdrop covers the button)
  if (e.target === e.currentTarget && Date.now() - pickerOpenedAt > 350) closePicker();
});

/* ---- Save as PDF: renders each A4 page to an image and downloads a real .pdf ---- */
document.getElementById("btnPrint").addEventListener("click", async function () {
  const btn = this;
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Creating PDF…";
  const wrap = document.getElementById("pagesWrap");
  const doc = document.getElementById("reviewDoc");
  const prevT = wrap.style.transform, prevH = doc.style.height;
  try {
    // capture at natural A4 size, without screen chrome (borders/shadows/scaling)
    wrap.style.transform = "";
    doc.style.height = "";
    wrap.classList.add("pdf-capture");
    const pages = [...wrap.querySelectorAll(".a4")];
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    for (let i = 0; i < pages.length; i++) {
      btn.textContent = `⏳ Creating PDF… page ${i + 1} of ${pages.length}`;
      const canvas = await html2canvas(pages[i], { scale: 2, backgroundColor: "#ffffff", logging: false });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage();
      const h = Math.min(297, canvas.height * 210 / canvas.width);
      pdf.addImage(img, "JPEG", 0, 0, 210, h);
    }
    pdf.save(docxFileName().replace(/\.docx$/, ".pdf"));
  } catch (e) {
    console.error(e);
    alert("Could not create the PDF: " + e.message);
  } finally {
    wrap.classList.remove("pdf-capture");
    wrap.style.transform = prevT;
    doc.style.height = prevH;
    btn.disabled = false;
    btn.textContent = old;
    fitReviewScale();
  }
});
document.getElementById("btnBackToEdit").addEventListener("click", () => { showView("edit"); });

document.getElementById("btnReset").addEventListener("click", () => {
  if (!report) return;
  if (!confirm("Reset this report back to the blank template? All its edits and photos will be lost.")) return;
  const fresh = blankReport(report.templateId);
  fresh.id = report.id;
  fresh.createdAt = report.createdAt;
  report = fresh;
  dbPut(report);
  renderEdit();
  setStatus("Saved", false);
  window.scrollTo({ top: 0 });
});

/* ================= Boot ================= */

(async function init() {
  await migrateLegacyDraft();
  await renderHome();
  showView("home");
})();
