/* =====================================================================
   BrightHarvest — shared front-end logic
   Loads content, builds the menu + header + footer, and renders pages.
   ===================================================================== */

const BH = (() => {
  const STORE_KEY = "bh_content_v1";

  /* Deep clone helper (so we never mutate the seed) */
  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  /* The content currently shown.
     If the admin made unpublished edits in this browser, we use those;
     otherwise we use the published seed-data.js. */
  function getContent() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore corrupt storage */ }
    return clone(window.BH_SEED);
  }

  function saveContent(content) {
    localStorage.setItem(STORE_KEY, JSON.stringify(content));
  }

  function hasLocalEdits() {
    return !!localStorage.getItem(STORE_KEY);
  }

  function discardLocalEdits() {
    localStorage.removeItem(STORE_KEY);
  }

  /* ---------- small utilities ---------- */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /* turn line breaks into paragraphs */
  function paras(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }
  function excerpt(text, len = 140) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    return clean.length > len ? clean.slice(0, len).trim() + "…" : clean;
  }
  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    if (isNaN(dt)) return esc(d);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }
  function initials(name) {
    return String(name || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }

  /* ---------- navigation items ---------- */
  const NAV = [
    { href: "index.html",       label: "Home",        ic: "🏠" },
    { href: "about.html",       label: "About Us",    ic: "🌱" },
    { href: "blogs.html",       label: "Blogs",       ic: "📝" },
    { href: "events.html",      label: "Events",      ic: "📅" },
    { href: "fundraisers.html", label: "Fundraisers", ic: "💛" },
    { href: "contact.html",     label: "Contact Us",  ic: "✉️" }
  ];

  /* ---------- build header, drawer menu and footer ---------- */
  function buildChrome() {
    const content = getContent();
    const org = content.org || { name: "BrightHarvest" };
    const here = (location.pathname.split("/").pop() || "index.html");

    const navLinks = NAV.map((n) =>
      `<a href="${n.href}" class="${n.href === here ? "active" : ""}">
         <span class="ic">${n.ic}</span> ${esc(n.label)}
       </a>`).join("");

    const LOGO = "assets/logo.jpeg";

    // Browser tab icon (favicon)
    if (!document.querySelector("link[rel='icon']")) {
      const fav = document.createElement("link");
      fav.rel = "icon";
      fav.href = LOGO;
      document.head.appendChild(fav);
    }

    // Top bar
    const header = document.getElementById("site-header");
    if (header) {
      header.innerHTML = `
        <div class="topbar">
          <button class="burger" id="burgerBtn" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <a class="brand" href="index.html">
            <img class="logo" src="${LOGO}" alt="${esc(org.name)} logo"> ${esc(org.name)}
          </a>
          <span class="spacer"></span>
          <a class="cta" href="fundraisers.html">Donate</a>
        </div>`;
    }

    // Drawer + scrim (appended once to body)
    const drawer = document.createElement("aside");
    drawer.className = "drawer";
    drawer.id = "drawer";
    drawer.innerHTML = `
      <div class="drawer-head">
        <span class="drawer-title"><img class="logo" src="${LOGO}" alt=""> ${esc(org.name)}</span>
        <button class="close" id="drawerClose" aria-label="Close menu">×</button>
      </div>
      <nav>${navLinks}</nav>
      <div class="drawer-foot">
        Run by students 💚<br>
        <a href="admin.html">Admin panel</a>
      </div>`;
    const scrim = document.createElement("div");
    scrim.className = "scrim";
    scrim.id = "scrim";
    document.body.appendChild(drawer);
    document.body.appendChild(scrim);

    // Footer
    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML = `
        <div class="footer">
          <div class="container">
            <div>
              <strong>${esc(org.name)}</strong><br>
              <span class="small">${esc(org.tagline || "")}</span>
            </div>
            <div class="small">
              ${org.location ? esc(org.location) + " · " : ""}Since ${esc(org.foundedYear || "")}<br>
              <a href="admin.html">Admin login</a>
            </div>
          </div>
        </div>`;
    }

    // Wire up open/close
    const open  = () => { drawer.classList.add("open"); scrim.classList.add("show"); };
    const close = () => { drawer.classList.remove("open"); scrim.classList.remove("show"); };
    const burger = document.getElementById("burgerBtn");
    if (burger) burger.addEventListener("click", open);
    document.getElementById("drawerClose").addEventListener("click", close);
    scrim.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- page renderers ---------- */
  function renderHome() {
    const c = getContent();
    const home = c.home || {};
    const org = c.org || {};
    const el = document.getElementById("page");
    const heroArtClass = home.heroImage ? "hero-art" : "hero-art logo-hero";
    const heroArt = home.heroImage
      ? `<img src="${esc(home.heroImage)}" alt="">`
      : `<img src="assets/logo.jpeg" alt="${esc(org.name)} logo">`;
    const stats = (home.stats || []).map((s) =>
      `<div class="stat"><div class="num">${esc(s.value)}</div><div class="lbl">${esc(s.label)}</div></div>`).join("");

    // a peek at the latest blog + next event
    const latestBlog = (c.blogs || [])[0];
    const nextEvent = (c.events || [])[0];

    el.innerHTML = `
      <section class="hero">
        <div class="container">
          <div>
            <span class="eyebrow">${esc(org.tagline || "Youth-led social venture")}</span>
            <h1>${esc(home.heroTitle || org.name)}</h1>
            <p>${esc(home.heroSubtitle || org.mission || "")}</p>
            <a class="btn" href="fundraisers.html">Support a child</a>
            <a class="btn ghost" href="about.html">Our story</a>
          </div>
          <div class="${heroArtClass}">${heroArt}</div>
        </div>
      </section>

      <section class="block">
        <div class="container">
          <div class="stats">${stats || ""}</div>
        </div>
      </section>

      <section class="block" style="background:var(--green-soft)">
        <div class="container">
          <div class="section-head">
            <h2>Our mission</h2>
            <p>${esc(org.mission || "")}</p>
          </div>
        </div>
      </section>

      <section class="block">
        <div class="container">
          <div class="grid">
            ${latestBlog ? `
              <div class="card">
                <div class="thumb">${latestBlog.image ? `<img src="${esc(latestBlog.image)}" alt="">` : "📝"}</div>
                <div class="body">
                  <div class="meta"><span class="tag">Latest blog</span><span>${fmtDate(latestBlog.date)}</span></div>
                  <h3>${esc(latestBlog.title)}</h3>
                  <p>${esc((latestBlog.body || "").slice(0, 120))}…</p>
                  <a class="btn small" href="blogs.html">Read more</a>
                </div>
              </div>` : ""}
            ${nextEvent ? `
              <div class="card">
                <div class="thumb">${nextEvent.image ? `<img src="${esc(nextEvent.image)}" alt="">` : "📅"}</div>
                <div class="body">
                  <div class="meta"><span class="tag">Next event</span><span>${fmtDate(nextEvent.date)}</span></div>
                  <h3>${esc(nextEvent.title)}</h3>
                  <p>${esc((nextEvent.description || "").slice(0, 120))}…</p>
                  <a class="btn small" href="events.html">See events</a>
                </div>
              </div>` : ""}
          </div>
        </div>
      </section>`;
  }

  function renderAbout() {
    const c = getContent();
    const a = c.about || {};
    const el = document.getElementById("page");
    const values = (a.values || []).map((v) =>
      `<div class="value"><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join("");
    const team = (a.team || []).map((m) =>
      `<div class="member">
        <div class="avatar">${m.photo ? `<img src="${esc(m.photo)}" alt="">` : esc(initials(m.name))}</div>
        <div class="name">${esc(m.name)}</div>
        <div class="role">${esc(m.role)}</div>
      </div>`).join("");

    el.innerHTML = `
      <section class="block">
        <div class="container">
          <div class="section-head">
            <span class="eyebrow">About Us</span>
            <h2>Who we are</h2>
          </div>
          <div class="admin-card">${paras(a.story)}</div>
          ${values ? `<div class="values">${values}</div>` : ""}
        </div>
      </section>
      ${team ? `
      <section class="block" style="background:var(--green-soft)">
        <div class="container">
          <div class="section-head"><h2>Meet the team</h2></div>
          <div class="team">${team}</div>
        </div>
      </section>` : ""}`;
  }

  function renderBlogs() {
    const c = getContent();
    const items = c.blogs || [];
    const el = document.getElementById("page");
    const cards = items.map((b, i) =>
      `<div class="card blog-card" data-index="${i}" role="button" tabindex="0" aria-label="Read full post: ${esc(b.title)}">
        <div class="thumb">${b.image ? `<img src="${esc(b.image)}" alt="">` : "📝"}</div>
        <div class="body">
          <div class="meta"><span>${fmtDate(b.date)}</span>${b.author ? `<span class="tag">${esc(b.author)}</span>` : ""}</div>
          <h3>${esc(b.title)}</h3>
          <p>${esc(excerpt(b.body))}</p>
          <span class="read-more">Read more →</span>
        </div>
      </div>`).join("");
    el.innerHTML = `
      <section class="block"><div class="container">
        <div class="section-head"><span class="eyebrow">Blogs</span><h2>Stories from our journey</h2></div>
        ${items.length ? `<div class="grid">${cards}</div>` : emptyState("No blog posts yet — check back soon!")}
      </div></section>`;

    if (!items.length) return;

    // Build the expanded-post modal once, then reuse it for every card.
    let modal = document.getElementById("blogModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "modal-overlay";
      modal.id = "blogModal";
      modal.innerHTML = `
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="blogModalTitle">
          <button class="modal-close" id="blogModalClose" aria-label="Close">×</button>
          <div class="modal-thumb" id="blogModalThumb"></div>
          <div class="modal-content">
            <div class="meta" id="blogModalMeta"></div>
            <h2 id="blogModalTitle"></h2>
            <div class="modal-body" id="blogModalBody"></div>
          </div>
        </div>`;
      document.body.appendChild(modal);

      const close = () => modal.classList.remove("open");
      document.getElementById("blogModalClose").addEventListener("click", close);
      modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    }

    function openModal(b) {
      document.getElementById("blogModalTitle").textContent = b.title || "";
      document.getElementById("blogModalMeta").innerHTML =
        `<span>${fmtDate(b.date)}</span>${b.author ? `<span class="tag">${esc(b.author)}</span>` : ""}`;
      document.getElementById("blogModalBody").innerHTML = paras(b.body);
      const thumb = document.getElementById("blogModalThumb");
      thumb.innerHTML = b.image ? `<img src="${esc(b.image)}" alt="">` : "";
      thumb.style.display = b.image ? "" : "none";
      modal.classList.add("open");
    }

    el.querySelectorAll(".blog-card").forEach((card) => {
      const b = items[Number(card.dataset.index)];
      const openThis = () => openModal(b);
      card.addEventListener("click", openThis);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openThis(); }
      });
    });
  }

  function renderEvents() {
    const c = getContent();
    const items = c.events || [];
    const el = document.getElementById("page");
    const cards = items.map((e) =>
      `<div class="card">
        <div class="thumb">${e.image ? `<img src="${esc(e.image)}" alt="">` : "📅"}</div>
        <div class="body">
          <div class="meta">
            <span class="tag">${fmtDate(e.date)}${e.time ? " · " + esc(e.time) : ""}</span>
            ${e.location ? `<span>📍 ${esc(e.location)}</span>` : ""}
          </div>
          <h3>${esc(e.title)}</h3>
          ${paras(e.description)}
        </div>
      </div>`).join("");
    el.innerHTML = `
      <section class="block"><div class="container">
        <div class="section-head"><span class="eyebrow">Events</span><h2>Come join us</h2></div>
        ${items.length ? `<div class="grid">${cards}</div>` : emptyState("No upcoming events right now — stay tuned!")}
      </div></section>`;
  }

  function renderFundraisers() {
    const c = getContent();
    const items = c.fundraisers || [];
    const el = document.getElementById("page");
    const cards = items.map((f) => {
      const goal = Number(f.goal) || 0;
      const raised = Number(f.raised) || 0;
      const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
      const cur = f.currency || "₹";
      return `<div class="card">
        <div class="thumb">${f.image ? `<img src="${esc(f.image)}" alt="">` : "💛"}</div>
        <div class="body">
          <h3>${esc(f.title)}</h3>
          ${paras(f.description)}
          <div class="progress"><div style="width:${pct}%"></div></div>
          <div class="fund-figures">
            <span><b>${cur}${raised.toLocaleString()}</b> raised</span>
            <span>of ${cur}${goal.toLocaleString()} (${pct}%)</span>
          </div>
          <a class="btn small" href="${f.link ? esc(f.link) : "contact.html"}" ${f.link ? 'target="_blank" rel="noopener"' : ""}>Donate now</a>
        </div>
      </div>`;
    }).join("");
    el.innerHTML = `
      <section class="block"><div class="container">
        <div class="section-head"><span class="eyebrow">Fundraisers</span><h2>Help us reach our goals</h2></div>
        ${items.length ? `<div class="grid">${cards}</div>` : emptyState("No active fundraisers yet.")}
      </div></section>`;
  }

  function renderContact() {
    const c = getContent();
    const ct = c.contact || {};
    const el = document.getElementById("page");
    el.innerHTML = `
      <section class="block"><div class="container">
        <div class="section-head"><span class="eyebrow">Contact Us</span><h2>Get in touch</h2>
          <p>${esc(ct.intro || "")}</p></div>
        <div class="contact-grid">
          <div class="contact-info">
            ${ct.email ? `<div class="row"><span class="ic">✉️</span><div><b>Email</b><br><a href="mailto:${esc(ct.email)}">${esc(ct.email)}</a></div></div>` : ""}
            ${ct.phone ? `<div class="row"><span class="ic">📞</span><div><b>Phone</b><br>${esc(ct.phone)}</div></div>` : ""}
            ${ct.address ? `<div class="row"><span class="ic">📍</span><div><b>Address</b><br>${esc(ct.address)}</div></div>` : ""}
            ${ct.instagram ? `<div class="row"><span class="ic">📸</span><div><b>Instagram</b><br><a href="${esc(ct.instagramUrl || "#")}" target="_blank" rel="noopener">${esc(ct.instagram)}</a></div></div>` : ""}
          </div>
          <form class="bh-form" id="contactForm">
            <div class="field"><label>Your name</label><input name="name" required></div>
            <div class="field"><label>Your email</label><input type="email" name="email" required></div>
            <div class="field"><label>Message</label><textarea name="message" required></textarea></div>
            <button class="btn" type="submit">Send message</button>
            <p class="hint">This opens your email app with the message ready to send.</p>
          </form>
        </div>
      </div></section>`;

    const form = document.getElementById("contactForm");
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const subject = encodeURIComponent("Hello from " + (fd.get("name") || "the website"));
      const body = encodeURIComponent(`${fd.get("message")}\n\nFrom: ${fd.get("name")} (${fd.get("email")})`);
      window.location.href = `mailto:${ct.email || ""}?subject=${subject}&body=${body}`;
    });
  }

  function emptyState(msg) {
    return `<div class="empty">${esc(msg)}</div>`;
  }

  /* ---------- boot ---------- */
  function init(pageRenderer) {
    document.addEventListener("DOMContentLoaded", () => {
      buildChrome();
      if (typeof pageRenderer === "function") pageRenderer();
    });
  }

  return {
    init, getContent, saveContent, hasLocalEdits, discardLocalEdits,
    renderHome, renderAbout, renderBlogs, renderEvents, renderFundraisers, renderContact,
    esc, clone
  };
})();
