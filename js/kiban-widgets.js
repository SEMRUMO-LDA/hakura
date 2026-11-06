/**
 * kibanCMS widgets (cookie notice, accessibility, languages, WhatsApp…)
 * One loader asks the CMS which add-ons are enabled and injects only those —
 * turning a widget on/off is done in the kibanCMS admin, not here.
 * Used by the home page (js/cms.js) and the thank-you page (js/thank-you.js).
 */
const API_URL = (import.meta.env.VITE_KIBAN_API_URL || '').replace(/\/+$/, '');
const TENANT = import.meta.env.VITE_KIBAN_TENANT || '';
const API_KEY = import.meta.env.VITE_KIBAN_API_KEY || '';

export function loadKibanWidgets() {
  if (!API_URL || !API_KEY) return;
  if (document.querySelector('script[data-kiban-widgets]')) return;
  // Desktop: let the loader stack our floating chat button with the widgets in
  // the bottom-right corner instead of overlapping it (hidden on mobile, where
  // the bottom CTA bar is used — see css/hakura-responsive.css §18).
  const chat = document.getElementById('hakuraContactDrawerBtn');
  if (chat && window.matchMedia('(min-width: 980px)').matches) {
    chat.setAttribute('data-kiban-stack-corner', 'bottomRight');
    chat.setAttribute('data-kiban-stack-height', '56');
  }
  const script = document.createElement('script');
  script.src = new URL('/api/v1/widgets/loader.js', API_URL).href;
  script.async = true;
  script.setAttribute('data-api-key', API_KEY);
  if (TENANT) script.setAttribute('data-tenant', TENANT);
  script.setAttribute('data-kiban-widgets', '');
  document.body.appendChild(script);
}
