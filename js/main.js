/**
 * HAKURA HEALTH — MAIN JAVASCRIPT ENGINE
 * Full-featured interactive logic: 3D Canvas Body Scanner,
 * Multi-step booking wizard, FAQ search, Language Switcher (PT/EN),
 * Dynamic Pillar tabs, and Nordic theme controller.
 */

// --- Translations Dictionary (PT / EN) ---
const translations = {
  pt: {
    bannerText: "Hakura Health Scan — Experiência médica preventiva em Lisboa & Porto",
    bannerBadge: "Vagas 2026 Abertas",
    navScan: "O Scan",
    navTech: "Tecnologia",
    navPillars: "Biomarcadores",
    navFlow: "Experiência",
    navClinics: "Clínicas",
    navPricing: "Preço",
    navFaq: "FAQ",
    bookBtn: "Agendar Scan",
    memberPortal: "Portal do Membro",
    heroPill: "Medicina Preventiva de Próxima Geração",
    heroTitle: "Antecipe o futuro da sua saúde.<br><span class=\"highlight\">Antes dos sintomas.</span>",
    heroDesc: "Uma avaliação integral de corpo inteiro em 60 minutos com tecnologia ótica 3D, mapeamento de pele de alta definição, sensores cardiovasculares avançados e consulta médica imediata.",
    heroCtaPrimary: "Agendar Hakura Scan • €295",
    heroCtaSecondary: "Conhecer a Tecnologia",
    statData: "50M+",
    statDataLabel: "Pontos de Dados Óticos",
    statTime: "60 min",
    statTimeLabel: "Experiência Completa no Local",
    statDoctors: "100%",
    statDoctorsLabel: "Médicos Especialistas Certificados",
    manifestoSub: "Manifesto Hakura",
    manifestoQuote: "O sistema de saúde tradicional foi desenhado para tratar a doença. A Hakura foi concebida para <em>preservar a sua vitalidade</em>.",
    manifestoAuthor: "— Dr. Duarte Silveira, Diretor Clínico & Co-fundador Hakura",
    bookingModalTitle: "Agende o seu Hakura Scan",
  },
  en: {
    bannerText: "Hakura Health Scan — Preventive clinical experience in Lisbon & Porto",
    bannerBadge: "2026 Slots Open",
    navScan: "The Scan",
    navTech: "Technology",
    navPillars: "Biomarkers",
    navFlow: "Experience",
    navClinics: "Clinics",
    navPricing: "Pricing",
    navFaq: "FAQ",
    bookBtn: "Book Scan",
    memberPortal: "Member Portal",
    heroPill: "Next-Generation Preventive Healthcare",
    heroTitle: "Stay ahead of your health.<br><span class=\"highlight\">Before symptoms appear.</span>",
    heroDesc: "A comprehensive 60-minute full-body assessment combining 3D optical sensors, high-definition skin mapping, advanced cardiovascular metrics, and an immediate clinician consultation.",
    heroCtaPrimary: "Book Hakura Scan • €295",
    heroCtaSecondary: "Explore the Technology",
    statData: "50M+",
    statDataLabel: "Optical Data Points",
    statTime: "60 mins",
    statTimeLabel: "Clinic Door-To-Door Time",
    statDoctors: "100%",
    statDoctorsLabel: "Certified Medical Doctors",
    manifestoSub: "Hakura Manifesto",
    manifestoQuote: "Healthcare was engineered to react to illness. Hakura is designed to <em>preserve lifelong vitality</em>.",
    manifestoAuthor: "— Dr. Duarte Silveira, Chief Medical Officer & Co-founder",
    bookingModalTitle: "Book your Hakura Scan",
  }
};

let currentLang = localStorage.getItem('hakura_lang') || 'pt';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
  initThemeToggle();
  initPointcloudScanner();
  initPillarTabs();
  initBookingModal();
  initFaqAccordion();
  initMobileNav();
  initClinicSwitcher();
});

/* ==========================================================================
   1. POINT-CLOUD 3D CANVAS BODY SCANNER (Neko Health Optical Aesthetic)
   ========================================================================== */
function initPointcloudScanner() {
  const canvas = document.getElementById('scannerCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
    generateBodyPoints();
  });

  const particles = [];
  const pointCount = 750;
  let scanBeamY = 0;
  let scanDirection = 1.8;
  let rotationAngle = 0;
  let activeMode = 'full';

  // Generate anatomical 3D silhouette dots (Head, Torso, Arms, Legs)
  function generateBodyPoints() {
    particles.length = 0;
    const centerX = 0;
    const centerY = 0;

    for (let i = 0; i < pointCount; i++) {
      let x, y, z;
      const zone = Math.random();

      if (zone < 0.12) {
        // Head / Neck
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 24 + Math.random() * 4;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = -140 + r * Math.cos(phi) * 1.2;
        z = r * Math.sin(phi) * Math.sin(theta);
      } else if (zone < 0.50) {
        // Torso / Chest / Core
        const theta = Math.random() * Math.PI * 2;
        const h = Math.random() * 110;
        const rx = 36 + (h < 50 ? 8 : -4) + Math.random() * 6;
        const rz = 24 + Math.random() * 5;
        x = rx * Math.cos(theta);
        y = -95 + h;
        z = rz * Math.sin(theta);
      } else if (zone < 0.72) {
        // Arms
        const side = Math.random() > 0.5 ? 1 : -1;
        const prog = Math.random() * 120;
        x = side * (46 + prog * 0.18 + (Math.random() - 0.5) * 14);
        y = -85 + prog;
        z = (Math.random() - 0.5) * 18;
      } else {
        // Legs
        const side = Math.random() > 0.5 ? 1 : -1;
        const prog = Math.random() * 160;
        x = side * (18 + prog * 0.05 + (Math.random() - 0.5) * 12);
        y = 20 + prog;
        z = (Math.random() - 0.5) * 20;
      }

      particles.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        size: 1.2 + Math.random() * 1.6,
        alpha: 0.3 + Math.random() * 0.7,
        hue: Math.random() > 0.8 ? 'cyan' : 'emerald'
      });
    }
  }

  generateBodyPoints();

  let mouseX = 0;
  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    mouseX = (x / rect.width - 0.5) * 0.03;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    rotationAngle += 0.008 + mouseX;

    // Beam sweep
    scanBeamY += scanDirection;
    if (scanBeamY > height - 30 || scanBeamY < 30) {
      scanDirection *= -1;
    }

    const midX = width / 2;
    const midY = height / 2 + 10;

    // Draw grid rings
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 153, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(midX, midY + 180, 110, 36, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(midX, midY + 180, 150, 48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Render particles with 3D projection
    particles.forEach(p => {
      // Rotation around Y axis
      const cos = Math.cos(rotationAngle);
      const sin = Math.sin(rotationAngle);

      const rotX = p.baseX * cos - p.baseZ * sin;
      const rotZ = p.baseX * sin + p.baseZ * cos;

      // Perspective projection
      const fov = 350;
      const scale = fov / (fov + rotZ);

      const screenX = midX + rotX * scale;
      const screenY = midY + p.baseY * scale;

      // Proximity to scanning laser beam
      const distToBeam = Math.abs(screenY - scanBeamY);
      const isHitByBeam = distToBeam < 28;

      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size * scale * (isHitByBeam ? 1.8 : 1), 0, Math.PI * 2);

      if (isHitByBeam) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00e599';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
        if (p.hue === 'cyan') {
          ctx.fillStyle = `rgba(0, 210, 255, ${p.alpha * scale})`;
        } else {
          ctx.fillStyle = `rgba(0, 229, 153, ${p.alpha * scale})`;
        }
      }

      ctx.fill();
    });

    // Scanner beam highlight line on canvas
    ctx.save();
    const beamGrad = ctx.createLinearGradient(midX - 160, 0, midX + 160, 0);
    beamGrad.addColorStop(0, 'rgba(0, 229, 153, 0)');
    beamGrad.addColorStop(0.5, 'rgba(0, 229, 153, 0.35)');
    beamGrad.addColorStop(1, 'rgba(0, 229, 153, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(midX - 170, scanBeamY - 1, 340, 2);
    ctx.restore();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // Mode switcher inside scanner stage
  const modeBtns = document.querySelectorAll('.scanner-mode-btn');
  const telemetryDisplay = document.getElementById('livePointsCounter');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeMode = btn.dataset.mode;

      if (telemetryDisplay) {
        if (activeMode === 'cardio') {
          telemetryDisplay.innerText = "ECG & PWV ARTERIAL MATRIX: ACTIVE";
        } else if (activeMode === 'derma') {
          telemetryDisplay.innerText = "360° EPIDERMAL CLOUD: 48,220 MOLES MAPPED";
        } else {
          telemetryDisplay.innerText = "53,412,890 DATA POINTS ACQUIRED";
        }
      }
    });
  });

  // Dynamic counter fluctuation
  setInterval(() => {
    if (telemetryDisplay && activeMode === 'full') {
      const base = 53412000;
      const variation = Math.floor(Math.random() * 999);
      telemetryDisplay.innerText = `${(base + variation).toLocaleString()} DATA POINTS ACQUIRED`;
    }
  }, 1200);
}

/* ==========================================================================
   2. PILLAR TABS (Cardiovascular, Dermatology, Blood, Body)
   ========================================================================== */
function initPillarTabs() {
  const tabs = document.querySelectorAll('.pillar-tab-btn');
  const panels = document.querySelectorAll('.pillar-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const activePanel = document.getElementById(`pillar-${target}`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   3. CLINIC SWITCHER (Lisboa / Porto)
   ========================================================================== */
function initClinicSwitcher() {
  const clinicCards = document.querySelectorAll('.clinic-card');
  const visualImage = document.getElementById('clinicShowcaseImg');
  const visualCity = document.getElementById('clinicShowcaseCity');
  const visualAddress = document.getElementById('clinicShowcaseAddress');

  clinicCards.forEach(card => {
    card.addEventListener('click', () => {
      clinicCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const city = card.dataset.city;
      if (city === 'lisboa') {
        if (visualCity) visualCity.textContent = 'Flagship Lisboa — Liberdade';
        if (visualAddress) visualAddress.textContent = 'Avenida da Liberdade 240, 1250-096 Lisboa';
      } else if (city === 'porto') {
        if (visualCity) visualCity.textContent = 'Hakura Sanctuary — Foz do Douro';
        if (visualAddress) visualAddress.textContent = 'Avenida do Brasil 742, 4150-154 Porto';
      }
    });
  });
}

/* ==========================================================================
   4. MULTI-STEP BOOKING WIZARD MODAL
   ========================================================================== */
function initBookingModal() {
  const modal = document.getElementById('bookingModal');
  const openBtns = document.querySelectorAll('[data-trigger="open-booking"]');
  const closeBtn = document.getElementById('closeBookingModal');
  const backdrop = document.getElementById('bookingModalBackdrop');

  const step1 = document.getElementById('bookStep1');
  const step2 = document.getElementById('bookStep2');
  const step3 = document.getElementById('bookStep3');
  const stepSuccess = document.getElementById('bookStepSuccess');

  const btnNext1 = document.getElementById('btnNextToStep2');
  const btnNext2 = document.getElementById('btnNextToStep3');
  const btnConfirm = document.getElementById('btnConfirmBooking');
  const btnBack2 = document.getElementById('btnBackToStep1');
  const btnBack3 = document.getElementById('btnBackToStep2');

  const progressBars = document.querySelectorAll('.modal-step-indicator');

  let bookingState = {
    clinic: 'Lisboa Flagship',
    plan: 'Hakura Scan Avulso (€295)',
    date: '14 Outubro 2026',
    time: '10:30',
    patientName: '',
    patientEmail: '',
    patientPhone: ''
  };

  function openModal() {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  openBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // Esc key closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Step 1: Select Clinic & Service
  const clinicCards = document.querySelectorAll('.booking-clinic-opt');
  clinicCards.forEach(c => {
    c.addEventListener('click', () => {
      clinicCards.forEach(x => x.classList.remove('selected'));
      c.classList.add('selected');
      bookingState.clinic = c.dataset.value;
    });
  });

  const planCards = document.querySelectorAll('.booking-plan-opt');
  planCards.forEach(p => {
    p.addEventListener('click', () => {
      planCards.forEach(x => x.classList.remove('selected'));
      p.classList.add('selected');
      bookingState.plan = p.dataset.value;
    });
  });

  if (btnNext1) {
    btnNext1.addEventListener('click', () => {
      step1.classList.remove('active');
      step2.classList.add('active');
      updateProgress(2);
    });
  }

  if (btnBack2) {
    btnBack2.addEventListener('click', () => {
      step2.classList.remove('active');
      step1.classList.add('active');
      updateProgress(1);
    });
  }

  // Step 2: Date & Slot Selection
  const dateSlots = document.querySelectorAll('.date-slot-btn');
  dateSlots.forEach(d => {
    d.addEventListener('click', () => {
      dateSlots.forEach(x => x.classList.remove('selected'));
      d.classList.add('selected');
      bookingState.date = d.dataset.date;
    });
  });

  const timeSlots = document.querySelectorAll('.time-slot-btn');
  timeSlots.forEach(t => {
    t.addEventListener('click', () => {
      timeSlots.forEach(x => x.classList.remove('selected'));
      t.classList.add('selected');
      bookingState.time = t.dataset.time;
    });
  });

  if (btnNext2) {
    btnNext2.addEventListener('click', () => {
      step2.classList.remove('active');
      step3.classList.add('active');
      updateProgress(3);

      // Populate summary
      const sumSummary = document.getElementById('bookingSummaryText');
      if (sumSummary) {
        sumSummary.innerHTML = `<strong>${bookingState.plan}</strong><br>${bookingState.clinic} • ${bookingState.date} às ${bookingState.time}`;
      }
    });
  }

  if (btnBack3) {
    btnBack3.addEventListener('click', () => {
      step3.classList.remove('active');
      step2.classList.add('active');
      updateProgress(2);
    });
  }

  // Step 3: Confirmation
  if (btnConfirm) {
    btnConfirm.addEventListener('click', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('patientName');
      const emailInput = document.getElementById('patientEmail');

      if (!nameInput.value || !emailInput.value) {
        alert(currentLang === 'pt' ? 'Por favor preencha o seu nome e email.' : 'Please enter your name and email address.');
        return;
      }

      bookingState.patientName = nameInput.value;
      bookingState.patientEmail = emailInput.value;

      step3.classList.remove('active');
      stepSuccess.classList.add('active');
      updateProgress(4);

      const refNumber = 'HKR-' + Math.floor(100000 + Math.random() * 900000);
      const refSpan = document.getElementById('bookingRefCode');
      if (refSpan) refSpan.textContent = refNumber;
    });
  }

  function updateProgress(stepNum) {
    progressBars.forEach((bar, idx) => {
      if (idx < stepNum) {
        bar.classList.add('active');
      } else {
        bar.classList.remove('active');
      }
    });
  }
}

/* ==========================================================================
   5. FAQ ACCORDION WITH LIVE SEARCH
   ========================================================================== */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  const searchInput = document.getElementById('faqSearchInput');

  items.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close all other items
      items.forEach(other => other.classList.remove('active'));

      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();

      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(q)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
}

/* ==========================================================================
   6. BILINGUAL LANGUAGE SWITCHER (PT / EN)
   ========================================================================== */
function initLanguageSwitcher() {
  const ptBtns = document.querySelectorAll('[data-lang="pt"]');
  const enBtns = document.querySelectorAll('[data-lang="en"]');

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('hakura_lang', lang);

    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-lang="${lang}"]`).forEach(b => b.classList.add('active'));

    const dict = translations[lang];
    if (!dict) return;

    // Update data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });
  }

  ptBtns.forEach(b => b.addEventListener('click', () => setLanguage('pt')));
  enBtns.forEach(b => b.addEventListener('click', () => setLanguage('en')));

  setLanguage(currentLang);
}

/* ==========================================================================
   7. THEME CONTROLLER (Dark / Light Nordic Sanctuary)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const currentTheme = localStorage.getItem('hakura_theme') || 'dark';

  document.documentElement.setAttribute('data-theme', currentTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme');
      const next = active === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('hakura_theme', next);
    });
  }
}

/* ==========================================================================
   8. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.position = 'absolute';
        navLinks.style.top = '72px';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.flexDirection = 'column';
        navLinks.style.background = 'var(--bg-surface)';
        navLinks.style.padding = '24px';
        navLinks.style.borderBottom = '1px solid var(--border-medium)';
      }
    });
  }
}
