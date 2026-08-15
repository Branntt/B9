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

  /* ---------- subtle audio chime (synthesized, no asset needed) ---------- */

  let audioCtx = null;
  let audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioUnlocked = true;
    } catch (e) { /* audio unavailable, silently skip */ }
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
      // slow organic blink
      .to(eyeWrap, { scaleY: 0.08, duration: 0.16, ease: "power1.in" }, "+=0.5")
      .to(eyeWrap, { scaleY: 1, duration: 0.28, ease: "power2.out" })
      .to(introText, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.1")
      .to({}, { duration: 0.9 }); // hold before dismiss
  }

  function skipIntro() {
    gsap.killTweensOf([eyeWrap, introText, intro]);
    intro.style.display = "none";
    revealContent();
  }

  /* ---------- idle blink loop for the persistent header eye ---------- */

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
      // occasionally do a quick double-blink for a wink-like feel
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

  const habitsView = document.getElementById("habits-view");
  const btnHabits = document.getElementById("btn-habits");
  const btnBack = document.getElementById("habits-back");
  const habitsWeekLabel = document.getElementById("habits-week");
  const habitsDaysEl = document.getElementById("habits-days");
  const habitsList = document.getElementById("habits-list");
  const habitsInput = document.getElementById("habits-input");
  const habitsAddBtn = document.getElementById("habits-add-btn");
  const progressFill = document.getElementById("habits-progress-fill");
  const progressText = document.getElementById("habits-progress-text");
  const weekPrev = document.getElementById("week-prev");
  const weekNext = document.getElementById("week-next");

  // Today focus elements
  const todayDateEl = document.getElementById("today-date");
  const statDoneEl = document.getElementById("stat-done");
  const statPendingEl = document.getElementById("stat-pending");
  const statMissedEl = document.getElementById("stat-missed");
  const todayMsgEl = document.getElementById("today-msg");
  const todayFocusEl = document.getElementById("today-focus");

  // Analysis elements
  const analysisSectionEl = document.getElementById("analysis-section");
  const analConsistency = document.getElementById("anal-consistency");
  const analBestDay = document.getElementById("anal-best-day");
  const analTotal = document.getElementById("anal-total");
  const analVsLast = document.getElementById("anal-vs-last");
  const analysisHabitsEl = document.getElementById("analysis-habits");
  const analysisInsightEl = document.getElementById("analysis-insight");

  const DAY_NAMES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
  const DAY_NAMES_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const MONTH_NAMES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const MONTH_NAMES_FULL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  let weekOffset = 0;

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

  function ck(habitId, ds) {
    return `${habitId}::${ds}`;
  }

  function ds(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function todayStr() { return ds(new Date()); }

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

  /* --- motivational messages --- */

  function getTodayMessage(done, total, missed) {
    if (total === 0) return "Agrega hábitos y empieza a construir tu mejor versión 🌱";
    const pct = total > 0 ? done / total : 0;
    if (done === total && total > 0) return "¡Día perfecto! Todos los hábitos cumplidos. Eres imparable 💪🔥";
    if (pct >= 0.7) return "Vas muy bien hoy, sigue así. La constancia te transforma ⚡";
    if (missed > 0 && done === 0) return "Día difícil, pero aún puedes cambiar la historia. Un hábito a la vez 🌿";
    if (missed > 0) return "Hay hábitos pendientes. Cada uno que completes es una victoria 🎯";
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
      parts.push(`📈 Mejoraste <strong>${vsLastPct}%</strong> respecto a la semana pasada. ¡Sigue creciendo!`);
    } else if (vsLastPct < 0) {
      parts.push(`📉 Bajaste <strong>${Math.abs(vsLastPct)}%</strong> vs la semana pasada. No te castigues: analiza y ajusta.`);
    }

    // Find weakest habit
    if (habits.length > 1) {
      let worstHabit = null;
      let worstRate = 101;
      habits.forEach((h) => {
        let hDone = 0, hTotal = 0;
        const today = todayStr();
        days.forEach((d) => {
          const dStr = ds(d);
          if (dStr <= today) {
            hTotal++;
            if (checks[ck(h.id, dStr)] === true) hDone++;
          }
        });
        const rate = hTotal > 0 ? Math.round((hDone / hTotal) * 100) : 0;
        if (rate < worstRate) { worstRate = rate; worstHabit = h; }
      });
      if (worstHabit && worstRate < 50) {
        parts.push(`💡 <strong>"${worstHabit.name}"</strong> es tu hábito más débil esta semana (${worstRate}%). Enfócate ahí.`);
      }
    }

    return parts.join(" ");
  }

  /* --- render today focus --- */

  function renderTodayFocus(habits, checks) {
    const now = new Date();
    const dayIdx = (now.getDay() + 6) % 7; // 0=Mon
    const today = todayStr();

    todayDateEl.textContent = `${DAY_NAMES_FULL[dayIdx]} ${now.getDate()} de ${MONTH_NAMES_FULL[now.getMonth()]}`;

    if (habits.length === 0) {
      statDoneEl.querySelector(".today-stat-num").textContent = "—";
      statPendingEl.querySelector(".today-stat-num").textContent = "—";
      statMissedEl.querySelector(".today-stat-num").textContent = "—";
      todayMsgEl.textContent = getTodayMessage(0, 0, 0);
      return { done: 0, pending: 0, missed: 0 };
    }

    let done = 0, pending = 0, missed = 0;
    habits.forEach((h) => {
      const key = ck(h.id, today);
      if (checks[key] === true) done++;
      else if (checks[key] === false) missed++;
      else pending++;
    });

    statDoneEl.querySelector(".today-stat-num").textContent = done;
    statPendingEl.querySelector(".today-stat-num").textContent = pending;
    statMissedEl.querySelector(".today-stat-num").textContent = missed;
    todayMsgEl.textContent = getTodayMessage(done, habits.length, missed);

    return { done, pending, missed };
  }

  /* --- render analysis --- */

  function renderAnalysis(habits, checks, days) {
    const today = todayStr();

    if (habits.length === 0) {
      analysisSectionEl.classList.add("hidden");
      return;
    }
    analysisSectionEl.classList.remove("hidden");

    // Weekly stats
    let weekDone = 0, weekTotal = 0;
    const dayScores = [0, 0, 0, 0, 0, 0, 0];
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];

    days.forEach((d, i) => {
      const dStr = ds(d);
      if (dStr > today) return;
      habits.forEach((h) => {
        dayTotals[i]++;
        weekTotal++;
        if (checks[ck(h.id, dStr)] === true) {
          dayScores[i]++;
          weekDone++;
        }
      });
    });

    const consistency = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
    analConsistency.textContent = `${consistency}%`;
    analTotal.textContent = `${weekDone}/${weekTotal}`;

    // Best day
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
      habits.forEach((h) => {
        lastTotal++;
        if (checks[ck(h.id, dStr)] === true) lastDone++;
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
    habits.forEach((h) => {
      let hDone = 0, hTotal = 0;
      days.forEach((d) => {
        const dStr = ds(d);
        if (dStr <= today) {
          hTotal++;
          if (checks[ck(h.id, dStr)] === true) hDone++;
        }
      });
      const pct = hTotal > 0 ? Math.round((hDone / hTotal) * 100) : 0;

      const row = document.createElement("div");
      row.className = "analysis-habit-row";

      const name = document.createElement("span");
      name.className = "analysis-habit-name";
      name.textContent = h.name;

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

      row.appendChild(name);
      row.appendChild(barWrap);
      row.appendChild(pctEl);
      analysisHabitsEl.appendChild(row);
    });

    // Insight
    analysisInsightEl.innerHTML = getWeekInsight(consistency, bestDayIdx, worstDayIdx, vsLastPct, habits, checks, days);
  }

  /* --- render --- */

  function renderWeekHeader(days) {
    const first = days[0];
    const last = days[6];
    const fMonth = MONTH_NAMES[first.getMonth()];
    const lMonth = MONTH_NAMES[last.getMonth()];
    const year = last.getFullYear();

    if (fMonth === lMonth) {
      habitsWeekLabel.textContent = `${first.getDate()}–${last.getDate()} ${fMonth} ${year}`;
    } else {
      habitsWeekLabel.textContent = `${first.getDate()} ${fMonth} – ${last.getDate()} ${lMonth} ${year}`;
    }
  }

  function renderDayColumns(days) {
    habitsDaysEl.innerHTML = "";
    const today = todayStr();
    days.forEach((d, i) => {
      const col = document.createElement("div");
      col.className = "habits-day-col";
      if (ds(d) === today) col.classList.add("is-today");

      const name = document.createElement("span");
      name.className = "habits-day-name";
      name.textContent = DAY_NAMES[i];

      const num = document.createElement("span");
      num.className = "habits-day-num";
      num.textContent = d.getDate();

      col.appendChild(name);
      col.appendChild(num);
      habitsDaysEl.appendChild(col);
    });
  }

  function renderHabits() {
    const habits = loadHabits();
    const checks = loadChecks();
    const days = getWeekDates(weekOffset);
    const today = todayStr();

    renderWeekHeader(days);
    renderDayColumns(days);

    // Today focus (only on current week)
    if (weekOffset === 0) {
      todayFocusEl.style.display = "";
      renderTodayFocus(habits, checks);
    } else {
      todayFocusEl.style.display = "none";
    }

    habitsList.innerHTML = "";

    if (habits.length === 0) {
      habitsList.innerHTML = `
        <li class="habits-empty">
          <span class="habits-empty-icon">🌱</span>
          Agrega tu primer hábito para empezar a trackear tu bienestar
        </li>`;
      progressFill.style.width = "0%";
      progressText.textContent = "0%";
      analysisSectionEl.classList.add("hidden");
      return;
    }

    let totalChecks = 0;
    let totalPossible = 0;

    habits.forEach((habit) => {
      const li = document.createElement("li");
      li.className = "habit-item";

      // count streak
      let streak = 0;
      const streakDate = new Date();
      for (let s = 0; s < 365; s++) {
        const sd = new Date(streakDate);
        sd.setDate(streakDate.getDate() - s);
        const key = ck(habit.id, ds(sd));
        if (checks[key] === true) {
          streak++;
        } else if (s > 0) {
          break;
        }
      }

      // per-habit week rate
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
      streakEl.textContent = streak > 0 ? `🔥 ${streak}d` : "";

      const delBtn = document.createElement("button");
      delBtn.className = "habit-delete";
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.title = "Eliminar hábito";
      delBtn.addEventListener("click", () => {
        if (confirm(`¿Eliminar "${habit.name}"?`)) {
          const h = loadHabits().filter((hb) => hb.id !== habit.id);
          saveHabits(h);
          renderHabits();
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

        if (dStr <= today) {
          totalPossible++;
          if (isChecked) totalChecks++;
        }

        btn.addEventListener("click", () => {
          const c = loadChecks();
          if (c[key] === true) { c[key] = false; }
          else if (c[key] === false) { delete c[key]; }
          else { c[key] = true; }
          saveChecks(c);
          renderHabits();
        });

        checksRow.appendChild(btn);
      });

      // mini completion bar per habit
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

    // update overall progress
    const pct = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${pct}%`;

    // render analysis
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
    renderHabits();
    habitsInput.focus();
  }

  habitsAddBtn.addEventListener("click", addHabit);
  habitsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addHabit();
  });

  /* --- navigation --- */

  function openHabits() {
    weekOffset = 0;
    renderHabits();
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

  weekPrev.addEventListener("click", () => { weekOffset--; renderHabits(); });
  weekNext.addEventListener("click", () => {
    if (weekOffset < 0) { weekOffset++; renderHabits(); }
  });
})();
