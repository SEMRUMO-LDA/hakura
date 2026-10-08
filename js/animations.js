/**
 * HAKURA HEALTH — SCROLL EFFECTS & ANIMATION ENGINE
 * Replicating Neko Health's signature UX/UI motion design:
 * 1. Lenis Smooth Inertia Scrolling
 * 2. Hero Scroll Scale & Border-Radius Morph
 * 3. Sticky 4-Modalities Explainer Runway (Skin -> Heart -> Blood -> Body) with clip-path transitions
 * 4. Infinite Marquee ticker
 * 5. Interactive Clinics Carousel
 * 6. Scroll-triggered Staggered Reveals
 * 7. Compact Frosted Header on Scroll
 */

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initHeroScrollAnimation();
  initStickyExplainerAnimation();
  initMarqueeAnimation();
  initClinicsCarousel();
  initScrollReveals();
  initHeaderScroll();
  initHakuraParticles();
  initBlogCarousel();
  initEditorialParticles();
  initEditorialScrollReveal();
});

/* ==========================================================================
   1. LENIS SMOOTH SCROLL (Buttery Scandinavian Inertia)
   ========================================================================== */
let lenisInstance = null;

function initSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Smooth scroll for anchor navigation links (e.g., #especialidades, #equipa, #contactos)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const hash = anchor.getAttribute('href');
      if (hash && hash.length > 1 && hash !== '#scan') {
        const targetEl = document.querySelector(hash);
        if (targetEl) {
          e.preventDefault();
          const headerOffset = 84;
          const targetY = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;
          if (lenisInstance) {
            lenisInstance.scrollTo(targetY, { duration: 1.2 });
          } else {
            window.scrollTo({ top: targetY, behavior: 'smooth' });
          }
        }
      }
    });
  });
}

/* ==========================================================================
   2. HERO SCROLL SCALE & BORDER-RADIUS MORPH
   ========================================================================== */
function initHeroScrollAnimation() {
  const heroSection = document.querySelector('section[data-slicetype="mainHero"]');
  if (!heroSection) return;

  // The outer background asset container - KEEP AT FULL BACKGROUND TOTAL
  const heroMedia = heroSection.querySelector('.pointer-events-none.absolute.inset-0.z-0');
  const heroTextContainer = heroSection.querySelector('.xpad.absolute.inset-x-0.top-0');

  function updateHero() {
    const scrollY = window.scrollY;
    const progress = Math.min(1, Math.max(0, scrollY / (window.innerHeight * 0.75)));

    if (heroMedia) {
      // Award-winning smooth scroll inset into rounded floating card
      const inset = progress * 24; // 0px to 24px inset
      const radius = progress * 32; // 0px to 32px rounded corners
      heroMedia.style.left = `${inset}px`;
      heroMedia.style.right = `${inset}px`;
      heroMedia.style.top = `${inset}px`;
      heroMedia.style.bottom = `${inset}px`;
      heroMedia.style.borderRadius = `${radius}px`;
      heroMedia.style.overflow = 'hidden';
      if (progress > 0.05) {
        heroMedia.style.boxShadow = `0 ${progress * 25}px ${progress * 50}px -12px rgba(0, 0, 0, ${progress * 0.35})`;
      } else {
        heroMedia.style.boxShadow = 'none';
      }
    }

    if (heroTextContainer) {
      const textOpacity = Math.max(0, 1 - progress * 1.6);
      const textTranslateY = -progress * 60;
      heroTextContainer.style.opacity = textOpacity;
      heroTextContainer.style.transform = `translateY(${textTranslateY}px)`;
    }
  }

  window.addEventListener('scroll', updateHero, { passive: true });
  updateHero();
}

/* ==========================================================================
   3. STICKY 4-MODALITIES EXPLAINER RUNWAY (Skin -> Heart -> Blood -> Body)
   ========================================================================== */
function initStickyExplainerAnimation() {
  const explainerSection = document.querySelector('section[data-slicetype="scanProductExplainer"]');
  if (!explainerSection) return;

  const desktopContainer = explainerSection.querySelector('.hidden.md\\:block');
  if (!desktopContainer) return;

  // The 4 asset layers (z-index 1, 2, 3, 4)
  const assetLayers = desktopContainer.querySelectorAll('.focus-clip-asset-rest');
  
  // The tab buttons
  const tabButtons = desktopContainer.querySelectorAll('button[data-tab], .sticky button');

  // The text wrappers inside col-[7/12]
  const textContainer = desktopContainer.querySelector('.col-span-full.md\\:col-\\[7\\/12\\]');
  let textSlides = [];
  if (textContainer) {
    // Find each distinct heading block
    textSlides = Array.from(textContainer.children);
  }

  // Find the runway scroll progress
  function updateExplainer() {
    const rect = explainerSection.getBoundingClientRect();
    const runwayHeight = explainerSection.offsetHeight - window.innerHeight;
    if (runwayHeight <= 0) return;

    // Progress from 0 to 1
    const progress = Math.max(0, Math.min(1, -rect.top / runwayHeight));

    // Determine active phase (0: skin, 1: heart, 2: blood, 3: body)
    const phaseFloat = progress * 3; // 0 to 3
    const activeIndex = Math.min(3, Math.floor(phaseFloat + 0.15));

    // 1. Update Asset layers clip-paths
    assetLayers.forEach((layer, idx) => {
      if (idx === 0) {
        // Base layer always visible
        layer.style.clipPath = 'inset(0 0 0 0)';
        layer.style.opacity = '1';
      } else {
        // Subsequent layers reveal when phase reaches their index
        // idx = 1 reveals between phaseFloat 0.7 and 1.3
        // idx = 2 reveals between phaseFloat 1.7 and 2.3
        // idx = 3 reveals between phaseFloat 2.7 and 3.0
        const layerStart = idx - 0.35;
        const layerEnd = idx + 0.35;
        const layerProgress = Math.max(0, Math.min(1, (phaseFloat - layerStart) / (layerEnd - layerStart)));

        // Unveil from bottom to top
        const clipInsetTop = (1 - layerProgress) * 100;
        layer.style.clipPath = `inset(${clipInsetTop}% 0 0 0)`;
        layer.style.transition = 'clip-path 0.08s ease-out';
      }
    });

    // 2. Update tab buttons highlighting
    tabButtons.forEach((btn, idx) => {
      const isSelected = (idx % 4) === activeIndex;
      if (isSelected) {
        btn.setAttribute('aria-current', 'step');
        btn.style.opacity = '1';
        btn.style.fontWeight = '600';
        btn.style.borderBottom = '2px solid currentColor';
      } else {
        btn.removeAttribute('aria-current');
        btn.style.opacity = '0.4';
        btn.style.fontWeight = '400';
        btn.style.borderBottom = 'none';
      }
    });

    // 3. Update Text Slide Opacity / Content for the 4 Hakura Pillars
    const hakuraPillarsData = [
      {
        title: "Diagnóstico clínico avançado e cardiologia de precisão",
        description: "Monitorização cardiovascular contínua, eletrocardiograma e análises laboratoriais imediatas lideradas por médicos especialistas.",
        buttonText: "Descobrir HAKURA MEDICAL"
      },
      {
        title: "Recuperação profunda, hidroterapia e rituais de bem-estar",
        description: "Terapias de relaxamento celular através da água, massagens terapêuticas e rituais que regeneram o sistema nervoso e restabelecem a harmonia natural.",
        buttonText: "Descobrir HAKURA SPA"
      },
      {
        title: "Medicina integrativa, acupuntura e harmonia global",
        description: "Acupuntura médica, ozonoterapia e planos nutricionais desenhados para restaurar o equilíbrio energético e acelerar a autorregeneração celular.",
        buttonText: "Descobrir HAKURA HOLISTIC"
      },
      {
        title: "Dermatologia de precisão e medicina estética regenerativa",
        description: "Mapeamento cutâneo completo em ultra-alta definição e procedimentos estéticos não-invasivos orientados para a longevidade celular da pele.",
        buttonText: "Descobrir HAKURA AESTHETIC"
      }
    ];

    const activePillar = hakuraPillarsData[activeIndex];
    const textWrapper = desktopContainer.querySelector('.relative.mt-10 .flex.w-full.flex-col');
    if (textWrapper && textWrapper.dataset.currentIndex !== String(activeIndex)) {
      textWrapper.dataset.currentIndex = String(activeIndex);
      textWrapper.style.opacity = '0';
      textWrapper.style.transform = 'translateY(8px)';
      textWrapper.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

      setTimeout(() => {
        const titleEl = textWrapper.querySelector('h2');
        const descEl = textWrapper.querySelector('p');
        const btnTextEl = textWrapper.querySelector('a span:last-child');

        if (titleEl) titleEl.textContent = activePillar.title;
        if (descEl) descEl.textContent = activePillar.description;
        if (btnTextEl) btnTextEl.textContent = activePillar.buttonText;

        textWrapper.style.opacity = '1';
        textWrapper.style.transform = 'translateY(0px)';
      }, 200);
    }
  }

  // Tab click handler to scroll directly to that phase
  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIdx = idx % 4;
      const runwayHeight = explainerSection.offsetHeight - window.innerHeight;
      const targetProgress = targetIdx / 3;
      const targetScroll = explainerSection.offsetTop + targetProgress * runwayHeight;

      if (lenisInstance) {
        lenisInstance.scrollTo(targetScroll, { duration: 1.2 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    });
  });

  window.addEventListener('scroll', updateExplainer, { passive: true });
  updateExplainer();
}

/* ==========================================================================
   4. INFINITE MARQUEE ANIMATION
   ========================================================================== */
function initMarqueeAnimation() {
  const marqueeContainer = document.querySelector('.rfm-marquee-container');
  if (!marqueeContainer) return;

  const marquee = marqueeContainer.querySelector('.rfm-marquee');
  if (!marquee) return;

  // Duplicate child logos to create seamless infinite loop
  const initialChild = marquee.querySelector('.rfm-initial-child-container');
  if (initialChild && !marquee.querySelector('.rfm-clone')) {
    const clone = initialChild.cloneNode(true);
    clone.classList.add('rfm-clone');
    marquee.appendChild(clone);
  }

  marquee.style.display = 'flex';
  marquee.style.width = 'max-content';
  marquee.style.animation = 'marqueeSlide 30s linear infinite';
}

/* ==========================================================================
   5. INTERACTIVE CLINICS CAROUSEL (Where to find us)
   ========================================================================== */
function initClinicsCarousel() {
  const carousel = document.querySelector('[data-slot="carousel"]');
  if (!carousel) return;

  const content = carousel.querySelector('[data-slot="carousel-content"]');
  const nextBtn = carousel.querySelector('button[aria-label="Next slide"], button[aria-label="Next"]');
  const prevBtn = carousel.querySelector('button[aria-label="Previous slide"], button[aria-label="Previous"]');

  if (!content) return;

  const cardWidth = 380;

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      content.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      content.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });
  }

  // Mouse grab & drag support for horizontal inertia
  let isDown = false;
  let startX;
  let scrollLeft;

  content.addEventListener('mousedown', (e) => {
    isDown = true;
    content.style.cursor = 'grabbing';
    startX = e.pageX - content.offsetLeft;
    scrollLeft = content.scrollLeft;
  });

  content.addEventListener('mouseleave', () => {
    isDown = false;
    content.style.cursor = 'grab';
  });

  content.addEventListener('mouseup', () => {
    isDown = false;
    content.style.cursor = 'grab';
  });

  content.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - content.offsetLeft;
    const walk = (x - startX) * 1.6;
    content.scrollLeft = scrollLeft - walk;
  });
}

/* ==========================================================================
   6. SCROLL-TRIGGERED STAGGERED REVEALS
   ========================================================================== */
function initScrollReveals() {
  const elementsToReveal = document.querySelectorAll(`
    section[data-slicetype="scanDataPointsFeatures"] [role="listitem"],
    section[data-slicetype="scanProductExplainer"] [role="listitem"],
    section[data-slicetype="ratings"] figure,
    section[data-slicetype="articleAndText"] .col-span-full,
    h2.font-display:not(#hakuraEditorialHeading)
  `);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  elementsToReveal.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
}

/* ==========================================================================
   7. COMPACT FROSTED HEADER ON SCROLL
   ========================================================================== */
function initHeaderScroll() {
  const header = document.querySelector('header[data-site-header]');
  if (!header) return;

  function updateHeader() {
    if (window.scrollY > 40) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}


/* ==========================================================================
   8. MINIMALIST & ELEGANT HAKURA BLUE PARTICLE BIO-WAVE
   ========================================================================== */
function initHakuraParticles() {
  const canvas = document.getElementById('hakuraBioWavesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width, height;
  let particles = [];
  let animId = null;
  let isVisible = true;

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    width = canvas.width = parent.offsetWidth;
    height = canvas.height = parent.offsetHeight;
    createParticles();
  }

  function createParticles() {
    particles = [];
    const count = Math.min(140, Math.max(60, Math.floor((width * height) / 10000)));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseY: Math.random() * height,
        radius: Math.random() * 2.2 + 1.0,
        color: Math.random() > 0.4 ? 'rgba(55, 156, 183,' : 'rgba(86, 207, 225,',
        alpha: Math.random() * 0.45 + 0.25,
        speed: Math.random() * 0.5 + 0.2,
        amplitude: Math.random() * 24 + 10,
        frequency: Math.random() * 0.008 + 0.004,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseVal: Math.random() * Math.PI
      });
    }
  }

  let time = 0;
  function animate() {
    if (!isVisible) return;
    time += 0.015;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x -= p.speed * 0.45;
      if (p.x < -20) p.x = width + 20;

      p.y = p.baseY + Math.sin(time * 0.8 + p.phase + p.x * p.frequency) * p.amplitude;
      p.pulseVal += p.pulseSpeed;
      const currentAlpha = p.alpha + Math.sin(p.pulseVal) * 0.15;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color} ${Math.max(0.1, currentAlpha)})`;
      ctx.fill();
    }

    animId = requestAnimationFrame(animate);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        if (!animId) animId = requestAnimationFrame(animate);
      } else {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      }
    });
  }, { threshold: 0.05 });

  if (canvas.parentElement) {
    observer.observe(canvas.parentElement);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  animId = requestAnimationFrame(animate);
}

/* ==========================================================================
   9. HAKURA BLOG & WELLNESS CAROUSEL (Neko Health Carousel Motion)
   ========================================================================== */
function initBlogCarousel() {
  const track = document.getElementById('blogCarouselTrack');
  const prevBtn = document.getElementById('blogPrevBtn');
  const nextBtn = document.getElementById('blogNextBtn');
  const indicator = document.getElementById('blogProgressIndicator');

  if (!track) return;

  const scrollAmount = 380;

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  function updateIndicator() {
    if (!indicator) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) {
      indicator.style.width = '100%';
      indicator.style.transform = 'translateX(0%)';
      return;
    }
    const progress = Math.max(0, Math.min(1, track.scrollLeft / maxScroll));
    // Bar width is 30%, travels across 70% of parent track
    const indicatorWidth = 35; // percent
    const travelDistance = 100 - indicatorWidth;
    indicator.style.width = indicatorWidth + '%';
    indicator.style.transform = `translateX(${progress * (100 / indicatorWidth * travelDistance)}%)`;
  }

  track.addEventListener('scroll', updateIndicator, { passive: true });
  updateIndicator();

  // Mouse drag support
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.classList.add('active');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });
}

/* ==========================================================================
   10. ORGANIC FLOATING BLUE DOT PARTICLES (Editorial Background Layer)
   ========================================================================== */
/* ==========================================================================
   10. SOFT & DISCREET ORGANIC BLUE FLOATING PARTICLES (Editorial Background)
   ========================================================================== */
function initEditorialParticles() {
  const canvas = document.getElementById('hakuraEditorialParticlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const section = document.getElementById('sobre') || canvas.parentElement;
  if (!section) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let animId = null;
  let isVisible = false;
  let mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };

  // Subtle Hakura soft blue palette (subtle, airy, clinical wellness)
  const softBluePalettes = [
    { r: 55, g: 156, b: 183 }, // #379cb7
    { r: 85, g: 183, b: 205 }, // #55b7cd
    { r: 120, g: 200, b: 220 }, // #78c8dc
    { r: 42, g: 135, b: 160 }, // #2a87a0
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = section.offsetWidth || window.innerWidth;
    height = section.offsetHeight || 520;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function createParticles() {
    particles = [];
    // Soft, discreet density: ~22 on mobile, ~42 on desktop
    const isMobile = width < 768;
    const count = isMobile ? 22 : 42;

    for (let i = 0; i < count; i++) {
      const palette = softBluePalettes[Math.floor(Math.random() * softBluePalettes.length)];
      // Delicate micro-dot radius (1.0px to 2.2px)
      const radius = Math.random() * 1.2 + 1.0;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        radius: radius,
        color: palette,
        // Whisper-soft discreet opacity (0.10 to 0.26)
        baseAlpha: Math.random() * 0.16 + 0.10,
        pulseSpeed: Math.random() * 0.012 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
        // Slower, calming organic floating waves
        freqX: Math.random() * 0.004 + 0.0015,
        freqY: Math.random() * 0.003 + 0.001,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        ampX: Math.random() * 14 + 6,
        ampY: Math.random() * 10 + 4,
        // Very slow, serene upward suspension
        driftY: -(Math.random() * 0.10 + 0.03),
        driftX: (Math.random() - 0.5) * 0.04,
        dispX: 0,
        dispY: 0,
      });
    }
  }

  section.addEventListener('mousemove', (e) => {
    const rect = section.getBoundingClientRect();
    mouse.targetX = e.clientX - rect.left;
    mouse.targetY = e.clientY - rect.top;
  });

  section.addEventListener('mouseleave', () => {
    mouse.targetX = -9999;
    mouse.targetY = -9999;
  });

  let time = 0;
  function animate() {
    if (!isVisible) return;
    time += 0.012;

    // Smooth subtle mouse easing
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    ctx.clearRect(0, 0, width, height);

    // Subtle faint filaments (barely visible ethereal connections)
    const connectDist = width < 768 ? 50 : 65;
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectDist) {
          const lineAlpha = (1 - dist / connectDist) * 0.05 * Math.min(p1.currentAlpha || 0.18, p2.currentAlpha || 0.18);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(55, 156, 183, ${lineAlpha.toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Update and draw discreet dots
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.baseY += p.driftY;
      p.baseX += p.driftX;

      if (p.baseY < -20) p.baseY = height + 20;
      if (p.baseY > height + 20) p.baseY = -20;
      if (p.baseX < -20) p.baseX = width + 20;
      if (p.baseX > width + 20) p.baseX = -20;

      const waveOffsetX = Math.sin(time * p.freqX * 60 + p.phaseX) * p.ampX;
      const waveOffsetY = Math.cos(time * p.freqY * 60 + p.phaseY) * p.ampY;

      // Soft fluid mouse deflection
      if (mouse.x > -1000) {
        const dmx = (p.baseX + waveOffsetX) - mouse.x;
        const dmy = (p.baseY + waveOffsetY) - mouse.y;
        const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy);
        const maxRepelDist = 110;
        if (mouseDist < maxRepelDist && mouseDist > 0.1) {
          const repelForce = (1 - mouseDist / maxRepelDist) * 12;
          p.dispX += ((dmx / mouseDist) * repelForce - p.dispX) * 0.06;
          p.dispY += ((dmy / mouseDist) * repelForce - p.dispY) * 0.06;
        } else {
          p.dispX *= 0.95;
          p.dispY *= 0.95;
        }
      } else {
        p.dispX *= 0.95;
        p.dispY *= 0.95;
      }

      p.x = p.baseX + waveOffsetX + p.dispX;
      p.y = p.baseY + waveOffsetY + p.dispY;

      // Gentle, subtle breathing opacity
      const pulse = Math.sin(time * p.pulseSpeed * 60 + p.pulsePhase);
      const currentAlpha = Math.max(0.06, Math.min(0.28, p.baseAlpha + pulse * 0.04));
      p.currentAlpha = currentAlpha;

      const { r, g, b } = p.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentAlpha.toFixed(3)})`;
      ctx.fill();
    }

    animId = requestAnimationFrame(animate);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!isVisible) {
          isVisible = true;
          if (!animId) {
            animId = requestAnimationFrame(animate);
          }
        }
      } else {
        isVisible = false;
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      }
    });
  }, { threshold: 0.05, rootMargin: '80px 0px 80px 0px' });

  observer.observe(section);

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  }, { passive: true });

  resize();
  createParticles();
}

/* ==========================================================================
   11. EDITORIAL TEXT SCROLL-FILL TO DARK (Continuous "Encher para Escuro")
   ========================================================================== */
function initEditorialScrollReveal() {
  const section = document.getElementById('sobre');
  const heading = document.getElementById('hakuraEditorialHeading');
  if (!section || !heading) return;

  const words = Array.from(heading.querySelectorAll('.hakura-reveal-word'));
  if (!words.length) return;

  function updateReveal() {
    const rect = heading.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Start filling when top of heading enters bottom 88% of viewport
    // Fully filled when top of heading reaches top 28% of viewport
    const startY = windowH * 0.88;
    const endY = windowH * 0.28;

    const rawProgress = (startY - rect.top) / (startY - endY);
    const progress = Math.max(0, Math.min(1, rawProgress));

    const total = words.length;
    words.forEach((word, idx) => {
      // Continuous word-by-word dark fill calculation
      const wordPos = progress * total;
      let fillPercent = 0;
      if (wordPos >= idx + 1) {
        fillPercent = 100;
      } else if (wordPos <= idx) {
        fillPercent = 0;
      } else {
        fillPercent = Math.round((wordPos - idx) * 100);
      }

      // Smooth progressive fill into dark #0f172a from light #cbd5e1
      word.style.backgroundImage = `linear-gradient(to right, #0f172a ${fillPercent}%, #cbd5e1 ${fillPercent}%)`;
      word.style.webkitBackgroundClip = 'text';
      word.style.backgroundClip = 'text';
      word.style.webkitTextFillColor = 'transparent';
      word.style.opacity = '1';
    });
  }

  window.addEventListener('scroll', updateReveal, { passive: true });
  window.addEventListener('resize', updateReveal, { passive: true });
  if (lenisInstance) {
    lenisInstance.on('scroll', updateReveal);
  }
  // Run on load and after slight layout settling
  updateReveal();
  setTimeout(updateReveal, 300);
}
