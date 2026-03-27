
/**
 * Project detail renderer
 * Loads data from data/projects-info.json (schema: { projects: [ ... ] })
 * Looks up by ?pagename=<slug>
 */

(function bootNav() {
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const open = !mobileMenu.classList.contains("max-h-screen");
      mobileMenu.classList.toggle("max-h-0", !open);
      mobileMenu.classList.toggle("max-h-screen", open);
    });
  }
  window.addEventListener("scroll", () => {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    if (window.scrollY > 20) nav.classList.add("nav-scrolled");
    else nav.classList.remove("nav-scrolled");
  });
})();

const SITE_URL = "https://acml.teddylazebnik.com";

function qs(id){ return document.getElementById(id); }
function compactText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}
function clipText(text, maxLength = 180) {
  const normalized = compactText(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}
function absoluteUrl(path) {
  if (!path) return `${SITE_URL}/img/logo.png`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}/${String(path).replace(/^\/+/, "")}`;
}
function setMetaContent(id, value) {
  const node = qs(id);
  if (node && value) node.setAttribute("content", value);
}
function updateProjectSeo(project, slug) {
  const canonicalUrl = `${SITE_URL}/project.html?pagename=${encodeURIComponent(slug)}`;
  const title = `${project.title} | Research Project | Applied Computational Mathematics Laboratory`;
  const description = clipText(
    project.subtitle ||
    project.summary ||
    project.description ||
    "Explore an ACML research project in computational mathematics, modeling, simulation, and applied AI."
  );
  const image = absoluteUrl(project.heroImage || project.image);

  document.title = title;
  setMetaContent("meta-description", description);
  setMetaContent("og-title", title);
  setMetaContent("og-description", description);
  setMetaContent("og-url", canonicalUrl);
  setMetaContent("og-image", image);
  setMetaContent("twitter-title", title);
  setMetaContent("twitter-description", description);
  setMetaContent("twitter-image", image);

  const canonicalLink = qs("canonical-link");
  if (canonicalLink) canonicalLink.setAttribute("href", canonicalUrl);

  const structuredData = qs("project-structured-data");
  if (structuredData) {
    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ResearchProject",
      "name": project.title,
      "url": canonicalUrl,
      "description": description,
      "image": image,
      "keywords": Array.isArray(project.tags) ? project.tags.join(", ") : undefined,
      "member": Array.isArray(project.team)
        ? project.team.map((member) => ({
            "@type": "Person",
            "name": member.name
          }))
        : undefined,
      "publisher": {
        "@type": "Organization",
        "name": "Applied Computational Mathematics Laboratory",
        "url": `${SITE_URL}/index.html`
      }
    }, null, 2);
  }
}
function badge(text) {
  const span = document.createElement("span");
  span.className = "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800";
  span.textContent = text;
  return span;
}
function pill(text) {
  const s = document.createElement("span");
  s.className = "px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border";
  s.textContent = text;
  return s;
}
function linkButton({ href, label, icon }) {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.className = "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-primary hover:text-primary transition text-sm";
  a.innerHTML = `<i class="${icon || 'ri-external-link-line'}"></i><span>${label}</span>`;
  return a;
}
function teamRow(member) {
  const wrap = document.createElement("div");
  wrap.className = "flex items-center gap-3";
  const img = document.createElement("img");
  img.src = member.avatar || "img/people/default.jpg";
  img.alt = member.name;
  img.className = "w-10 h-10 rounded-full object-cover";
  const name = document.createElement("div");
  name.className = "text-sm";
  const links = member.links || {};
  const gs = links.google_scholar ? `<a class="text-primary hover:text-secondary ml-1" href="${links.google_scholar}" target="_blank" rel="noopener" title="Google Scholar"><i class="ri-graduation-cap-line"></i></a>` : "";
  const web = links.website ? `<a class="text-primary hover:text-secondary ml-1" href="${links.website}" target="_blank" rel="noopener" title="Website"><i class="ri-global-line"></i></a>` : "";
  name.innerHTML = `<div class="font-medium flex items-center">${member.name}${gs}${web}</div><div class="text-gray-500">${member.role || ""}</div>`;
  wrap.append(img, name);
  return wrap;
}
function listItem(text, href) {
  const li = document.createElement("li");
  if (href) li.innerHTML = `<a class="text-primary hover:text-secondary" href="${href}" target="_blank" rel="noopener">${text}</a>`;
  else li.textContent = text;
  return li;
}
function timelineItem(ev) {
  const li = document.createElement("li");
  li.className = "ms-4";
  li.innerHTML = `
    <div class="absolute w-3 h-3 rounded-full bg-primary -start-1.5 mt-1.5"></div>
    <time class="text-xs text-gray-400">${ev.date || ""}</time>
    <h4 class="font-medium">${ev.title || ""}</h4>
    <p class="text-gray-600">${ev.text || ""}</p>`;
  return li;
}

async function loadData() {
  const res = await fetch("data/projects-info.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load projects-info.json");
  return res.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  const root = qs("project-root");
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("pagename");

  try {
    const data = await loadData();
    const list = Array.isArray(data.projects) ? data.projects : [];
    const bySlug = Object.fromEntries(list.map(p => [p.slug, p]));
    const p = bySlug[slug];

    if (!p) {
      document.title = "Project Not Found | Applied Computational Mathematics Laboratory";
      root.innerHTML = `
        <section class="py-24">
          <div class="max-w-3xl mx-auto px-6 text-center">
            <h1 class="text-3xl font-semibold mb-3">Project not found</h1>
            <p class="text-gray-600 mb-6">We couldn't find a project for <code>?pagename=${slug || "(none)"}.</code></p>
            <a href="projects.html" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90">
              <i class="ri-arrow-left-line"></i> Back to Projects
            </a>
          </div>
        </section>`;
      return;
    }

    // Titlebar + badges
    updateProjectSeo(p, slug);
    if (p.heroImage || p.image) qs("hero").style.backgroundImage = `url('${p.heroImage || p.image}')`;
    qs("proj-title").textContent = p.title || "";
    qs("proj-subtitle").textContent = p.subtitle || p.summary || "";
    if (p.category) qs("proj-category").textContent = p.category;
    if (p.status) qs("proj-status").textContent = (p.status[0].toUpperCase()+p.status.slice(1));
    if (p.period) qs("proj-period").textContent = p.period;

    // Summary + description
    const sum = qs("proj-summary");
    const paragraphs = [p.description].filter(Boolean);
    if (paragraphs.length) sum.innerHTML = paragraphs.map(par => `<p class="text-gray-700 leading-relaxed">${par}</p>`).join("");
    else sum.classList.add("hidden");

    // Methods
    const methodsWrap = qs("proj-methods");
    const methodsList = qs("proj-methods-list");
    const methods = p.methods || [];
    if (methods.length) methods.forEach(m => methodsList.appendChild(pill(m)));
    else methodsWrap.classList.add("hidden");

    // Outcomes
    const outWrap = qs("proj-outcomes");
    const outList = qs("proj-outcomes-list");
    const outcomes = p.outcomes || [];
    if (outcomes.length) outcomes.forEach(o => outList.appendChild(listItem(o)));
    else outWrap.classList.add("hidden");

    // Timeline
    const tlWrap = qs("proj-timeline");
    const tlList = qs("proj-timeline-list");
    const timeline = p.timeline || [];
    if (timeline.length) timeline.forEach(ev => tlList.appendChild(timelineItem(ev)));
    else tlWrap.classList.add("hidden");

    // Tags
    const tags = qs("proj-tags");
    (p.tags || []).forEach(t => tags.appendChild(badge(t)));

    // Links (buttons)
    const linksWrap = qs("proj-links");
    const linksList = qs("proj-links-list");
    const buttons = p.links_buttons || [];
    if (buttons.length) buttons.forEach(l => linksList.appendChild(linkButton(l)));
    else linksWrap.classList.add("hidden");

    // Team
    const teamWrap = qs("proj-team");
    const teamList = qs("proj-team-list");
    if (Array.isArray(p.team) && p.team.length) p.team.forEach(m => teamList.appendChild(teamRow(m)));
    else teamWrap.classList.add("hidden");

    // Publications
    const pubsWrap = qs("proj-pubs");
    const pubsList = qs("proj-pubs-list");
    if (Array.isArray(p.publications) && p.publications.length) p.publications.forEach(pub => pubsList.appendChild(listItem(pub.title, pub.href)));
    else pubsWrap.classList.add("hidden");

  } catch (e) {
    console.error(e);
    root.innerHTML = `<section class="py-24 text-center"><h1 class="text-2xl font-semibold">Error loading project.</h1><p class="text-gray-600">Please try again.</p></section>`;
  }
});
