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

  /* ========== CLIENTES SYSTEM ========== */

  class ClientesSystem {
    constructor() {
      this.clientes = this.loadClientes();
      this.horarios = this.loadHorarios();
      this.estadisticas = this.loadEstadisticas();
      this.ideas = this.loadIdeas();
      this.rodajes = this.loadRodajes();
      this.init();
    }

    init() {
      this.setupTabNavigation();
      this.setupClienteTabNavigation();
      this.setupAddClienteButton();
      this.render();
    }

    setupTabNavigation() {
      const tabBtns = document.querySelectorAll(".tab-btn");
      const tabContents = document.querySelectorAll(".tab-content");

      tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const tabName = btn.dataset.tab;
          tabBtns.forEach((b) => b.classList.remove("tab-btn--active"));
          tabContents.forEach((c) => c.classList.remove("tab-content--active"));
          btn.classList.add("tab-btn--active");
          document.getElementById(`tab-${tabName}`).classList.add("tab-content--active");
        });
      });
    }

    setupClienteTabNavigation() {
      const clienteBtns = document.querySelectorAll(".cliente-tab-btn");
      const clienteContents = document.querySelectorAll(".cliente-content");

      clienteBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const tabName = btn.dataset.clienteTab;
          clienteBtns.forEach((b) => b.classList.remove("cliente-tab-btn--active"));
          clienteContents.forEach((c) => c.classList.remove("cliente-content--active"));
          btn.classList.add("cliente-tab-btn--active");
          document.getElementById(`cliente-${tabName}`).classList.add("cliente-content--active");
        });
      });
    }

    setupAddClienteButton() {
      document.getElementById("btnAddCliente").addEventListener("click", () => {
        this.showClienteModal();
      });
    }

    showClienteModal(clienteId = null) {
      const cliente = clienteId ? this.clientes.find((c) => c.id === clienteId) : null;
      const modalHTML = `
        <div class="modal modal--active">
          <div class="modal-content">
            <div class="modal-header">
              <h2>${cliente ? "Editar Cliente" : "Nuevo Cliente"}</h2>
              <button class="btn-close">&times;</button>
            </div>
            <form id="formCliente">
              <div class="form-group">
                <label>Nombre del Cliente</label>
                <input type="text" id="inputNombre" value="${cliente?.nombre || ""}" required>
              </div>
              <div class="form-group">
                <label>Tipo de Contenido</label>
                <select id="inputTipo">
                  <option value="ideas" ${cliente?.tipo === "ideas" ? "selected" : ""}>Ideas Sueltas</option>
                  <option value="rodajes" ${cliente?.tipo === "rodajes" ? "selected" : ""}>Rodajes</option>
                </select>
              </div>
              <div class="form-group">
                <label>Marca Personal</label>
                <input type="text" id="inputMarca" value="${cliente?.marca || ""}" placeholder="ej: @branntt">
              </div>
              <div class="form-group">
                <label>Notas de Cobros</label>
                <textarea id="inputNotas">${cliente?.notas || ""}</textarea>
              </div>
              <button type="submit" class="btn-primary">${cliente ? "Guardar Cambios" : "Crear Cliente"}</button>
            </form>
          </div>
        </div>
      `;

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = modalHTML;
      const modal = tempDiv.querySelector(".modal");

      modal.querySelector(".btn-close").addEventListener("click", () => {
        modal.remove();
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
      });

      modal.querySelector("#formCliente").addEventListener("submit", (e) => {
        e.preventDefault();
        const nombre = document.getElementById("inputNombre").value;
        const tipo = document.getElementById("inputTipo").value;
        const marca = document.getElementById("inputMarca").value;
        const notas = document.getElementById("inputNotas").value;

        if (cliente) {
          Object.assign(cliente, { nombre, tipo, marca, notas });
        } else {
          this.clientes.push({
            id: Date.now(),
            nombre,
            tipo,
            marca,
            notas,
            createdAt: new Date().toISOString(),
          });
        }

        this.saveClientes();
        modal.remove();
        this.render();
      });

      document.body.appendChild(modal);
    }

    deleteCliente(clienteId) {
      if (confirm("¿Eliminar este cliente?")) {
        this.clientes = this.clientes.filter((c) => c.id !== clienteId);
        this.saveClientes();
        this.render();
      }
    }

    render() {
      this.renderClientesList();
      this.renderIdeas();
      this.renderRodajes();
      this.renderHorario();
      this.renderEstadisticas();
    }

    renderClientesList() {
      const list = document.getElementById("clientesList");
      list.innerHTML = this.clientes.map((cliente) => `
        <div class="cliente-card">
          <div class="cliente-info">
            <h4>${cliente.nombre}</h4>
            <p>${cliente.tipo === "ideas" ? "Ideas Sueltas" : "Rodajes"} • ${cliente.marca || "Sin marca"}</p>
          </div>
          <div class="cliente-actions">
            <button class="btn-small" title="Editar" onclick="window.clientesSystem.showClienteModal(${cliente.id})">✏️</button>
            <button class="btn-small" title="Eliminar" onclick="window.clientesSystem.deleteCliente(${cliente.id})">🗑️</button>
          </div>
        </div>
      `).join("");

      if (this.clientes.length === 0) {
        list.innerHTML = '<p class="empty-state">No hay clientes. Haz clic en <strong>+</strong> para agregar.</p>';
      }
    }

    renderIdeas() {
      const list = document.getElementById("ideasList");
      const ideas = this.clientes.filter((c) => c.tipo === "ideas");
      list.innerHTML = ideas.map((cliente) => `
        <div class="cliente-card">
          <div class="cliente-info">
            <h4>${cliente.nombre}</h4>
            <p>${cliente.marca || "Sin marca"}</p>
          </div>
        </div>
      `).join("");

      if (ideas.length === 0) {
        list.innerHTML = '<p class="empty-state">No hay clientes con Ideas Sueltas</p>';
      }
    }

    renderRodajes() {
      const list = document.getElementById("rodajesList");
      const rodajes = this.clientes.filter((c) => c.tipo === "rodajes");
      list.innerHTML = rodajes.map((cliente) => `
        <div class="cliente-card">
          <div class="cliente-info">
            <h4>${cliente.nombre}</h4>
            <p>${cliente.marca || "Sin marca"}</p>
          </div>
        </div>
      `).join("");

      if (rodajes.length === 0) {
        list.innerHTML = '<p class="empty-state">No hay clientes con Rodajes</p>';
      }
    }

    renderHorario() {
      const grid = document.getElementById("horarioGrid");
      const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

      grid.innerHTML = dias.map((dia, idx) => {
        const horario = this.horarios[dia] || { hora: "12:00", formato: "Reel" };
        return `
          <div class="horario-item">
            <label>${dia}</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <input type="time" value="${horario.hora}" onchange="window.clientesSystem.updateHorario('${dia}', 'hora', this.value)">
              <input type="text" value="${horario.formato}" placeholder="Formato" onchange="window.clientesSystem.updateHorario('${dia}', 'formato', this.value)">
            </div>
          </div>
        `;
      }).join("");
    }

    updateHorario(dia, campo, valor) {
      if (!this.horarios[dia]) {
        this.horarios[dia] = { hora: "12:00", formato: "Reel" };
      }
      this.horarios[dia][campo] = valor;
      this.saveHorarios();
    }

    renderEstadisticas() {
      const grid = document.getElementById("estadisticasGrid");

      grid.innerHTML = this.clientes.map((cliente) => {
        const stats = this.estadisticas[cliente.id] || {
          beneficio: 50,
          rango: 0,
          engagement: 50,
          alcance: 50,
          crecimiento: 50,
          rentabilidad: 50,
        };

        return `
          <div class="estadistica-item">
            <div class="estadistica-header">
              <h4>${cliente.nombre}</h4>
              <span class="estadistica-valor">$${stats.beneficio}</span>
            </div>

            <div style="display: grid; gap: 12px; margin-top: 12px;">
              <div class="slider-container">
                <label class="slider-label">Beneficio</label>
                <input type="range" min="0" max="500" value="${stats.beneficio}" onchange="window.clientesSystem.updateEstadistica(${cliente.id}, 'beneficio', this.value)">
              </div>

              <div class="slider-container">
                <label class="slider-label">Rango</label>
                <input type="range" min="0" max="100" value="${stats.rango}" onchange="window.clientesSystem.updateEstadistica(${cliente.id}, 'rango', this.value)">
              </div>

              <div class="slider-container">
                <label class="slider-label">Engagement</label>
                <input type="range" min="0" max="100" value="${stats.engagement}" onchange="window.clientesSystem.updateEstadistica(${cliente.id}, 'engagement', this.value)">
              </div>

              <div class="slider-container">
                <label class="slider-label">Alcance</label>
                <input type="range" min="0" max="100" value="${stats.alcance}" onchange="window.clientesSystem.updateEstadistica(${cliente.id}, 'alcance', this.value)">
              </div>

              <div class="slider-container">
                <label class="slider-label">Crecimiento</label>
                <input type="range" min="0" max="100" value="${stats.crecimiento}" onchange="window.clientesSystem.updateEstadistica(${cliente.id}, 'crecimiento', this.value)">
              </div>

              <div class="slider-container">
                <label class="slider-label">Rentabilidad</label>
                <input type="range" min="0" max="100" value="${stats.rentabilidad}" onchange="window.clientesSystem.updateEstadistica(${cliente.id}, 'rentabilidad', this.value)">
              </div>
            </div>
          </div>
        `;
      }).join("");

      if (this.clientes.length === 0) {
        grid.innerHTML = '<p class="empty-state">Crea clientes para ver estadísticas</p>';
      }
    }

    updateEstadistica(clienteId, campo, valor) {
      if (!this.estadisticas[clienteId]) {
        this.estadisticas[clienteId] = {
          beneficio: 50,
          rango: 0,
          engagement: 50,
          alcance: 50,
          crecimiento: 50,
          rentabilidad: 50,
        };
      }
      this.estadisticas[clienteId][campo] = parseInt(valor);
      this.saveEstadisticas();
      this.renderEstadisticas();
    }

    /* ========== LocalStorage ========== */

    loadClientes() {
      return JSON.parse(localStorage.getItem("bacu_clientes") || "[]");
    }

    saveClientes() {
      localStorage.setItem("bacu_clientes", JSON.stringify(this.clientes));
    }

    loadHorarios() {
      return JSON.parse(localStorage.getItem("bacu_horarios") || "{}");
    }

    saveHorarios() {
      localStorage.setItem("bacu_horarios", JSON.stringify(this.horarios));
    }

    loadEstadisticas() {
      return JSON.parse(localStorage.getItem("bacu_estadisticas") || "{}");
    }

    saveEstadisticas() {
      localStorage.setItem("bacu_estadisticas", JSON.stringify(this.estadisticas));
    }

    loadIdeas() {
      return JSON.parse(localStorage.getItem("bacu_ideas") || "[]");
    }

    loadRodajes() {
      return JSON.parse(localStorage.getItem("bacu_rodajes") || "[]");
    }
  }

  // Initialize Clientes System
  window.clientesSystem = new ClientesSystem();
})();
