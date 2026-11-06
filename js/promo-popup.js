/**
 * HAKURA — commercial popup (currently: HIFU)
 *
 * - Opens after DELAY seconds of *active* time on the site (the counter pauses
 *   while the tab is in the background).
 * - Never opens on top of something else: another dialog, a pillar panel, the
 *   mobile menu, the contact drawer or the cookie banner — it waits until free.
 * - Shown once per visitor every SNOOZE_DAYS days (closing or clicking the CTA
 *   both count). Change PROMO.id for a new campaign to show it again to everyone.
 * - Preview immediately: add ?promo=hifu to the URL.
 */
const PROMO = {
  id: 'hifu-2026-11',
  enabled: true,
  delaySeconds: 35,
  snoozeDays: 14,
};

const dialog = document.getElementById('hakuraPromoHifu');
const STORAGE_KEY = `hk-promo-${PROMO.id}`;

const read = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};
const remember = (action) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ t: Date.now(), action })); } catch { /* private mode */ }
};

function isSnoozed() {
  const seen = read();
  return !!(seen && Date.now() - seen.t < PROMO.snoozeDays * 86400000);
}

const visible = (el) => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && el.getBoundingClientRect().height > 0;

// Something else is on screen → wait
function isBusy() {
  return !!document.querySelector('dialog[open]')
    || document.body.classList.contains('drawer-open')
    || !!document.querySelector('#hakuraMobileNavDrawer.open, .hakura-contact-drawer.open')
    || visible(document.getElementById('stcm-banner'));
}

function open() {
  if (!dialog || dialog.open) return;
  document.documentElement.classList.add('hk-dialog-open');
  if (window.lenis && window.lenis.stop) window.lenis.stop();
  dialog.showModal();
}

if (dialog && PROMO.enabled) {
  let action = 'closed';
  dialog.querySelectorAll('[data-promo-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  const cta = dialog.querySelector('[data-promo-cta]');
  if (cta) cta.addEventListener('click', () => { action = 'cta'; setTimeout(() => dialog.close(), 0); });
  dialog.addEventListener('close', () => {
    remember(action);
    document.documentElement.classList.remove('hk-dialog-open');
    if (window.lenis && window.lenis.start) window.lenis.start();
  });

  const preview = new URLSearchParams(window.location.search).get('promo') === 'hifu';
  if (preview || !isSnoozed()) {
    let activeSeconds = 0;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      activeSeconds += 1;
      if ((preview && activeSeconds >= 2) || activeSeconds >= PROMO.delaySeconds) {
        if (isBusy()) return; // try again next second
        clearInterval(timer);
        open();
      }
    }, 1000);
  }
}
