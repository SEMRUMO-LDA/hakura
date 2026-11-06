import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Two pages: the site (index.html) and the contact-form thank-you page
// (/obrigado/ — where the Google Ads conversion is counted).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        obrigado: fileURLToPath(new URL('./obrigado/index.html', import.meta.url)),
      },
    },
  },
});
