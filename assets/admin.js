/* =====================================================================
   BrightHarvest — Admin panel
   ---------------------------------------------------------------------
   A no-code editor for the whole site. Everything you change is saved
   in this browser instantly (so you can preview it). When you're happy,
   click "Export site content" to download a new seed-data.js and replace
   the old one to publish for everyone.
   ===================================================================== */

(function () {
  const esc = BH.esc;

  /* ----- field schemas describing every editable thing ----- */
  // type: text | textarea | date | time | number | image | url
  const SINGLE_SCHEMAS = {
    org: {
      title: "Organisation basics",
      fields: [
        { key: "name",        label: "Organisation name",   type: "text" },
        { key: "tagline",     label: "Tagline / slogan",    type: "text" },
        { key: "mission",     label: "Mission statement",   type: "textarea" },
        { key: "foundedYear", label: "Founded year",        type: "number" },
        { key: "location",    label: "Location",            type: "text" }
      ]
    },
    home: {
      title: "Home page",
      fields: [
        { key: "heroTitle",    label: "Big headline",        type: "text" },
        { key: "heroSubtitle", label: "Sub-heading",         type: "textarea" },
        { key: "heroImage",    label: "Hero image (optional)", type: "image" }
      ]
    },
    aboutStory: {
      title: "About — our story",
      target: "about",
      fields: [
        { key: "story", label: "Story text (leave a blank line between paragraphs)", type: "textarea" }
      ]
    },
    contact: {
      title: "Contact details",
      fields: [
        { key: "intro",        label: "Intro line",     type: "textarea" },
        { key: "email",        label: "Email",          type: "text" },
        { key: "phone",        label: "Phone",          type: "text" },
        { key: "address",      label: "Address",        type: "text" },
        { key: "instagram",    label: "Instagram handle", type: "text" },
        { key: "instagramUrl", label: "Instagram link", type: "url" }
      ]
    }
  };

  const LIST_SCHEMAS = {
    homeStats: {
      title: "Impact numbers (home page)",
      path: ["home", "stats"],
      labelField: "label",
      sublabel: (it) => it.value,
      fields: [
        { key: "value", label: "Number (e.g. 1,200+)", type: "text" },
        { key: "label", label: "What it counts (e.g. Meals served)", type: "text" }
      ]
    },
    values: {
      title: "Our values (About page)",
      path: ["about", "values"],
      labelField: "title",
      sublabel: (it) => it.text,
      fields: [
        { key: "title", label: "Value title", type: "text" },
        { key: "text",  label: "Description", type: "textarea" }
      ]
    },
    team: {
      title: "Team members (About page)",
      path: ["about", "team"],
      labelField: "name",
      sublabel: (it) => it.role,
      fields: [
        { key: "name",  label: "Name",       type: "text" },
        { key: "role",  label: "Role",       type: "text" },
        { key: "photo", label: "Photo",      type: "image" }
      ]
    },
    blogs: {
      title: "Blog posts",
      path: ["blogs"],
      labelField: "title",
      sublabel: (it) => it.date,
      prepend: true,
      fields: [
        { key: "title",  label: "Title",  type: "text" },
        { key: "date",   label: "Date",   type: "date" },
        { key: "author", label: "Author", type: "text" },
        { key: "image",  label: "Photo",  type: "image" },
        { key: "body",   label: "Post text", type: "textarea" }
      ]
    },
    events: {
      title: "Events",
      path: ["events"],
      labelField: "title",
      sublabel: (it) => it.date,
      fields: [
        { key: "title",       label: "Event name",  type: "text" },
        { key: "date",        label: "Date",        type: "date" },
        { key: "time",        label: "Time",        type: "text" },
        { key: "location",    label: "Location",    type: "text" },
        { key: "image",       label: "Photo",       type: "image" },
        { key: "description", label: "Description", type: "textarea" }
      ]
    },
    fundraisers: {
      title: "Fundraisers",
      path: ["fundraisers"],
      labelField: "title",
      sublabel: (it) => `${it.currency || "₹"}${it.raised || 0} of ${it.currency || "₹"}${it.goal || 0}`,
      fields: [
        { key: "title",       label: "Campaign title",       type: "text" },
        { key: "goal",        label: "Goal amount",          type: "number" },
        { key: "raised",      label: "Raised so far",        type: "number" },
        { key: "currency",    label: "Currency symbol",      type: "text" },
        { key: "image",       label: "Photo",                type: "image" },
        { key: "description", label: "Description",          type: "textarea" },
        { key: "link",        label: "Donation link (optional)", type: "url" }
      ]
    }
  };

  /* tab definition: which schemas show on each tab */
  const TABS = [
    { id: "site",        label: "🏠 Site & Home", singles: ["org", "home"], lists: ["homeStats"] },
    { id: "about",       label: "🌱 About Us",    singles: ["aboutStory"],  lists: ["values", "team"] },
    { id: "blogs",       label: "📝 Blogs",       singles: [],              lists: ["blogs"] },
    { id: "events",      label: "📅 Events",      singles: [],              lists: ["events"] },
    { id: "fundraisers", label: "💛 Fundraisers", singles: [],              lists: ["fundraisers"] },
    { id: "contact",     label: "✉️ Contact",     singles: ["contact"],     lists: [] }
  ];

  let content = BH.getContent();
  let activeTab = "site";

  /* ---------- passcode lock (soft deterrent, not real security) ---------- */
  const PASS_KEY = "bh_admin_pass";
  const UNLOCK_FLAG = "bh_admin_unlocked";
  const DEFAULT_PASS = "***";          // change this on first login!
  const getPass = () => localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
  const setPass = (p) => localStorage.setItem(PASS_KEY, p);
  const isUnlocked = () => { try { return sessionStorage.getItem(UNLOCK_FLAG) === "1"; } catch (e) { return false; } };
  const unlock = () => { try { sessionStorage.setItem(UNLOCK_FLAG, "1"); } catch (e) {} };
  const lock = () => { try { sessionStorage.removeItem(UNLOCK_FLAG); } catch (e) {} };

  function renderLock() {
    document.getElementById("adminNav").innerHTML = "";
    const usingDefault = !localStorage.getItem(PASS_KEY);
    const body = document.getElementById("adminBody");
    body.innerHTML = `
      <div class="admin-card lock-card">
        <div style="font-size:2.6rem">🔒</div>
        <h3 style="margin:.3rem 0 0">Admin login</h3>
        <p class="hint" style="margin:.2rem 0 18px">Enter the passcode to manage the site.</p>
        <form class="bh-form" id="lockForm" style="text-align:left">
          <div class="field">
            <label>Passcode</label>
            <input type="password" id="lockInput" autocomplete="current-password" autofocus>
            <div class="hint" id="lockErr" style="color:#c62828;display:none">Wrong passcode — try again.</div>
          </div>
          <button class="btn" type="submit">Unlock</button>
        </form>
        ${usingDefault ? `<p class="hint" style="margin-top:16px">Tip: the starting passcode is <b>${esc(DEFAULT_PASS)}</b>. Change it after you log in (Site & Home tab).</p>` : ""}
      </div>`;
    const form = document.getElementById("lockForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = document.getElementById("lockInput").value;
      if (val === getPass()) {
        unlock();
        renderNav();
        renderBody();
        toast("Welcome back 👋");
      } else {
        document.getElementById("lockErr").style.display = "block";
        document.getElementById("lockInput").value = "";
      }
    });
  }

  /* the "change passcode" card, shown on the Site & Home tab */
  function renderSecurity() {
    const card = document.createElement("div");
    card.className = "admin-card";
    card.innerHTML = `
      <h3>🔒 Admin passcode</h3>
      <p class="hint">Changes the passcode needed to open this admin panel in this browser.</p>
      <form class="bh-form" data-form>
        <div class="row-2">
          <div class="field"><label>New passcode</label><input type="password" name="p1" autocomplete="new-password"></div>
          <div class="field"><label>Repeat new passcode</label><input type="password" name="p2" autocomplete="new-password"></div>
        </div>
        <button class="btn" type="submit">Update passcode</button>
      </form>`;
    const form = card.querySelector("[data-form]");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const p1 = form.querySelector('[name="p1"]').value.trim();
      const p2 = form.querySelector('[name="p2"]').value.trim();
      if (p1.length < 4) { toast("Use at least 4 characters"); return; }
      if (p1 !== p2) { toast("The two passcodes don't match"); return; }
      setPass(p1);
      form.reset();
      toast("Passcode updated ✓");
    });
    return card;
  }

  /* ---------- helpers ---------- */
  function getPath(obj, path) {
    return path.reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
  }
  function ensureArray(path) {
    let o = content;
    for (let i = 0; i < path.length - 1; i++) {
      if (!o[path[i]]) o[path[i]] = {};
      o = o[path[i]];
    }
    const last = path[path.length - 1];
    if (!Array.isArray(o[last])) o[last] = [];
    return o[last];
  }
  function newId(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 8);
  }
  function persist() {
    BH.saveContent(content);
    renderActions();
  }
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- field rendering ---------- */
  function fieldHTML(f, value) {
    const v = value == null ? "" : value;
    if (f.type === "textarea") {
      return `<textarea name="${f.key}">${esc(v)}</textarea>`;
    }
    if (f.type === "image") {
      return `
        <div style="display:flex;gap:12px;align-items:center">
          ${v ? `<img class="img-preview" src="${esc(v)}" alt="">` : `<div class="img-preview" style="display:grid;place-items:center">🖼️</div>`}
          <div>
            <input type="file" accept="image/*" data-imgfor="${f.key}">
            <input type="hidden" name="${f.key}" value="${esc(v)}">
            ${v ? `<button type="button" class="btn small ghost" data-imgclear="${f.key}">Remove</button>` : ""}
          </div>
        </div>`;
    }
    const inputType = f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text";
    return `<input type="${inputType}" name="${f.key}" value="${esc(v)}">`;
  }

  function formHTML(fields, data, submitLabel, extra) {
    const body = fields.map((f) => `
      <div class="field">
        <label>${esc(f.label)}</label>
        ${fieldHTML(f, data ? data[f.key] : "")}
      </div>`).join("");
    return `<form class="bh-form" data-form>
      ${body}
      <div style="display:flex;gap:10px">
        <button class="btn" type="submit">${esc(submitLabel)}</button>
        ${extra || ""}
      </div>
    </form>`;
  }

  /* attach image-upload handlers inside a form element */
  function wireImages(formEl) {
    formEl.querySelectorAll("input[type=file][data-imgfor]").forEach((inp) => {
      inp.addEventListener("change", () => {
        const file = inp.files[0];
        if (!file) return;
        if (file.size > 1.5 * 1024 * 1024) {
          toast("Please pick an image under 1.5 MB");
          inp.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const key = inp.getAttribute("data-imgfor");
          const hidden = formEl.querySelector(`input[type=hidden][name="${key}"]`);
          if (hidden) hidden.value = reader.result;
          const prev = inp.closest(".field").querySelector(".img-preview");
          if (prev && prev.tagName === "IMG") prev.src = reader.result;
          else if (prev) prev.outerHTML = `<img class="img-preview" src="${reader.result}" alt="">`;
        };
        reader.readAsDataURL(file);
      });
    });
    formEl.querySelectorAll("[data-imgclear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-imgclear");
        const hidden = formEl.querySelector(`input[type=hidden][name="${key}"]`);
        if (hidden) hidden.value = "";
        const prev = btn.closest(".field").querySelector(".img-preview");
        if (prev) prev.outerHTML = `<div class="img-preview" style="display:grid;place-items:center">🖼️</div>`;
        btn.remove();
      });
    });
  }

  function readForm(formEl, fields) {
    const out = {};
    fields.forEach((f) => {
      const el = formEl.querySelector(`[name="${f.key}"]`);
      let val = el ? el.value : "";
      if (f.type === "number") val = val === "" ? 0 : Number(val);
      out[f.key] = val;
    });
    return out;
  }

  /* ---------- render a SINGLE-object editor ---------- */
  function renderSingle(schemaKey) {
    const schema = SINGLE_SCHEMAS[schemaKey];
    const targetKey = schema.target || schemaKey;
    if (!content[targetKey]) content[targetKey] = {};
    const data = content[targetKey];

    const card = document.createElement("div");
    card.className = "admin-card";
    card.innerHTML = `<h3>${esc(schema.title)}</h3>` + formHTML(schema.fields, data, "Save changes");
    const form = card.querySelector("[data-form]");
    wireImages(form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      Object.assign(content[targetKey], readForm(form, schema.fields));
      persist();
      toast("Saved ✓");
    });
    return card;
  }

  /* ---------- render a LIST editor ---------- */
  function renderList(schemaKey) {
    const schema = LIST_SCHEMAS[schemaKey];
    const arr = ensureArray(schema.path);

    const card = document.createElement("div");
    card.className = "admin-card";

    const list = arr.map((it, i) => `
      <div class="entry-row">
        <div class="info">
          <b>${esc(it[schema.labelField] || "(untitled)")}</b>
          <small>${esc(schema.sublabel ? schema.sublabel(it) : "")}</small>
        </div>
        <div class="actions">
          <button class="btn small ghost" data-edit="${i}">Edit</button>
          <button class="btn small danger" data-del="${i}">Delete</button>
        </div>
      </div>`).join("");

    card.innerHTML = `
      <h3>${esc(schema.title)}</h3>
      <div data-list>${arr.length ? list : `<p class="hint">Nothing here yet — add your first one below.</p>`}</div>
      <hr style="border:none;border-top:1px solid #eee;margin:18px 0">
      <h4 style="margin:0 0 12px">➕ Add new</h4>
      <div data-addform></div>`;

    // add form
    const addWrap = card.querySelector("[data-addform]");
    addWrap.innerHTML = formHTML(schema.fields, null, "Add");
    const addForm = addWrap.querySelector("[data-form]");
    wireImages(addForm);
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const obj = readForm(addForm, schema.fields);
      obj.id = newId(schemaKey);
      const target = ensureArray(schema.path);
      if (schema.prepend) target.unshift(obj); else target.push(obj);
      persist();
      toast("Added ✓");
      renderBody();
    });

    // edit / delete
    card.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.getAttribute("data-del"));
      if (confirm("Delete this entry? This cannot be undone.")) {
        ensureArray(schema.path).splice(i, 1);
        persist();
        toast("Deleted");
        renderBody();
      }
    }));
    card.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.getAttribute("data-edit"));
      openEdit(schema, i);
    }));

    return card;
  }

  /* inline edit form (replaces the row) */
  function openEdit(schema, index) {
    const arr = ensureArray(schema.path);
    const data = arr[index];
    const overlay = document.createElement("div");
    overlay.className = "admin-card";
    overlay.style.border = "2px solid var(--green-light)";
    overlay.innerHTML = `<h3>✏️ Editing: ${esc(data[schema.labelField] || "")}</h3>` +
      formHTML(schema.fields, data, "Save changes",
        `<button type="button" class="btn ghost" data-cancel>Cancel</button>`);
    const form = overlay.querySelector("[data-form]");
    wireImages(form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      Object.assign(arr[index], readForm(form, schema.fields));
      persist();
      toast("Saved ✓");
      renderBody();
    });
    overlay.querySelector("[data-cancel]").addEventListener("click", renderBody);

    const body = document.getElementById("adminBody");
    body.innerHTML = "";
    body.appendChild(overlay);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- top action bar (export / discard) ---------- */
  function renderActions() {
    let bar = document.getElementById("actionBar");
    const edited = BH.hasLocalEdits();
    const html = `
      <div class="banner" id="actionBar">
        ${edited
          ? `<b>You have unpublished changes</b> saved in this browser. They show up when you preview the site here, but visitors won't see them until you publish.`
          : `Make changes below. They save automatically in this browser. When ready, publish them for everyone.`}
        <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" id="exportBtn">⬇️ Export site content (to publish)</button>
          <a class="btn ghost small" href="index.html" target="_blank">👁️ Preview site</a>
          ${edited ? `<button class="btn ghost small" id="discardBtn">↩️ Discard my changes</button>` : ""}
          <button class="btn ghost small" id="lockBtn">🔒 Lock</button>
        </div>
      </div>`;
    if (bar) bar.outerHTML = html;
    else document.getElementById("adminBody").insertAdjacentHTML("afterbegin", html);
    wireActions();
  }

  function wireActions() {
    const exp = document.getElementById("exportBtn");
    if (exp) exp.addEventListener("click", exportContent);
    const dis = document.getElementById("discardBtn");
    if (dis) dis.addEventListener("click", () => {
      if (confirm("Discard all changes you've made in this browser and go back to the published version?")) {
        BH.discardLocalEdits();
        content = BH.getContent();
        renderBody();
        toast("Reverted to published version");
      }
    });
    const lk = document.getElementById("lockBtn");
    if (lk) lk.addEventListener("click", () => { lock(); renderLock(); window.scrollTo({ top: 0 }); });
  }

  function exportContent() {
    const header =
`/* =====================================================================
   BrightHarvest — Published Content
   Generated from the admin panel. Replace your old assets/seed-data.js
   with this file to publish these changes for everyone.
   ===================================================================== */

window.BH_SEED = `;
    const text = header + JSON.stringify(content, null, 2) + ";\n";
    const blob = new Blob([text], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seed-data.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Downloaded seed-data.js — put it in the assets folder to publish");
  }

  /* ---------- render everything ---------- */
  function renderNav() {
    const nav = document.getElementById("adminNav");
    nav.innerHTML = TABS.map((t) =>
      `<button data-tab="${t.id}" class="${t.id === activeTab ? "active" : ""}">${esc(t.label)}</button>`).join("");
    nav.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
      activeTab = b.getAttribute("data-tab");
      renderNav();
      renderBody();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
  }

  function renderBody() {
    const body = document.getElementById("adminBody");
    body.innerHTML = "";
    renderActions();
    const tab = TABS.find((t) => t.id === activeTab);
    tab.singles.forEach((k) => body.appendChild(renderSingle(k)));
    tab.lists.forEach((k) => body.appendChild(renderList(k)));
    if (activeTab === "site") body.appendChild(renderSecurity());
  }

  /* ---------- boot ----------
     BH.init() (from app.js) builds the top bar, left drawer menu and
     footer on DOMContentLoaded, then runs our callback to draw the
     admin tabs and panels. */
  BH.init(function () {
    if (isUnlocked()) {
      renderNav();
      renderBody();
    } else {
      renderLock();
    }
  });
})();
