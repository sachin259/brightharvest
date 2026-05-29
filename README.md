# 🌾 BrightHarvest website

A simple, no-build website for the BrightHarvest youth social venture, with a
**built-in admin panel** so a student can add and edit content without coding.

## Pages
- **Home** (`index.html`) — hero, mission, impact numbers, latest blog & event
- **About Us** (`about.html`) — story, values, team
- **Blogs** (`blogs.html`)
- **Events** (`events.html`)
- **Fundraisers** (`fundraisers.html`) — with automatic progress bars
- **Contact Us** (`contact.html`) — details + a message form
- **Admin panel** (`admin.html`) — manage everything above

A **burger menu on the left** is on every page (tap the green ☰ button top-left).

## How to view the site
Just **double-click `index.html`** — it opens in your browser. No installation,
no server needed. (For the live public version, upload the whole folder to any
free static host like GitHub Pages, Netlify or Cloudflare Pages.)

---

## ✏️ For the admin: adding & editing content

1. Open **`admin.html`** in your browser (there's an *Admin* link in the menu
   and footer).
2. Enter the **passcode**. The starting passcode is **`harvest2026`** — change
   it right away on the **Site & Home** tab (🔒 Admin passcode card). Use the
   **🔒 Lock** button to sign out. (See the security note at the bottom.)
3. Pick a tab on the left: **Site & Home, About Us, Blogs, Events,
   Fundraisers, Contact**.
4. Use the forms to **add**, **edit** or **delete** entries. You can add
   photos straight from your phone or computer (keep them under 1.5 MB).
4. Everything you change is **saved automatically in your browser**, so you can
   click **👁️ Preview site** to see exactly how it looks.

### Publishing your changes so everyone can see them
Your edits start out only on *your* device. To make them live for all visitors:

1. In the admin panel, click **⬇️ Export site content**. This downloads a file
   called **`seed-data.js`**.
2. Put that file into the **`assets`** folder, replacing the old `seed-data.js`.
3. Re-upload the site (or just re-open it). Done — everyone now sees the new
   content.

> 💡 Think of it like saving a document: editing in the panel is your *draft*;
> **Export → replace the file** is hitting *publish*.

If you ever want to throw away your unsaved drafts and go back to the published
version, click **↩️ Discard my changes** in the admin panel.

---

## Files
```
index.html, about.html, blogs.html, events.html,
fundraisers.html, contact.html   → the public pages
admin.html                       → the content editor
assets/seed-data.js              → ALL the website content (published)
assets/styles.css                → colours & layout
assets/app.js                    → menu + page display
assets/admin.js                  → the admin panel
```

## Notes
- **About the admin passcode:** it's a *soft lock*. Because this is a static
  site with no server, the passcode lives in the page's code, so a determined
  technical person could bypass it — it's there to keep casual visitors out,
  not to protect secrets. Importantly, even without it nobody can change the
  *live* site unless they can replace `seed-data.js` on your host. The passcode
  you set is remembered per-browser; you stay logged in until you click
  **🔒 Lock** or close the tab. If you want a real login with accounts, that
  needs the "full CMS with backend" option (a server + database).
- The Contact form opens the visitor's email app with their message pre-filled
  (no server required).
