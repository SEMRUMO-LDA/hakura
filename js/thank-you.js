/**
 * HAKURA — thank-you page (/obrigado/) after the contact form.
 *
 * - Personalises the title with the first name typed in the form.
 * - Pushes ONE "generate_lead" event to the dataLayer, only when the visitor
 *   really came from a submitted form (not on refresh or a direct visit).
 *   In Google Tag Manager, use the Custom Event trigger "generate_lead" for the
 *   Google Ads conversion — see cms/README.md → "Formulário de contacto".
 * - Loads the kibanCMS widgets (cookie notice), so consent also applies here.
 */
import { loadKibanWidgets } from './kiban-widgets.js';

let lead = null;
try {
  lead = JSON.parse(sessionStorage.getItem('hk-lead') || 'null');
  sessionStorage.removeItem('hk-lead');
} catch { lead = null; }

// Ignore stale data (e.g. a tab left open for hours)
if (lead && (!lead.t || Date.now() - lead.t > 30 * 60 * 1000)) lead = null;

if (lead) {
  const nameEl = document.querySelector('[data-ty-name]');
  if (nameEl && lead.name) nameEl.textContent = `, ${lead.name}`;
  const interestEl = document.querySelector('[data-ty-interest]');
  if (interestEl && lead.interest && lead.interest !== 'Outro assunto') interestEl.textContent = ` (${lead.interest})`;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'generate_lead', form_name: 'contacto', lead_interest: lead.interest || '' });
}

loadKibanWidgets();
