(() => {
  "use strict";

  /* ---------- background particles (canvas2d, lightweight) ---------- */

  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  let particles = [];
  const POINTER = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const count = Math.min(46, Math.floor((window.innerWidth * window.innerHeight) / 26000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.6 + 0.4) * dpr,
      vy: (Math.random() * 0.08 + 0.02) * dpr,
      a: Math.random() * 0.5 + 0.15,
      drift: Math.random() * 0.4 - 0.2,
    }));
    updatePupilBounds();
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    POINTER.x += (POINTER.tx - POINTER.x) * 0.03;
    POINTER.y += (POINTER.ty - POINTER.y) * 0.03;
    const parX = (POINTER.x - 0.5) * 24 * dpr;
    const parY = (POINTER.y - 0.5) * 24 * dpr;

    for (const p of particles) {
      p.y -= p.vy;
      p.x += p.drift * 0.05;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const gx = p.x + parX * (p.r / dpr);
      const gy = p.y + parY * (p.r / dpr);

      ctx.beginPath();
      ctx.arc(gx, gy, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(62, 140, 111, ${p.a})`;
      ctx.fill();
    }

    moveEyes();
    requestAnimationFrame(tick);
  }

  /* ---------- pupil tracking ---------- */

  const pupilConfigs = [
    { el: document.getElementById("pupilIntro"), maxX: 0, maxY: 0 },
    { el: document.getElementById("pupilMark"), maxX: 0, maxY: 0 },
  ];

  function updatePupilBounds() {
    for (const cfg of pupilConfigs) {
      if (!cfg.el) continue;
      const wrap = cfg.el.parentElement;
      const rect = wrap.getBoundingClientRect();
      cfg.maxX = rect.width * 0.045;
      cfg.maxY = rect.height * 0.05;
    }
  }

  function moveEyes() {
    const nx = (POINTER.x - 0.5) * 2;
    const ny = (POINTER.y - 0.5) * 2;
    for (const cfg of pupilConfigs) {
      if (!cfg.el) continue;
      const dx = nx * cfg.maxX;
      const dy = ny * cfg.maxY;
      cfg.el.style.transform = `translate(calc(-50% + ${dx.toFixed(2)}px), calc(-50% + ${dy.toFixed(2)}px))`;
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", (e) => {
    POINTER.tx = e.clientX / window.innerWidth;
    POINTER.ty = e.clientY / window.innerHeight;
  }, { passive: true });
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || e.beta == null) return;
    POINTER.tx = Math.min(1, Math.max(0, 0.5 + e.gamma / 90));
    POINTER.ty = Math.min(1, Math.max(0, 0.5 + (e.beta - 45) / 90));
  }, { passive: true });

  resize();
  requestAnimationFrame(tick);

  /* ---------- audio (synthesized, no assets) ---------- */

  let audioCtx = null;
  let audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioUnlocked = true;
    } catch (e) { /* audio unavailable */ }
  }

  function playChime() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 1.1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  function playTick() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  function playMiss() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  function playCelebrate() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.05, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.4);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.5);
    });
  }

  window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });

  /* ---------- intro sequence ---------- */

  const intro = document.getElementById("intro");
  const content = document.getElementById("content");
  const eyeWrap = document.getElementById("eyeWrap");
  const markWrap = document.getElementById("markWrap");
  const introText = document.getElementById("introText");
  const cards = document.querySelectorAll(".card");

  const SEEN_KEY = "bacu_intro_seen";
  const skip = sessionStorage.getItem(SEEN_KEY) === "1";

  function revealContent() {
    intro.style.display = "none";
    content.removeAttribute("aria-hidden");
    gsap.set(content, { visibility: "visible" });
    gsap.to(content, { opacity: 1, duration: 0.5, ease: "power1.out" });
    gsap.fromTo(".hub-header", { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" });
    gsap.fromTo(cards, { y: 14, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.07, delay: 0.15,
    });
  }

  function runIntro() {
    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        gsap.to(intro, {
          opacity: 0, duration: 0.6, ease: "power1.inOut",
          onComplete: () => {
            revealContent();
            playChime();
            sessionStorage.setItem(SEEN_KEY, "1");
          },
        });
      },
    });

    tl.to(eyeWrap, { opacity: 1, scale: 1, duration: 1.1, ease: "power2.out" })
      .to(eyeWrap, { scaleY: 1.025, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: 1 }, "<0.2")
      .to(eyeWrap, { scaleY: 0.08, duration: 0.16, ease: "power1.in" }, "+=0.5")
      .to(eyeWrap, { scaleY: 1, duration: 0.28, ease: "power2.out" })
      .to(introText, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.1")
      .to({}, { duration: 0.9 });
  }

  function skipIntro() {
    gsap.killTweensOf([eyeWrap, introText, intro]);
    intro.style.display = "none";
    revealContent();
  }

  /* ---------- idle blink loop ---------- */

  function blink(target) {
    gsap.to(target, {
      scaleY: 0.08,
      duration: 0.09,
      ease: "power1.in",
      onComplete: () => {
        gsap.to(target, { scaleY: 1, duration: 0.16, ease: "power2.out" });
      },
    });
  }

  function scheduleBlink(target) {
    const delay = 2600 + Math.random() * 3800;
    setTimeout(() => {
      blink(target);
      if (Math.random() < 0.25) {
        setTimeout(() => blink(target), 320);
      }
      scheduleBlink(target);
    }, delay);
  }

  if (markWrap) scheduleBlink(markWrap);

  intro.addEventListener("click", () => {
    if (intro.style.display === "none") return;
    unlockAudio();
    skipIntro();
    sessionStorage.setItem(SEEN_KEY, "1");
  }, { passive: true });

  if (skip || !window.gsap) {
    intro.style.display = "none";
    revealContent();
  } else {
    runIntro();
  }

  /* ---------- card pointer highlight ---------- */

  cards.forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--px", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty("--py", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
  });

  /* ========== HABITS / BIENESTAR ========== */

  const HABITS_KEY = "bacu_habits";
  const CHECKS_KEY = "bacu_checks";

  /* --- element references --- */

  const habitsView = document.getElementById("habits-view");
  const btnHabits = document.getElementById("btn-habits");
  const btnBack = document.getElementById("habits-back");
  const habitsGreeting = document.getElementById("habits-greeting");

  // Quick Check
  const qcList = document.getElementById("qc-list");
  const qcRingFill = document.getElementById("qc-ring-fill");
  const qcRingPct = document.getElementById("qc-ring-pct");
  const qcDate = document.getElementById("qc-date");
  const qcMsg = document.getElementById("qc-msg");
  const RING_C = 2 * Math.PI * 52; // circumference ≈ 326.73

  // Add habit
  const habitsInput = document.getElementById("habits-input");
  const habitsAddBtn = document.getElementById("habits-add-btn");

  // Week view (inside collapsible)
  const toggleWeek = document.getElementById("toggle-week");
  const weekBody = document.getElementById("week-body");
  const habitsWeekLabel = document.getElementById("habits-week");
  const habitsDaysEl = document.getElementById("habits-days");
  const habitsList = document.getElementById("habits-list");
  const weekPrev = document.getElementById("week-prev");
  const weekNext = document.getElementById("week-next");

  // Analysis (inside collapsible)
  const toggleAnalysis = document.getElementById("toggle-analysis");
  const analysisBody = document.getElementById("analysis-body");
  const analysisSectionEl = document.getElementById("analysis-section");
  const analConsistency = document.getElementById("anal-consistency");
  const analBestDay = document.getElementById("anal-best-day");
  const analTotal = document.getElementById("anal-total");
  const analVsLast = document.getElementById("anal-vs-last");
  const analysisHabitsEl = document.getElementById("analysis-habits");
  const analysisInsightEl = document.getElementById("analysis-insight");

  // Confetti
  const confettiCanvas = document.getElementById("confetti-canvas");
  const confettiCtx = confettiCanvas ? confettiCanvas.getContext("2d") : null;

  const DAY_NAMES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
  const DAY_NAMES_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const MONTH_NAMES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const MONTH_NAMES_FULL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  let weekOffset = 0;
  let lastCelebratedDate = null;

  /* --- data helpers --- */

  function loadHabits() {
    try { return JSON.parse(localStorage.getItem(HABITS_KEY)) || []; }
    catch { return []; }
  }

  function saveHabits(habits) {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }

  function loadChecks() {
    try { return JSON.parse(localStorage.getItem(CHECKS_KEY)) || {}; }
    catch { return {}; }
  }

  function saveChecks(checks) {
    localStorage.setItem(CHECKS_KEY, JSON.stringify(checks));
  }

  function ck(habitId, dateStr) {
    return `${habitId}::${dateStr}`;
  }

  function ds(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function todayStr() { return ds(new Date()); }

  /* --- seed default habits on first visit --- */

  const SEED_KEY = "bacu_habits_seeded";
  if (!localStorage.getItem(SEED_KEY)) {
    const defaultHabits = [
      { id: "h01", name: "Dormir 7-9h (misma hora)", created: todayStr() },
      { id: "h02", name: "3 comidas completas", created: todayStr() },
      { id: "h03", name: "Tomar 2L de agua", created: todayStr() },
      { id: "h04", name: "Ejercicio 30 min", created: todayStr() },
      { id: "h05", name: "Meditar 10 min", created: todayStr() },
      { id: "h06", name: "Leer 20 páginas", created: todayStr() },
      { id: "h07", name: "Sin pantallas 1h antes de dormir", created: todayStr() },
      { id: "h08", name: "Frutas y verduras en cada comida", created: todayStr() },
      { id: "h09", name: "1h sin redes sociales (enfoque creativo)", created: todayStr() },
      { id: "h10", name: "Journaling / Reflexión 5 min", created: todayStr() },
    ];
    if (loadHabits().length === 0) {
      saveHabits(defaultHabits);
    }
    localStorage.setItem(SEED_KEY, "1");
  }

  /* --- week calculation --- */

  function getWeekDates(offset) {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }

  /* --- time-aware greeting --- */

  function getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Buenos días ☀️";
    if (h >= 12 && h < 18) return "Buenas tardes 🌤️";
    return "Buenas noches 🌙";
  }

  /* --- streak helpers --- */

  function getStreak(habitId, checks) {
    let streak = 0;
    const d = new Date();
    for (let s = 0; s < 365; s++) {
      const sd = new Date(d);
      sd.setDate(d.getDate() - s);
      const key = ck(habitId, ds(sd));
      if (checks[key] === true) {
        streak++;
      } else if (s > 0) {
        break;
      }
    }
    return streak;
  }

  function getStreakBadge(streak) {
    if (streak >= 30) return "👑 " + streak + "d";
    if (streak >= 14) return "💎 " + streak + "d";
    if (streak >= 7)  return "⚡ " + streak + "d";
    if (streak >= 1)  return "🔥 " + streak + "d";
    return "";
  }

  /* --- motivational messages --- */

  function getTodayMessage(done, total, missed) {
    if (total === 0) return "Agrega hábitos y empieza a construir tu mejor versión 🌱";
    const pct = total > 0 ? done / total : 0;
    if (done === total && total > 0) return "¡Día perfecto! Todos los hábitos cumplidos 💪🔥";
    if (pct >= 0.7) return "Vas muy bien hoy, sigue así ⚡";
    if (missed > 0 && done === 0) return "Día difícil, pero puedes cambiar la historia 🌿";
    if (missed > 0) return "Hay pendientes. Cada uno que completes es una victoria 🎯";
    if (done === 0) return "Tu día está empezando. ¿Cuál hábito atacas primero? 👊";
    return "Buen progreso. No pares, el esfuerzo acumula 🔋";
  }

  function getWeekInsight(consistency, bestDayIdx, worstDayIdx, vsLastPct, habits, checks, days) {
    const parts = [];
    if (consistency >= 90) {
      parts.push("<strong>Semana excepcional.</strong> Tu consistencia está por encima del 90%. Mantén este ritmo.");
    } else if (consistency >= 70) {
      parts.push(`<strong>Buena semana.</strong> ${consistency}% de consistencia. Estás construyendo disciplina real.`);
    } else if (consistency >= 40) {
      parts.push(`<strong>Semana en progreso.</strong> ${consistency}% de consistencia. Identifica qué te frena y ajusta.`);
    } else if (consistency > 0) {
      parts.push(`<strong>Semana para reflexionar.</strong> Solo ${consistency}% de consistencia. Empieza con un hábito fácil mañana.`);
    }
    if (bestDayIdx >= 0 && worstDayIdx >= 0 && bestDayIdx !== worstDayIdx) {
      parts.push(`Tu mejor día fue <strong>${DAY_NAMES_FULL[bestDayIdx]}</strong> y el más flojo <strong>${DAY_NAMES_FULL[worstDayIdx]}</strong>.`);
    }
    if (vsLastPct > 0) {
      parts.push(`📈 Mejoraste <strong>${vsLastPct}%</strong> respecto a la semana pasada.`);
    } else if (vsLastPct < 0) {
      parts.push(`📉 Bajaste <strong>${Math.abs(vsLastPct)}%</strong> vs la semana pasada. Analiza y ajusta.`);
    }
    if (habits.length > 1) {
      let worstHabit = null;
      let worstRate = 101;
      const today = todayStr();
      habits.forEach((hab) => {
        let hDone = 0, hTotal = 0;
        days.forEach((d) => {
          const dStr = ds(d);
          if (dStr <= today) { hTotal++; if (checks[ck(hab.id, dStr)] === true) hDone++; }
        });
        const rate = hTotal > 0 ? Math.round((hDone / hTotal) * 100) : 0;
        if (rate < worstRate) { worstRate = rate; worstHabit = hab; }
      });
      if (worstHabit && worstRate < 50) {
        parts.push(`💡 <strong>"${worstHabit.name}"</strong> es tu hábito más débil (${worstRate}%). Enfócate ahí.`);
      }
    }
    return parts.join(" ");
  }

  /* --- confetti system --- */

  let confettiParticles = [];
  let confettiRunning = false;

  function launchConfetti() {
    if (!confettiCanvas || !confettiCtx) return;
    const dpi = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = window.innerWidth * dpi;
    confettiCanvas.height = window.innerHeight * dpi;
    confettiCanvas.style.width = window.innerWidth + "px";
    confettiCanvas.style.height = window.innerHeight + "px";

    const colors = ["#5CB08A", "#3E8C6F", "#e0b94f", "#F5F3ED", "#88D4AB", "#7FD1AE"];
    confettiParticles = Array.from({ length: 70 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * 300,
      w: 4 + Math.random() * 5,
      h: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 5,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      alive: true,
    }));

    if (!confettiRunning) {
      confettiRunning = true;
      tickConfetti();
    }
  }

  function tickConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    for (const p of confettiParticles) {
      if (!p.alive) continue;
      alive = true;
      p.y += p.vy;
      p.x += p.vx;
      p.rot += p.rotSpeed;
      p.vy += 0.1;
      if (p.y > confettiCanvas.height + 30) { p.alive = false; continue; }

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rot * Math.PI) / 180);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    }

    if (alive) {
      requestAnimationFrame(tickConfetti);
    } else {
      confettiRunning = false;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  /* --- collapsible toggles --- */

  function setupCollapse(btn, body) {
    if (!btn || !body) return;
    btn.addEventListener("click", () => {
      const opening = btn.classList.toggle("is-open");
      body.classList.toggle("is-open", opening);
    });
  }

  setupCollapse(toggleWeek, weekBody);
  setupCollapse(toggleAnalysis, analysisBody);

  /* ---------- render: Quick Check (today) ---------- */

  function renderQuickCheck(habits, checks) {
    const now = new Date();
    const dayIdx = (now.getDay() + 6) % 7;
    const today = todayStr();

    // Greeting
    if (habitsGreeting) habitsGreeting.textContent = getGreeting();

    // Date
    qcDate.textContent = `${DAY_NAMES_FULL[dayIdx]} ${now.getDate()} de ${MONTH_NAMES_FULL[now.getMonth()]}`;

    // Count states
    let done = 0, missed = 0;
    habits.forEach((hab) => {
      const key = ck(hab.id, today);
      if (checks[key] === true) done++;
      else if (checks[key] === false) missed++;
    });

    const total = habits.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    // Ring
    const offset = RING_C - (RING_C * pct / 100);
    qcRingFill.style.strokeDashoffset = offset;
    qcRingPct.textContent = pct;

    // Message
    qcMsg.textContent = getTodayMessage(done, total, missed);

    // List
    qcList.innerHTML = "";

    if (total === 0) {
      qcList.innerHTML = `
        <li class="habits-empty">
          <span class="habits-empty-icon">🌱</span>
          Agrega tu primer hábito para empezar
        </li>`;
      return;
    }

    habits.forEach((hab) => {
      const key = ck(hab.id, today);
      const isChecked = checks[key] === true;
      const isMissed = checks[key] === false;
      const streak = getStreak(hab.id, checks);

      const li = document.createElement("li");
      li.className = "qc-item";
      if (isChecked) li.classList.add("qc-done");
      else if (isMissed) li.classList.add("qc-missed");

      const circle = document.createElement("span");
      circle.className = "qc-check";
      circle.textContent = isChecked ? "✓" : isMissed ? "✗" : "";

      const name = document.createElement("span");
      name.className = "qc-name";
      name.textContent = hab.name;

      li.appendChild(circle);
      li.appendChild(name);

      if (streak > 0) {
        const badge = document.createElement("span");
        badge.className = "qc-badge";
        badge.textContent = getStreakBadge(streak);
        li.appendChild(badge);
      }

      li.addEventListener("click", () => {
        const c = loadChecks();
        let nextState;
        if (c[key] === true) {
          c[key] = false;
          nextState = "missed";
        } else if (c[key] === false) {
          delete c[key];
          nextState = "clear";
        } else {
          c[key] = true;
          nextState = "done";
        }
        saveChecks(c);

        // Sound feedback
        if (nextState === "done") playTick();
        else if (nextState === "missed") playMiss();

        // GSAP animation
        if (window.gsap) {
          if (nextState === "done") {
            gsap.fromTo(li, { scale: 1.06 }, { scale: 1, duration: 0.4, ease: "back.out(1.7)" });
          } else if (nextState === "missed") {
            gsap.fromTo(li, { x: -3 }, { x: 0, duration: 0.3, ease: "elastic.out(1, 0.3)" });
          }
        }

        renderAll();

        // Celebration check
        if (nextState === "done") {
          const updatedChecks = loadChecks();
          let allDone = habits.length > 0;
          habits.forEach((h) => {
            if (updatedChecks[ck(h.id, today)] !== true) allDone = false;
          });
          if (allDone && lastCelebratedDate !== today) {
            lastCelebratedDate = today;
            playCelebrate();
            launchConfetti();
          }
        }
      });

      qcList.appendChild(li);
    });
  }

  /* ---------- render: Analysis ---------- */

  function renderAnalysis(habits, checks, days) {
    const today = todayStr();

    if (habits.length === 0) {
      analysisSectionEl.classList.add("hidden");
      return;
    }
    analysisSectionEl.classList.remove("hidden");

    let weekDone = 0, weekTotal = 0;
    const dayScores = [0, 0, 0, 0, 0, 0, 0];
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];

    days.forEach((d, i) => {
      const dStr = ds(d);
      if (dStr > today) return;
      habits.forEach((hab) => {
        dayTotals[i]++;
        weekTotal++;
        if (checks[ck(hab.id, dStr)] === true) {
          dayScores[i]++;
          weekDone++;
        }
      });
    });

    const consistency = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
    analConsistency.textContent = `${consistency}%`;
    analTotal.textContent = `${weekDone}/${weekTotal}`;

    let bestDayIdx = -1, bestDayRate = -1;
    let worstDayIdx = -1, worstDayRate = 101;
    dayScores.forEach((score, i) => {
      if (dayTotals[i] === 0) return;
      const rate = score / dayTotals[i];
      if (rate > bestDayRate) { bestDayRate = rate; bestDayIdx = i; }
      if (rate < worstDayRate) { worstDayRate = rate; worstDayIdx = i; }
    });
    analBestDay.textContent = bestDayIdx >= 0 ? DAY_NAMES[bestDayIdx] : "—";

    // vs last week
    const lastWeekDays = getWeekDates(weekOffset - 1);
    let lastDone = 0, lastTotal = 0;
    lastWeekDays.forEach((d) => {
      const dStr = ds(d);
      if (dStr > today) return;
      habits.forEach((hab) => {
        lastTotal++;
        if (checks[ck(hab.id, dStr)] === true) lastDone++;
      });
    });

    let vsLastPct = 0;
    if (lastTotal > 0 && weekTotal > 0) {
      const lastRate = lastDone / lastTotal;
      const thisRate = weekDone / weekTotal;
      vsLastPct = Math.round((thisRate - lastRate) * 100);
    }
    if (lastTotal === 0) {
      analVsLast.textContent = "—";
      analVsLast.style.color = "";
    } else if (vsLastPct > 0) {
      analVsLast.textContent = `+${vsLastPct}%`;
      analVsLast.style.color = "var(--green-bright)";
    } else if (vsLastPct < 0) {
      analVsLast.textContent = `${vsLastPct}%`;
      analVsLast.style.color = "#e07a5f";
    } else {
      analVsLast.textContent = "=";
      analVsLast.style.color = "var(--grey)";
    }

    // Per-habit bars
    analysisHabitsEl.innerHTML = "";
    habits.forEach((hab) => {
      let hDone = 0, hTotal = 0;
      days.forEach((d) => {
        const dStr = ds(d);
        if (dStr <= today) {
          hTotal++;
          if (checks[ck(hab.id, dStr)] === true) hDone++;
        }
      });
      const pct = hTotal > 0 ? Math.round((hDone / hTotal) * 100) : 0;

      const row = document.createElement("div");
      row.className = "analysis-habit-row";

      const nameEl = document.createElement("span");
      nameEl.className = "analysis-habit-name";
      nameEl.textContent = hab.name;

      const barWrap = document.createElement("div");
      barWrap.className = "analysis-habit-bar";
      const fill = document.createElement("div");
      fill.className = "analysis-habit-fill";
      fill.style.width = `${pct}%`;
      fill.style.background = pct >= 70 ? "var(--green-bright)" : pct >= 40 ? "#e0b94f" : "#e07a5f";
      barWrap.appendChild(fill);

      const pctEl = document.createElement("span");
      pctEl.className = "analysis-habit-pct";
      pctEl.textContent = `${pct}%`;
      pctEl.style.color = pct >= 70 ? "var(--green-bright)" : pct >= 40 ? "#e0b94f" : "#e07a5f";

      row.appendChild(nameEl);
      row.appendChild(barWrap);
      row.appendChild(pctEl);
      analysisHabitsEl.appendChild(row);
    });

    analysisInsightEl.innerHTML = getWeekInsight(consistency, bestDayIdx, worstDayIdx, vsLastPct, habits, checks, days);
  }

  /* ---------- render: Week header & day columns ---------- */

  function renderWeekHeader(days) {
    const first = days[0];
    const last = days[6];
    const fMonth = MONTH_NAMES[first.getMonth()];
    const lMonth = MONTH_NAMES[last.getMonth()];
    const year = last.getFullYear();
    habitsWeekLabel.textContent = fMonth === lMonth
      ? `${first.getDate()}–${last.getDate()} ${fMonth} ${year}`
      : `${first.getDate()} ${fMonth} – ${last.getDate()} ${lMonth} ${year}`;
  }

  function renderDayColumns(days) {
    habitsDaysEl.innerHTML = "";
    const today = todayStr();
    days.forEach((d, i) => {
      const col = document.createElement("div");
      col.className = "habits-day-col";
      if (ds(d) === today) col.classList.add("is-today");

      const nameEl = document.createElement("span");
      nameEl.className = "habits-day-name";
      nameEl.textContent = DAY_NAMES[i];

      const num = document.createElement("span");
      num.className = "habits-day-num";
      num.textContent = d.getDate();

      col.appendChild(nameEl);
      col.appendChild(num);
      habitsDaysEl.appendChild(col);
    });
  }

  /* ---------- render: Week view (grid inside collapsible) ---------- */

  function renderWeekView(habits, checks, days) {
    renderWeekHeader(days);
    renderDayColumns(days);

    const today = todayStr();
    habitsList.innerHTML = "";

    if (habits.length === 0) {
      habitsList.innerHTML = `
        <li class="habits-empty">
          <span class="habits-empty-icon">🌱</span>
          Agrega tu primer hábito
        </li>`;
      return;
    }

    habits.forEach((habit) => {
      const li = document.createElement("li");
      li.className = "habit-item";

      const streak = getStreak(habit.id, checks);

      let hWeekDone = 0, hWeekTotal = 0;
      days.forEach((d) => {
        const dStr = ds(d);
        if (dStr <= today) {
          hWeekTotal++;
          if (checks[ck(habit.id, dStr)] === true) hWeekDone++;
        }
      });
      const hRate = hWeekTotal > 0 ? Math.round((hWeekDone / hWeekTotal) * 100) : 0;

      const top = document.createElement("div");
      top.className = "habit-top";

      const nameEl = document.createElement("span");
      nameEl.className = "habit-name";
      nameEl.textContent = habit.name;

      const streakEl = document.createElement("span");
      streakEl.className = "habit-streak";
      streakEl.textContent = getStreakBadge(streak);

      const delBtn = document.createElement("button");
      delBtn.className = "habit-delete";
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.title = "Eliminar hábito";
      delBtn.addEventListener("click", () => {
        if (confirm(`¿Eliminar "${habit.name}"?`)) {
          const h = loadHabits().filter((hb) => hb.id !== habit.id);
          saveHabits(h);
          renderAll();
        }
      });

      top.appendChild(nameEl);
      top.appendChild(streakEl);
      top.appendChild(delBtn);

      const checksRow = document.createElement("div");
      checksRow.className = "habit-checks";

      days.forEach((d) => {
        const dStr = ds(d);
        const key = ck(habit.id, dStr);
        const isChecked = checks[key] === true;
        const isMissed = checks[key] === false;
        const isToday = dStr === today;

        const btn = document.createElement("button");
        btn.className = "habit-check";
        btn.type = "button";
        if (isChecked) btn.classList.add("checked");
        else if (isMissed) btn.classList.add("missed");
        if (isToday) btn.classList.add("is-today");

        btn.addEventListener("click", () => {
          const c = loadChecks();
          if (c[key] === true) { c[key] = false; }
          else if (c[key] === false) { delete c[key]; }
          else { c[key] = true; }
          saveChecks(c);
          renderAll();
        });

        checksRow.appendChild(btn);
      });

      const rateWrap = document.createElement("div");
      rateWrap.className = "habit-rate-wrap";

      const rateBar = document.createElement("div");
      rateBar.className = "habit-rate-bar";
      const rateFill = document.createElement("div");
      rateFill.className = "habit-rate-fill";
      rateFill.style.width = `${hRate}%`;
      if (hRate >= 70) rateFill.classList.add("rate-high");
      else if (hRate >= 40) rateFill.classList.add("rate-mid");
      else rateFill.classList.add("rate-low");
      rateBar.appendChild(rateFill);

      const ratePct = document.createElement("span");
      ratePct.className = "habit-rate-pct";
      ratePct.textContent = `${hRate}%`;

      rateWrap.appendChild(rateBar);
      rateWrap.appendChild(ratePct);

      li.appendChild(top);
      li.appendChild(checksRow);
      li.appendChild(rateWrap);
      habitsList.appendChild(li);
    });
  }

  /* ---------- render all ---------- */

  function renderAll() {
    const habits = loadHabits();
    const checks = loadChecks();
    const days = getWeekDates(weekOffset);

    renderQuickCheck(habits, checks);
    renderWeekView(habits, checks, days);
    renderAnalysis(habits, checks, days);
  }

  /* --- add habit --- */

  function addHabit() {
    const name = habitsInput.value.trim();
    if (!name) return;
    const habits = loadHabits();
    habits.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      created: todayStr(),
    });
    saveHabits(habits);
    habitsInput.value = "";
    renderAll();
    habitsInput.focus();
  }

  habitsAddBtn.addEventListener("click", addHabit);
  habitsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addHabit();
  });

  /* --- navigation --- */

  function openHabits() {
    weekOffset = 0;
    renderAll();
    habitsView.setAttribute("aria-hidden", "false");
    content.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "hidden";
  }

  function closeHabits() {
    habitsView.setAttribute("aria-hidden", "true");
    content.removeAttribute("aria-hidden");
    document.body.style.overflow = "";
  }

  btnHabits.addEventListener("click", openHabits);
  btnBack.addEventListener("click", closeHabits);

  weekPrev.addEventListener("click", () => { weekOffset--; renderAll(); });
  weekNext.addEventListener("click", () => {
    if (weekOffset < 0) { weekOffset++; renderAll(); }
  });
})();
