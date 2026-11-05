/**
 * HAKURA — "O que sente?" symptom search
 *
 * The visitor describes what hurts or bothers them and gets 1–3 suggested
 * specialties. Everything runs in the browser: the text is never sent to a
 * server (symptoms are health data — no third-party processing needed).
 *
 * Data: the specialties of the 4 pillars (window.hakuraPillarsDrawerData,
 * filled from kibanCMS by js/cms.js) + each specialty's "Sintomas /
 * palavras-chave" field. When the CMS field is empty or the CMS is offline,
 * the built-in list in cms/sintomas.json is used instead.
 */
import FALLBACK_TERMS from '../cms/sintomas.json';

const PILLARS = ['medical', 'spa', 'holistic', 'aesthetic'];
const PILLAR_LABEL = { medical: 'Medical', spa: 'Spa', holistic: 'Holistic', aesthetic: 'Aesthetic' };
const BOOKING_URL = 'https://zappysoftware.com/m/hakura';
const MAX_RESULTS = 3;
const MIN_SCORE = 3;

// Words that carry no meaning for matching ("tenho dor nas costas" → "costas")
const STOP = new Set(`a o as os um uma uns umas de da do das dos em na no nas nos ao aos à às me mim meu minha meus minhas
  te se lhe eu ele ela tenho tem ter estou esta está sinto sentir com sem para pra por que e ou mas muito muita muitos
  muitas pouco pouca já ja há ha dor dores doi doí dói problema problemas algo coisa sempre quando depois desde ando
  bastante tambem também quero preciso gostava gostaria fazer ver ajuda ajudar pos pre`.split(/\s+/).filter(Boolean));

// Safety: show an urgency notice for warning signs
const RED_FLAGS = /\b(peito|aperto no peito|falta de ar|nao consigo respirar|sufoco|desmai|avc|paralisi|perdi a forca|hemorragia|sangra|suicid|matar me|tirar a vida|overdose|convuls)/;

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const slugify = (text) => normalize(text).replace(/\s+/g, '-');

const decode = (html) => {
  const el = document.createElement('textarea');
  el.innerHTML = String(html || '');
  return el.value;
};

const splitTerms = (text) =>
  String(text || '')
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

// "lombares" ~ "lombar", "joelhos" ~ "joelho": shared prefix, min 5 chars
const similar = (a, b) => {
  if (a === b) return true;
  const min = Math.min(a.length, b.length);
  if (min < 4) return false;
  const short = a.length < b.length ? a : b;
  const long = a.length < b.length ? b : a;
  return min >= 5 ? long.startsWith(short.slice(0, Math.max(5, short.length - 1))) : long.startsWith(short) && long.length - short.length <= 2;
};

/* --------------------------------------------------------------------------
   Index of specialties (rebuilt on every open → always uses the latest CMS data)
   -------------------------------------------------------------------------- */
function buildIndex() {
  const data = window.hakuraPillarsDrawerData || {};
  const index = [];
  PILLARS.forEach((pillar) => {
    const list = (data[pillar] && data[pillar].specialties) || [];
    list.forEach((item, position) => {
      const name = decode(item.name);
      const slug = item.slug || `${pillar}-${slugify(name)}`;
      const cmsTerms = splitTerms(item.keywords);
      const terms = cmsTerms.length ? cmsTerms : splitTerms(FALLBACK_TERMS[slug]);
      index.push({
        pillar,
        position,
        name,
        terms: terms.map((t) => ({ raw: t, norm: normalize(t) })).filter((t) => t.norm),
        nameWords: normalize(name).split(' ').filter((w) => w.length > 2 && !STOP.has(w)),
        textWords: normalize([decode(item.desc), ...(item.bullets || []).map(decode)].join(' ')).split(' ').filter((w) => w.length > 3 && !STOP.has(w)),
        physio: /fisioterapia|pilates/.test(normalize(name)),
      });
    });
  });
  return index;
}

function search(query, index) {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(' ').filter((w) => w.length > 2 && !STOP.has(w));
  const padded = ` ${q} `;

  return index
    .map((spec) => {
      let score = 0;
      const matched = [];
      const hit = (raw) => { if (raw && !matched.includes(raw)) matched.push(raw); };

      // 1. whole symptom phrases ("dor nas costas", "pós-parto")
      spec.terms.forEach((t) => {
        if (padded.includes(` ${t.norm} `)) { score += 6 + t.norm.split(' ').length; hit(t.raw); }
      });
      // 2. single words against symptoms, name and description
      tokens.forEach((tok) => {
        const term = spec.terms.find((t) => t.norm.split(' ').some((w) => similar(w, tok)));
        if (term) { score += 3; hit(term.raw); }
        if (spec.nameWords.some((w) => similar(w, tok))) score += 4;
        if (spec.textWords.some((w) => similar(w, tok))) score += 1;
      });
      if (score > 0 && spec.physio) score += 0.5; // clinic focus: physiotherapy wins ties
      return { spec, score, matched };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
}

/* --------------------------------------------------------------------------
   UI
   -------------------------------------------------------------------------- */
const dialog = document.getElementById('hakuraSymptomSearch');
const input = document.getElementById('hkSearchInput');
const results = document.getElementById('hkSearchResults');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function bookingLink(label = 'Marcar consulta') {
  const a = el('a', 'pillar-pro-book-btn hk-search__book');
  a.href = BOOKING_URL;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';
  a.append(el('span', null, label));
  return a;
}

function openSpecialty(pillar, position) {
  dialog.close();
  if (!window.openPillarDrawer) return;
  window.openPillarDrawer(pillar);
  setTimeout(() => {
    if (window.toggleSpecialtyAccordion) window.toggleSpecialtyAccordion(position);
    const item = document.querySelector(`#expandSpecialtiesList .hakura-faq-item[data-faq-idx="${position}"]`);
    if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 450);
}

function render(query) {
  results.replaceChildren();
  const q = query.trim();
  if (!q) return;

  if (RED_FLAGS.test(normalize(q))) {
    const urgent = el('div', 'hk-search__urgent');
    urgent.innerHTML = '<strong>Se é uma situação urgente, ligue já <a href="tel:112">112</a>.</strong> Para aconselhamento de saúde: SNS 24 — <a href="tel:808242424">808 24 24 24</a>.';
    results.append(urgent);
  }

  const found = search(q, buildIndex());
  if (!found.length) {
    const empty = el('div', 'hk-search__empty');
    empty.append(
      el('p', 'hk-search__empty-title', `Não encontrámos uma especialidade para "${q}".`),
      el('p', null, 'Fale connosco — ajudamos a escolher o acompanhamento certo.'),
    );
    const actions = el('div', 'hk-search__actions');
    const call = el('a', 'hk-search__link', 'Ligar +351 964 166 845');
    call.href = 'tel:+351964166845';
    actions.append(call, bookingLink());
    empty.append(actions);
    results.append(empty);
    return;
  }

  const label = el('p', 'hk-search__label', found.length === 1 ? 'Sugerimos' : 'Sugerimos estas especialidades');
  const list = el('ul', 'hk-search__list');
  found.forEach(({ spec, matched }) => {
    const li = el('li', 'hk-search__item');
    const top = el('div', 'hk-search__item-top');
    top.append(el('span', 'hk-search__pillar', PILLAR_LABEL[spec.pillar] || spec.pillar));
    if (spec.physio) top.append(el('span', 'hakura-faq-tag', 'Fisioterapia'));
    li.append(top, el('h3', 'hk-search__name', spec.name));
    // drop terms already contained in a longer matched term ("costas" ⊂ "dor nas costas")
    const shown = matched.filter((m) => !matched.some((o) => o !== m && normalize(o).includes(normalize(m))));
    if (shown.length) li.append(el('p', 'hk-search__why', `Indicado para: ${shown.slice(0, 3).join(', ')}`));
    const actions = el('div', 'hk-search__actions');
    const view = el('button', 'hk-search__view', 'Ver especialidade');
    view.type = 'button';
    view.addEventListener('click', () => openSpecialty(spec.pillar, spec.position));
    actions.append(view, bookingLink());
    li.append(actions);
    list.append(li);
  });
  results.append(label, list);
}

function openSearch(prefill) {
  if (!dialog || dialog.open) return;
  if (window.closeMobileNavMenu) window.closeMobileNavMenu();
  document.documentElement.classList.add('hk-dialog-open');
  if (window.lenis && window.lenis.stop) window.lenis.stop();
  dialog.showModal();
  if (typeof prefill === 'string') input.value = prefill;
  render(input.value);
  input.focus();
}

if (dialog && input && results) {
  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => render(input.value), 120);
  });
  dialog.querySelectorAll('[data-chip]').forEach((chip) => {
    chip.addEventListener('click', () => { input.value = chip.dataset.chip; render(input.value); input.focus(); });
  });
  dialog.querySelectorAll('[data-search-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('hk-dialog-open');
    if (window.lenis && window.lenis.start) window.lenis.start();
  });
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-search-open]');
    if (trigger) { e.preventDefault(); openSearch(); }
  });
  // ⌘K / Ctrl+K opens the search
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
  });
  window.openSymptomSearch = openSearch;
}

// Exposed for tests / debugging
export { search, buildIndex, normalize };
