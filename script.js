(() => {
  "use strict";

  const gate = document.getElementById("gate");
  const enterBtn = document.getElementById("enter-btn");
  const invite = document.getElementById("invite");
  const modal = document.getElementById("modal");
  const acceptBtn = document.getElementById("accept-btn");
  const sealBtn = document.getElementById("seal-btn");
  const canvas = document.getElementById("drip-canvas");
  const ctx = canvas.getContext("2d");

  /* ---------- Gate ---------- */

  function openInvite() {
    gate.classList.add("is-gone");
    invite.hidden = false;
    document.body.style.overflow = "";
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    });
    setTimeout(() => {
      gate.hidden = true;
    }, 1200);
    initReveals();
    burstDrips(18);
  }

  document.body.style.overflow = "hidden";
  enterBtn.addEventListener("click", openInvite);
  enterBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openInvite();
    }
  });

  /* ---------- Modal ---------- */

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    burstDrips(24);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  acceptBtn?.addEventListener("click", openModal);
  sealBtn?.addEventListener("click", openModal);
  modal?.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  /* ---------- Scroll reveals ---------- */

  function initReveals() {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach((n, i) => {
      n.style.transitionDelay = `${(i % 4) * 90}ms`;
      io.observe(n);
    });
  }

  /* ---------- Clay drip canvas ---------- */

  const drips = [];
  const MAX_DRIPS = 90;
  let w = 0;
  let h = 0;
  let mouse = { x: -9999, y: -9999 };
  let lastSpawn = 0;
  let raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnDrip(x, y, force = false) {
    if (!force && drips.length >= MAX_DRIPS) return;
    const size = 2 + Math.random() * 7;
    drips.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.4 + Math.random() * 1.8,
      r: size,
      life: 1,
      decay: 0.0025 + Math.random() * 0.004,
      hue: Math.random() > 0.72 ? "blood" : "clay",
      stretch: 1 + Math.random() * 2.5,
    });
  }

  function burstDrips(count) {
    const cx = w * 0.5;
    const cy = h * 0.35;
    for (let i = 0; i < count; i++) {
      spawnDrip(
        cx + (Math.random() - 0.5) * w * 0.7,
        cy + (Math.random() - 0.5) * h * 0.25,
        true
      );
    }
  }

  function drawDrip(d) {
    const alpha = Math.max(d.life, 0);
    if (d.hue === "blood") {
      ctx.fillStyle = `rgba(224, 24, 32, ${0.35 * alpha})`;
    } else {
      ctx.fillStyle = `rgba(154, 107, 58, ${0.45 * alpha})`;
    }

    ctx.beginPath();
    ctx.ellipse(
      d.x,
      d.y,
      d.r * 0.55,
      d.r * d.stretch,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // sticky head
    ctx.beginPath();
    ctx.arc(d.x, d.y - d.r * d.stretch * 0.55, d.r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function tick(now) {
    ctx.clearRect(0, 0, w, h);

    // ambient top drips
    if (now - lastSpawn > 180 && drips.length < MAX_DRIPS) {
      spawnDrip(Math.random() * w, -10);
      lastSpawn = now;
    }

    // mouse trail
    if (mouse.x > 0 && Math.random() > 0.55) {
      spawnDrip(mouse.x + (Math.random() - 0.5) * 30, mouse.y);
    }

    for (let i = drips.length - 1; i >= 0; i--) {
      const d = drips[i];
      d.vy += 0.035;
      d.x += d.vx;
      d.y += d.vy;
      d.stretch = Math.min(4.5, d.stretch + 0.015);
      d.life -= d.decay;

      drawDrip(d);

      if (d.life <= 0 || d.y > h + 40) {
        drips.splice(i, 1);
      }
    }

    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  /* ---------- Parallax blobs ---------- */

  const blobs = document.querySelectorAll(".hero__blob");
  window.addEventListener(
    "pointermove",
    (e) => {
      if (invite.hidden) return;
      const nx = (e.clientX / w - 0.5) * 2;
      const ny = (e.clientY / h - 0.5) * 2;
      blobs.forEach((blob, i) => {
        const depth = (i + 1) * 8;
        blob.style.translate = `${nx * depth}px ${ny * depth}px`;
      });
    },
    { passive: true }
  );

  /* ---------- Title glitch twitch ---------- */

  const titleMain = document.querySelector(".hero__title-layer--main");
  if (titleMain) {
    setInterval(() => {
      if (invite.hidden || Math.random() > 0.2) return;
      titleMain.style.transform = `translate(${(Math.random() - 0.5) * 4}px, ${(Math.random() - 0.5) * 3}px)`;
      setTimeout(() => {
        titleMain.style.transform = "";
      }, 80 + Math.random() * 120);
    }, 2800);
  }

  /* ---------- Ticket code flicker ---------- */

  const codeEl = document.getElementById("ticket-code");
  const baseCode = "CF–VIVI–20";
  if (codeEl) {
    setInterval(() => {
      if (invite.hidden || Math.random() > 0.3) return;
      const chars = "CFVIVI208X#█░";
      let glitch = "";
      for (let i = 0; i < baseCode.length; i++) {
        glitch += Math.random() > 0.65 ? chars[(Math.random() * chars.length) | 0] : baseCode[i];
      }
      codeEl.textContent = glitch;
      setTimeout(() => {
        codeEl.textContent = baseCode;
      }, 120);
    }, 3200);
  }

  /* ---------- Boot ---------- */

  resize();
  raf = requestAnimationFrame(tick);

  // seed a few drips behind the gate for atmosphere
  for (let i = 0; i < 12; i++) {
    spawnDrip(Math.random() * Math.max(w, 320), Math.random() * Math.max(h * 0.4, 100), true);
  }

  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
})();
