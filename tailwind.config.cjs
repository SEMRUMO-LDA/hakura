/**
 * Generates ONLY the Tailwind utilities that index.html uses but that the
 * precompiled css/hakura.css does not define (css/hakura-utilities.css).
 *
 * - Breakpoints match the ones baked into hakura.css (sm 560 / md 980 /
 *   lg 1440 / xl 1720), so `md:` means the same thing in both files.
 * - Every class already defined in hakura.css is blocklisted, so tuned rules
 *   there are never duplicated or overridden.
 * - Preflight is off: hakura.css already ships its own base/reset.
 *
 * Regenerate after editing markup:  npm run css:utilities
 */
const fs = require('fs');
const path = require('path');

const hakuraCss = fs.readFileSync(path.join(__dirname, 'css/hakura.css'), 'utf8');
const defined = new Set();
for (const m of hakuraCss.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) {
  defined.add(m[1].replace(/\\(.)/g, '$1'));
}

// Cascade safety: this file loads AFTER hakura.css, so a generated class
// (e.g. `sm:text-[36px]`) would beat a larger breakpoint that lives in
// hakura.css on the same element (e.g. `md:text-[56px]`). For every element
// that uses at least one generated class, re-emit ALL of its responsive
// variants here so Tailwind orders base < sm < md < lg < xl in one file.
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
for (const m of html.matchAll(/class(?:Name)?\s*=\s*"([^"]*)"/g)) {
  const classes = m[1].split(/\s+/).filter(c => c && !c.includes('${'));
  if (!classes.some(c => !defined.has(c))) continue;
  for (const c of classes) {
    if (/^(sm|md|lg|xl):/.test(c)) defined.delete(c);
  }
}

module.exports = {
  content: ['./index.html', './js/**/*.js'],
  blocklist: [...defined],
  corePlugins: { preflight: false },
  theme: {
    screens: {
      sm: '560px',
      md: '980px',
      lg: '1440px',
      xl: '1720px',
    },
    extend: {
      spacing: { 4.5: '1.125rem' },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-none': { 'scrollbar-width': 'none', '-ms-overflow-style': 'none' },
        '.scrollbar-none::-webkit-scrollbar': { display: 'none' },
      });
    },
  ],
};
