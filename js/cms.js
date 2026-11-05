/**
 * HAKURA × kibanCMS — conteúdos geridos no CMS, lidos no browser.
 *
 * Collections usadas (ver cms/README.md):
 *   equipa, especialidades, pilares, testemunhos, contactos
 *
 * O HTML estático do index.html continua a ser a versão de reserva:
 * se o CMS não estiver configurado, estiver em baixo, devolver erro ou uma
 * collection estiver vazia, essa parte do site fica exatamente como está.
 *
 * Configuração (variáveis Vite — ver .env.example):
 *   VITE_KIBAN_API_URL   ex.: https://kiban.pt/api/v1
 *   VITE_KIBAN_TENANT    ex.: hakura   (enviado no header X-Tenant)
 *   VITE_KIBAN_API_KEY   API key de um utilizador com role "viewer" (só leitura).
 *                        NUNCA usar a key de um admin/editor: fica pública no site.
 */

const API_URL = (import.meta.env.VITE_KIBAN_API_URL || '').replace(/\/+$/, '');
const TENANT = import.meta.env.VITE_KIBAN_TENANT || '';
const API_KEY = import.meta.env.VITE_KIBAN_API_KEY || '';

// Testimonials: the standard kibanCMS "testimonials" collection is preferred;
// "testemunhos" (created by scripts/kiban-seed.mjs) is the fallback.
const COLLECTIONS = ['equipa', 'especialidades', 'pilares', 'testimonials', 'testemunhos', 'contactos'];
const PILLAR_KEYS = ['medical', 'spa', 'holistic', 'aesthetic'];
const CACHE_KEY = 'hakura-cms-v2';
const CACHE_TTL = 10 * 60 * 1000; // 10 min — poupa pedidos (limite da API: 100 / 15 min por IP)
const TIMEOUT = 6000;

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const fieldsOf = (entry) => (entry && entry.content) || {};

const esc = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const lines = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•·]\s*/, '').trim())
    .filter(Boolean);

const byOrder = (a, b) => {
  const oa = Number(fieldsOf(a).ordem);
  const ob = Number(fieldsOf(b).ordem);
  const na = Number.isFinite(oa) ? oa : 9999;
  const nb = Number.isFinite(ob) ? ob : 9999;
  return na - nb || String(a.title || '').localeCompare(String(b.title || ''), 'pt');
};

// kibanCMS image fields store the public URL, optionally with "#fp=x,y" (focal point %)
const image = (url) => {
  const raw = String(url || '');
  const match = raw.match(/#fp=(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/);
  return {
    src: raw.replace(/#.*$/, ''),
    position: match ? `${match[1]}% ${match[2]}%` : '',
  };
};

const isOn = (value) => value !== false && value !== 'false' && value !== 0;

// js/animations.js hides some elements at load (inline opacity:0) and reveals
// only the nodes it observed. Clones made from those nodes inherit the hidden
// state and would never appear — so clones start clean and get the same
// entrance animation here.
const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
let revealObserver = null;
function revealOnScroll(el) {
  el.removeAttribute('style');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
  }
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = `opacity 0.75s ${REVEAL_EASE}, transform 0.75s ${REVEAL_EASE}`;
  revealObserver.observe(el);
}

/* --------------------------------------------------------------------------
   Fetch + cache
   -------------------------------------------------------------------------- */
async function fetchCollection(slug) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const headers = { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' };
    if (TENANT) headers['X-Tenant'] = TENANT;
    const res = await fetch(`${API_URL}/entries/${slug}?status=published&limit=200`, {
      headers,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } finally {
    clearTimeout(timer);
  }
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached && cached.data ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* private mode / storage full — ignore */
  }
}

/* --------------------------------------------------------------------------
   1. Equipa — carrossel do Corpo Clínico
   -------------------------------------------------------------------------- */
function renderTeam(equipa) {
  const visible = equipa.filter((e) => isOn(fieldsOf(e).mostrar_na_equipa)).sort(byOrder);
  if (!visible.length) return;

  const carousel = document.getElementById('hakuraTeamCarouselContent');
  const template = carousel && carousel.querySelector('.hakura-team-slide');
  if (!template) return;
  const track = template.parentElement;

  const slides = visible.map((entry) => {
    const f = fieldsOf(entry);
    const slide = template.cloneNode(true);
    slide.removeAttribute('style');
    const img = slide.querySelector('img');
    if (img) {
      const { src } = image(f.foto);
      img.removeAttribute('style'); // drop GSAP inline transform from the template
      if (src) img.src = src;
      img.alt = entry.title || '';
    }
    const name = slide.querySelector('.team-card-name');
    const spec = slide.querySelector('.team-card-spec');
    const badge = slide.querySelector('.team-card-badge');
    if (name) name.textContent = entry.title || '';
    if (spec) spec.textContent = f.especialidade || '';
    if (badge) badge.textContent = f.cargo || '';
    return slide;
  });

  track.replaceChildren(...slides);
  carousel.scrollLeft = 0;
  carousel.dispatchEvent(new Event('scroll')); // refresh the progress bar

  // Re-apply the subtle parallax used on the static cards
  if (window.gsap && window.ScrollTrigger) {
    track.querySelectorAll('.hakura-team-card-inner img').forEach((img) => {
      window.gsap.to(img, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: img.closest('.hakura-team-slide'), start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }
}

/* --------------------------------------------------------------------------
   2. Pilares + Especialidades (explainer desktop, cartões mobile, painel)
   -------------------------------------------------------------------------- */
function renderPillars(pilares) {
  const drawer = window.hakuraPillarsDrawerData;
  const explainer = window.hakuraPillarsData;
  const mobileCards = document.querySelectorAll('#especialidades .snap-x > .snap-start');

  pilares.forEach((entry) => {
    const f = fieldsOf(entry);
    const key = f.chave;
    const idx = PILLAR_KEYS.indexOf(key);
    if (idx < 0) return;

    if (drawer && drawer[key]) {
      if (entry.title) drawer[key].title = entry.title;
      if (f.etiqueta) drawer[key].badge = f.etiqueta;
      if (f.subtitulo) drawer[key].subtitle = f.subtitulo;
      if (f.descricao) drawer[key].description = f.descricao;
    }

    const slot = Array.isArray(explainer) ? explainer.find((p) => p.key === key) : null;
    if (slot) {
      if (f.destaque_titulo) slot.title = f.destaque_titulo;
      if (f.destaque_descricao) slot.desc = f.destaque_descricao;
      if (f.texto_botao) slot.linkText = f.texto_botao;
    }

    const card = mobileCards[idx];
    if (card) {
      const h3 = card.querySelector('h3');
      const p = card.querySelector('h3 + p');
      if (h3 && f.destaque_titulo) h3.textContent = f.destaque_titulo;
      if (p && f.destaque_descricao) p.textContent = f.destaque_descricao;
    }
  });

  // Refresh the desktop explainer text for the pillar currently on screen
  if (Array.isArray(explainer)) {
    const current = explainer[window.__hakuraCurrentDesktopPillar || 0];
    if (current) {
      const title = document.getElementById('hakuraExplainerTitle');
      const desc = document.getElementById('hakuraExplainerDesc');
      const link = document.getElementById('hakuraExplainerLinkText');
      if (title) title.textContent = current.title;
      if (desc) desc.textContent = current.desc;
      if (link) link.textContent = current.linkText;
    }
  }
}

function renderSpecialties(especialidades, equipa) {
  const drawer = window.hakuraPillarsDrawerData;
  if (!drawer) return;
  const people = new Map(equipa.map((e) => [e.id, e]));

  PILLAR_KEYS.forEach((key) => {
    const items = especialidades.filter((e) => fieldsOf(e).pilar === key).sort(byOrder);
    if (!items.length || !drawer[key]) return; // keep the static list for this pillar

    // The panel renders these through innerHTML → escape every string here
    drawer[key].specialties = items.map((entry) => {
      const f = fieldsOf(entry);
      const person = people.get(f.profissional);
      const pf = fieldsOf(person);
      return {
        name: esc(entry.title),
        desc: esc(f.descricao),
        bullets: lines(f.pontos).map(esc),
        doctor: person
          ? {
              name: esc(person.title),
              role: esc(pf.cargo),
              spec: esc(pf.especialidade),
              avatar: esc(image(pf.foto).src),
              bio: esc(pf.bio),
            }
          : null,
      };
    });
  });
}

/* --------------------------------------------------------------------------
   3. Testemunhos
   -------------------------------------------------------------------------- */
const isTrue = (value) => value === true || String(value).toLowerCase() === 'true';

// Standard "testimonials" collection → same shape as "testemunhos"
// (author_name, testimonial, rating, author_role, featured). Featured first,
// then newest first. Empty author_role keeps the current "Avaliação Google".
function fromStandardTestimonials(entries) {
  return entries
    .filter((e) => fieldsOf(e).testimonial)
    .sort((a, b) =>
      Number(isTrue(fieldsOf(b).featured)) - Number(isTrue(fieldsOf(a).featured)) ||
      String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map((e, i) => {
      const f = fieldsOf(e);
      return {
        title: f.author_name || e.title || '',
        content: { texto: f.testimonial, origem: f.author_role || 'Avaliação Google', estrelas: f.rating, ordem: i + 1 },
      };
    });
}

function pickTestimonials(data) {
  const standard = fromStandardTestimonials(data.testimonials || []);
  if (standard.length) return { list: standard, source: 'testimonials' };
  return { list: data.testemunhos || [], source: 'testemunhos' };
}

function renderTestimonials(testemunhos, source) {
  const list = testemunhos.slice().sort(byOrder);
  if (!list.length) return;
  const section = document.querySelector('section[data-slicetype="ratings"]');
  const template = section && section.querySelector('figure');
  if (!template) return;

  const figures = list.map((entry) => {
    const f = fieldsOf(entry);
    const stars = Math.max(1, Math.min(5, Math.round(Number(f.estrelas) || 5)));
    const fig = template.cloneNode(true);
    fig.removeAttribute('style'); // drop the inherited hidden state (see revealOnScroll)
    const quote = fig.querySelector('blockquote p');
    const starsEl = fig.querySelector('[aria-hidden="true"].tracking-\\[2px\\]') || fig.querySelector('figcaption span[aria-hidden="true"]');
    const srOnly = fig.querySelector('.sr-only');
    const name = fig.querySelector('figcaption .font-semibold');
    const origin = fig.querySelector('figcaption .text-slate-500');
    if (quote) quote.textContent = f.texto || '';
    if (starsEl) starsEl.textContent = '★'.repeat(stars);
    if (srOnly) srOnly.textContent = `Avaliação de ${stars} em 5 estrelas`;
    if (name) name.textContent = entry.title || '';
    if (origin) {
      if (f.origem) origin.textContent = f.origem;
      else {
        // no source → drop it and the "·" separator before it
        const dot = origin.previousElementSibling;
        if (dot && dot.textContent.trim() === '·') dot.remove();
        origin.remove();
      }
    }
    return fig;
  });
  template.parentElement.replaceChildren(...figures);
  figures.forEach(revealOnScroll);
  if (section) section.dataset.cmsSource = source || 'testemunhos';
}

/* --------------------------------------------------------------------------
   4. Contactos e horário (rodapé, gaveta de contactos, menu, barra mobile)
   -------------------------------------------------------------------------- */
// Values currently in the DOM (start with the static HTML; updated after each apply)
let shownContacts = {
  telefone: '+351 964 166 845',
  telefone_nota: '(Chamada para a rede móvel nacional)',
  email: 'geral@hakura.pt',
  horario: ['Segunda a Sexta: 09h00 – 19h00', 'Sábado e Domingo: Encerrado'],
};

// The privacy policy keeps its own (legal) contacts — never touch it
const OUTSIDE_PRIVACY = (el) => !el.closest('#hakuraPrivacyDialog');

function replaceText(oldText, newText) {
  if (!oldText || !newText || oldText === newText) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement && OUTSIDE_PRIVACY(node.parentElement) && !node.parentElement.closest('script, style')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const hits = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.includes(oldText)) hits.push(walker.currentNode);
  hits.forEach((node) => { node.nodeValue = node.nodeValue.split(oldText).join(newText); });
}

function renderContacts(contactos) {
  const entry = contactos.find((e) => e.slug === 'geral') || contactos[0];
  if (!entry) return;
  const f = fieldsOf(entry);
  const next = {
    telefone: (f.telefone || '').trim() || shownContacts.telefone,
    telefone_nota: (f.telefone_nota || '').trim() || shownContacts.telefone_nota,
    email: (f.email || '').trim() || shownContacts.email,
    horario: lines(f.horario).length ? lines(f.horario) : shownContacts.horario,
  };

  // Phone
  const telHref = 'tel:' + next.telefone.replace(/[^\d+]/g, '');
  document.querySelectorAll('a[href^="tel:"]').forEach((a) => { if (OUTSIDE_PRIVACY(a)) a.setAttribute('href', telHref); });
  replaceText(shownContacts.telefone, next.telefone);
  replaceText(shownContacts.telefone_nota, next.telefone_nota);

  // Email
  document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    if (OUTSIDE_PRIVACY(a) && a.getAttribute('href') === `mailto:${shownContacts.email}`) a.setAttribute('href', `mailto:${next.email}`);
  });
  replaceText(shownContacts.email, next.email);

  // Opening hours (one line per row; the layout shows the first two)
  shownContacts.horario.forEach((oldLine, i) => { if (next.horario[i]) replaceText(oldLine, next.horario[i]); });

  // Address + Google Maps
  const address = lines(f.morada);
  document.querySelectorAll('.hakura-map-link').forEach((link) => {
    if (f.google_maps_url) link.setAttribute('href', f.google_maps_url);
    const label = link.querySelector('.hakura-map-link__address');
    if (label && address.length) label.innerHTML = address.map(esc).join('<br>');
  });

  // WhatsApp (bottom bar)
  const wa = String(f.whatsapp || '').replace(/\D/g, '');
  if (wa) {
    document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
      a.setAttribute('href', a.getAttribute('href').replace(/wa\.me\/\d+/, `wa.me/${wa}`));
    });
  }

  shownContacts = next;
}

/* --------------------------------------------------------------------------
   Apply + boot
   -------------------------------------------------------------------------- */
function apply(data) {
  const equipa = data.equipa || [];
  const steps = [
    () => equipa.length && renderTeam(equipa),
    () => (data.pilares || []).length && renderPillars(data.pilares),
    () => (data.especialidades || []).length && renderSpecialties(data.especialidades, equipa),
    () => {
      const { list, source } = pickTestimonials(data);
      if (list.length) renderTestimonials(list, source);
    },
    () => (data.contactos || []).length && renderContacts(data.contactos),
  ];
  steps.forEach((step) => {
    try { step(); } catch (err) { console.warn('[kibanCMS] render error', err); }
  });
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

async function init() {
  if (!API_URL || !API_KEY) return; // CMS not configured → static content stays

  const cached = readCache();
  if (cached) apply(cached.data);
  if (cached && Date.now() - cached.t < CACHE_TTL) return;

  const results = await Promise.allSettled(COLLECTIONS.map(fetchCollection));
  const data = {};
  results.forEach((result, i) => {
    const slug = COLLECTIONS[i];
    if (result.status === 'fulfilled') data[slug] = result.value;
    else {
      console.warn(`[kibanCMS] "${slug}" indisponível:`, result.reason && result.reason.message);
      if (cached && cached.data[slug]) data[slug] = cached.data[slug];
    }
  });
  if (!Object.keys(data).length) return;
  writeCache(data);
  apply(data);
}

// The specialties panel data (window.hakuraPillarsDrawerData) is created by an
// inline DOMContentLoaded handler in index.html, and module scripts run *before*
// DOMContentLoaded — so wait for it, then yield once so that handler has run.
if (window.hakuraPillarsDrawerData || document.readyState === 'complete') {
  init();
} else {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), { once: true });
}
