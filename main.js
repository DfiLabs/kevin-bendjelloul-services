/* Kevin Bendjelloul — Électricité & Services (static) */

const CONFIG = {
  phoneDisplay: "06 00 00 00 00", // TODO: replace
  phoneTel: "+33600000000", // TODO: replace (international format)
  email: "contact@exemple.fr", // TODO: replace
};

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
    a.textContent = CONFIG.email;
  });

  // Update copy chips for placeholders
  $all("button[data-copy]").forEach((btn) => {
    const v = String(btn.getAttribute("data-copy") || "");
    if (v === "+33600000000") btn.setAttribute("data-copy", CONFIG.phoneTel);
    if (v === "contact@exemple.fr") btn.setAttribute("data-copy", CONFIG.email);
  });

  // Update JSON-LD if present
  const ld = document.querySelector('script[type="application/ld+json"]');
  if (ld && ld.textContent) {
    try {
      const parsed = JSON.parse(ld.textContent);
      parsed.telephone = CONFIG.phoneTel;
      parsed.email = CONFIG.email;
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
      const ry = (px - 0.5) * 10; // left/right
      const rx = (0.5 - py) * 7; // up/down
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

    const subject = `Demande de devis — ${name || "Client"}`;
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

document.addEventListener("DOMContentLoaded", () => {
  setYear();
  setAvailabilityHint();
  applyContactConfig();
  wireReveal();
  wireSpotlight();
  wireNav();
  wireCopy();
  wireTilt();
  wireMailtoForm();
  wireScrollTop();
});

