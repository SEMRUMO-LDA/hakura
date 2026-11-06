/**
 * HAKURA — contact form in the contact drawer
 *
 * - Sends the request to kibanCMS (POST /api/v1/forms/submit, Forms add-on):
 *   the lead is saved in "Form Submissions" and kibanCMS emails the clinic.
 * - On success → /obrigado/ (thank-you page, where the Google Ads conversion
 *   is counted — see js/thank-you.js and cms/README.md).
 * - Google Ads click ids (gclid/gbraid/wbraid) and utm_* tags are read from the
 *   current URL at submit time and sent with the lead — nothing is stored in
 *   the browser for this.
 * - Anti-spam: hidden honeypot field + "too fast" check (kibanCMS also limits
 *   to 20 submissions per 15 min per IP).
 *
 * Live since 2026-11-06 (kibanCMS blocks public-key reads of the leads).
 * Set enabled: false to go back to the plain contact details (?form=1 still
 * previews the form). Setup: cms/README.md → "Formulário de contacto".
 */
const CONTACT_FORM = {
  enabled: true,
  formName: 'contacto',
  thankYouUrl: '/obrigado/',
};

const API_URL = (import.meta.env.VITE_KIBAN_API_URL || '').replace(/\/+$/, '');
const TENANT = import.meta.env.VITE_KIBAN_TENANT || '';
const API_KEY = import.meta.env.VITE_KIBAN_API_KEY || '';

const INTERESTS = {
  fisioterapia: 'Fisioterapia',
  massagens: 'Massagens',
  holisticas: 'Terapias holísticas',
  estetica: 'Estética e HIFU',
  outro: 'Outro assunto',
};
const TRACKING_PARAMS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

const drawer = document.getElementById('hakuraContactDrawer');
const form = document.getElementById('hkContactForm');
const preview = new URLSearchParams(window.location.search).get('form') === '1';

if (drawer && form && (CONTACT_FORM.enabled || preview)) init();

function init() {
  drawer.classList.add('has-form');
  drawer.querySelector('[data-contact-form]').hidden = false;
  drawer.querySelectorAll('[data-contact-info]').forEach((el) => { el.hidden = true; });

  const status = form.querySelector('.hk-cform__status');
  const submitBtn = form.querySelector('.hk-cform__submit');
  const submitLabel = form.querySelector('.hk-cform__submit-label');
  const idleLabel = submitLabel.textContent;
  let tried = false;
  let sending = false;

  /* ---------- validation ---------- */
  const value = (name) => String(form.elements[name] && form.elements[name].value || '').trim();
  const checkedInterest = () => form.querySelector('input[name="interest"]:checked');

  const RULES = {
    name: () => value('name').length >= 2 || 'Indique o seu nome.',
    phone: () => {
      const digits = value('phone').replace(/\D/g, '');
      return (digits.length >= 9 && digits.length <= 15) || 'Indique um número de telefone válido.';
    },
    email: () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value('email')) || 'Indique um email válido.',
    interest: () => !!checkedInterest() || 'Escolha uma opção.',
    consent: () => form.elements.consent.checked || 'Precisamos da sua autorização para o contactar.',
  };
  const ERROR_EL = {
    name: 'hkcfNameErr', phone: 'hkcfPhoneErr', email: 'hkcfEmailErr', interest: 'hkcfInterestErr', consent: 'hkcfConsentErr',
  };

  function check(field) {
    const result = RULES[field]();
    const message = result === true ? '' : result;
    const el = document.getElementById(ERROR_EL[field]);
    if (el) el.textContent = message;
    const inputs = field === 'interest'
      ? form.querySelectorAll('input[name="interest"]')
      : [form.elements[field]];
    inputs.forEach((input) => {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
    return !message;
  }

  // Re-validate as the person corrects a field (only after a first attempt or
  // once they leave a field they typed in — no red errors while typing).
  ['name', 'phone', 'email'].forEach((field) => {
    const input = form.elements[field];
    input.addEventListener('blur', () => { if (tried || input.value.trim()) check(field); });
    input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) check(field); });
  });
  form.querySelectorAll('input[name="interest"]').forEach((r) => r.addEventListener('change', () => { if (tried) check('interest'); }));
  form.elements.consent.addEventListener('change', () => { if (tried) check('consent'); });

  /* ---------- submit ---------- */
  function setSending(on) {
    sending = on;
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-sending', on);
    submitLabel.textContent = on ? 'A enviar…' : idleLabel;
  }

  function showError(html) {
    status.innerHTML = html;
  }

  function goToThankYou(name, interestLabel) {
    try {
      sessionStorage.setItem('hk-lead', JSON.stringify({
        name: name.split(/\s+/)[0].slice(0, 40),
        interest: interestLabel,
        t: Date.now(),
      }));
    } catch { /* private mode: the page still says thank you */ }
    window.location.href = CONTACT_FORM.thankYouUrl;
  }

  function tracking() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    TRACKING_PARAMS.forEach((key) => {
      const v = (params.get(key) || '').trim();
      if (v) out[key] = v.slice(0, 200);
    });
    return out;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    tried = true;
    status.textContent = '';

    const fields = ['name', 'phone', 'email', 'interest', 'consent'];
    const results = fields.map(check);
    const firstInvalid = fields.find((_, i) => !results[i]);
    if (firstInvalid) {
      const target = firstInvalid === 'interest' ? form.querySelector('input[name="interest"]') : form.elements[firstInvalid];
      if (target) target.focus();
      return;
    }

    const name = value('name');
    const interest = checkedInterest().value;
    const interestLabel = INTERESTS[interest] || interest;

    // Bots: honeypot filled, or the form sent within 3 s of opening the page
    if (value('hk_hp') || performance.now() < 3000) {
      goToThankYou(name, interestLabel);
      return;
    }

    if (!API_URL || !API_KEY) {
      showError('Não foi possível enviar agora. Por favor, ligue-nos para o <a href="tel:+351964166845">+351 964 166 845</a>.');
      return;
    }

    const message = value('message');
    const payload = {
      form_name: CONTACT_FORM.formName,
      name,
      email: value('email').toLowerCase(),
      phone: value('phone'),
      subject: interestLabel,
      message: message || `Pedido de contacto — ${interestLabel}`,
      source_url: (window.location.origin + window.location.pathname + window.location.search).slice(0, 500),
      extra: {
        interesse: interestLabel,
        consentimento: 'sim',
        consentimento_em: new Date().toISOString(),
        origem: 'gaveta-contactos',
        referrer: (document.referrer || '').slice(0, 300),
        ...tracking(),
      },
    };

    setSending(true);
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` };
      if (TENANT) headers['X-Tenant'] = TENANT;
      const res = await fetch(`${API_URL}/forms/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
      goToThankYou(name, interestLabel);
    } catch (err) {
      setSending(false);
      console.warn('[contact-form] envio falhou:', err && err.message);
      showError(err && err.status === 429
        ? 'Recebemos vários pedidos seguidos deste dispositivo. Tente de novo daqui a alguns minutos ou ligue-nos para o <a href="tel:+351964166845">+351 964 166 845</a>.'
        : 'Não foi possível enviar o pedido. Tente novamente ou ligue-nos para o <a href="tel:+351964166845">+351 964 166 845</a>.');
    }
  });

  // Open the drawer with the form, optionally with an interest pre-selected:
  // window.openContactForm({ interest: 'estetica' })
  window.openContactForm = ({ interest } = {}) => {
    if (interest) {
      const radio = form.querySelector(`input[name="interest"][value="${CSS.escape(interest)}"]`);
      if (radio) radio.checked = true;
    }
    if (window.openContactDrawer) window.openContactDrawer();
    setTimeout(() => form.elements.name.focus({ preventScroll: true }), 450);
  };
}
