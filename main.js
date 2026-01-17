/* Kevin Bendjelloul - Électricité & Services (static) */

const CONFIG = {
  phoneDisplay: "06 32 63 77 23",
  phoneTel: "+33632637723",
  email: "kevin.benjelloul@gmail.com",
  publishEmailInSchema: false,
  whatsappEnabled: true,
  whatsappMessage: "Bonjour, je souhaite un devis / une intervention. Zone: Montpellier/Hérault. Mon besoin:",
};

async function loadContentJson() {
  try {
    const res = await fetch("./content.json", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json && typeof json === "object" ? json : null;
  } catch (_) {
    return null;
  }
}

function applyContentJson(content) {
  if (!content || typeof content !== "object") return;

  // Contact
  const c = content.contact && typeof content.contact === "object" ? content.contact : null;
  if (c) {
    if (typeof c.phoneDisplay === "string") CONFIG.phoneDisplay = c.phoneDisplay;
    if (typeof c.phoneTel === "string") CONFIG.phoneTel = c.phoneTel;
    if (typeof c.email === "string") CONFIG.email = c.email;
    if (typeof c.publishEmailInSchema === "boolean") CONFIG.publishEmailInSchema = c.publishEmailInSchema;
    if (c.whatsapp && typeof c.whatsapp === "object") {
      if (typeof c.whatsapp.enabled === "boolean") CONFIG.whatsappEnabled = c.whatsapp.enabled;
      if (typeof c.whatsapp.message === "string") CONFIG.whatsappMessage = c.whatsapp.message;
    }
  }

  // CTA reassurance line
  if (Array.isArray(content.ctaReassurance)) {
    const items = content.ctaReassurance.filter((x) => typeof x === "string" && x.trim()).slice(0, 4);
    const el = document.querySelector("[data-cta-reassurance]");
    if (el && items.length) el.textContent = items.join(" • ");
  }

  // Service enhancements (bullets + meta)
  if (Array.isArray(content.services)) {
    const byId = new Map();
    content.services.forEach((s) => {
      if (s && typeof s === "object" && typeof s.id === "string") byId.set(s.id, s);
    });

    document.querySelectorAll("[data-service-id]").forEach((card) => {
      const id = card.getAttribute("data-service-id");
      if (!id) return;
      const s = byId.get(id);
      if (!s) return;

      const ul = card.querySelector("[data-service-examples]");
      if (ul) {
        ul.innerHTML = "";
        const ex = Array.isArray(s.examples) ? s.examples.filter((x) => typeof x === "string" && x.trim()).slice(0, 3) : [];
        ex.forEach((t) => {
          const li = document.createElement("li");
          li.textContent = t;
          ul.appendChild(li);
        });
      }

      const turn = card.querySelector("[data-service-turnaround]");
      if (turn) turn.textContent = typeof s.turnaround === "string" ? s.turnaround : "";
      const price = card.querySelector("[data-service-price]");
      if (price) price.textContent = typeof s.fromPrice === "string" ? s.fromPrice : "";
    });
  }
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function showToast(msg) {
  const toast = $("[data-toast]");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function safeClipboardWrite(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard.writeText(text);
  }
  // Fallback
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function setYear() {
  const y = new Date().getFullYear();
  $all("[data-year]").forEach((el) => (el.textContent = String(y)));
}

function setAvailabilityHint() {
  const el = $("[data-availability]");
  if (!el) return;
  const d = new Date();
  const day = d.getDay(); // 0..6
  const map = {
    0: "À partir de lundi",
    1: "Cette semaine",
    2: "Cette semaine",
    3: "Cette semaine",
    4: "Cette semaine",
    5: "Sous 48h",
    6: "Dès lundi",
  };
  el.textContent = map[day] || "Cette semaine";
}

function applyContactConfig() {
  // Update all phone links (keep text "Appeler" if present)
  $all("a[data-phone-link]").forEach((a) => {
    a.href = `tel:${CONFIG.phoneTel}`;
    if (a.textContent.trim().match(/^0\d(\s?\d{2}){4}$/) || a.textContent.includes("00 00")) {
      a.textContent = CONFIG.phoneDisplay;
    }
  });

  // Update email links
  $all("a[data-email-link]").forEach((a) => {
    a.href = `mailto:${CONFIG.email}`;
    // Do not print the raw email unless the element already contains it
    if (a.textContent.includes("@")) a.textContent = CONFIG.email;
  });

  // WhatsApp links (optional)
  const digits = CONFIG.phoneTel.replace(/[^\d+]/g, "").replace("+", "");
  const waUrl = `https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(CONFIG.whatsappMessage || "")}`;
  $all("a[data-whatsapp-link]").forEach((a) => {
    if (!CONFIG.whatsappEnabled) {
      a.setAttribute("hidden", "true");
      return;
    }
    a.removeAttribute("hidden");
    a.href = waUrl;
    a.target = "_blank";
    a.rel = "noreferrer";
  });

  // Update copy chips for placeholders
  $all("button[data-copy]").forEach((btn) => {
    const v = String(btn.getAttribute("data-copy") || "");
    if (v === "+33632637723") btn.setAttribute("data-copy", CONFIG.phoneTel);
  });

  // Update JSON-LD if present
  const ld = document.querySelector('script[type="application/ld+json"]');
  if (ld && ld.textContent) {
    try {
      const parsed = JSON.parse(ld.textContent);
      parsed.telephone = CONFIG.phoneTel;
      if (CONFIG.publishEmailInSchema) parsed.email = CONFIG.email;
      else if ("email" in parsed) delete parsed.email;
      parsed.url = `${location.origin}${location.pathname}`;
      ld.textContent = JSON.stringify(parsed, null, 2);
    } catch (_) {
      // ignore
    }
  }
}

function wireReveal() {
  const els = $all(".reveal");
  if (!els.length) return;

  // Ensure above-the-fold feels snappy
  els.slice(0, 3).forEach((el) => el.classList.add("is-visible"));

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  els.forEach((el) => io.observe(el));
}

function wireSpotlight() {
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  let raf = 0;
  let lastX = 0;
  let lastY = 0;

  const set = () => {
    raf = 0;
    const x = Math.round((lastX / window.innerWidth) * 100);
    const y = Math.round((lastY / window.innerHeight) * 100);
    document.documentElement.style.setProperty("--spot-x", `${x}%`);
    document.documentElement.style.setProperty("--spot-y", `${y}%`);
  };

  window.addEventListener(
    "pointermove",
    (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = window.requestAnimationFrame(set);
    },
    { passive: true }
  );
}

function wireHeroParallax() {
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const hero = document.querySelector(".hero");
  if (!hero) return;

  let raf = 0;
  const onScroll = () => {
    raf = 0;
    const r = hero.getBoundingClientRect();
    // Only parallax while hero is near viewport
    const vh = Math.max(1, window.innerHeight);
    const progress = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    const offset = Math.round((progress - 0.5) * 30); // -15..+15px
    document.documentElement.style.setProperty("--hero-parallax", `${offset}px`);
  };

  onScroll();
  window.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = window.requestAnimationFrame(onScroll);
    },
    { passive: true }
  );
  window.addEventListener(
    "resize",
    () => {
      if (!raf) raf = window.requestAnimationFrame(onScroll);
    },
    { passive: true }
  );
}

function wireNav() {
  const toggle = $("[data-nav-toggle]");
  const menu = $("[data-nav-menu]");
  if (!toggle || !menu) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("open");
  };

  const open = () => {
    toggle.setAttribute("aria-expanded", "true");
    menu.classList.add("open");
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) close();
    else open();
  });

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest("[data-nav-menu]") || t.closest("[data-nav-toggle]")) return;
    close();
  });

  $all("a.nav-link", menu).forEach((a) => {
    a.addEventListener("click", close);
  });
}

function wireStickyHeaderAndActiveNav() {
  const topbar = document.querySelector(".topbar");
  const navLinks = $all('.nav-link[href^="#"]');
  if (!topbar && !navLinks.length) return;

  // Sticky header background on scroll
  let raf = 0;
  const onScroll = () => {
    raf = 0;
    if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = window.requestAnimationFrame(onScroll);
    },
    { passive: true }
  );

  // Active section highlight (skip mobile menu button; highlight only hash links)
  const links = navLinks.filter((a) => a.getAttribute("href") && a.getAttribute("href") !== "#top");
  const items = [];
  for (const a of links) {
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("#")) continue;
    const section = document.querySelector(href);
    if (!section) continue;
    items.push({ a, section, id: href.slice(1) });
  }
  if (!items.length) return;

  const setActive = (id) => {
    for (const it of items) {
      const active = it.id === id;
      it.a.classList.toggle("active", active);
      if (active) it.a.setAttribute("aria-current", "page");
      else it.a.removeAttribute("aria-current");
    }
  };

  // Default to first visible or first link
  setActive(items[0].id);

  if (!("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      // Pick the most visible intersecting section
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
      if (!visible.length) return;
      const el = visible[0].target;
      const hit = items.find((x) => x.section === el);
      if (hit) setActive(hit.id);
    },
    {
      root: null,
      // Activate a section when it enters the upper part of the viewport
      rootMargin: "-20% 0px -70% 0px",
      threshold: [0, 0.08, 0.16, 0.25, 0.4, 0.6],
    }
  );

  items.forEach((it) => io.observe(it.section));
}

function wireCopy() {
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const el = t.closest("[data-copy]");
    if (!el) return;

    const value = el.getAttribute("data-copy");
    if (!value) return;

    safeClipboardWrite(value)
      .then(() => showToast("Copié."))
      .catch(() => showToast("Impossible de copier."));
  });
}

function wireTilt() {
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const els = $all("[data-tilt]");
  if (!els.length) return;

  const setTilt = (el, rx, ry) => {
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
  };

  for (const el of els) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / Math.max(1, r.width);
      const py = (e.clientY - r.top) / Math.max(1, r.height);
      const ry = (px - 0.5) * 6; // left/right (subtle)
      const rx = (0.5 - py) * 4; // up/down (subtle)
      setTilt(el, rx, ry);
    });
    el.addEventListener("pointerleave", () => setTilt(el, 0, 0));
  }
}

function wireMailtoForm() {
  const form = $("[data-mailto-form]");
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    const subject = `Demande de devis - ${name || "Client"}`;
    const lines = [
      "Bonjour,",
      "",
      "Je souhaite un devis / une intervention :",
      "",
      message,
      "",
      "---",
      `Nom: ${name}`,
      `Téléphone: ${phone}`,
      `Email: ${email}`,
      `Page: ${location.href}`,
    ];

    const href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      lines.join("\n")
    )}`;

    window.location.href = href;
    showToast("Ouverture de la messagerie…");
  });
}

function wireScrollTop() {
  $all("[data-scroll-top]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setYear();
  setAvailabilityHint();
  const content = await loadContentJson();
  applyContentJson(content);
  applyContactConfig();
  wireReveal();
  wireSpotlight();
  wireHeroParallax();
  wireNav();
  wireStickyHeaderAndActiveNav();
  wireCopy();
  wireTilt();
  wireMailtoForm();
  wireScrollTop();
});

