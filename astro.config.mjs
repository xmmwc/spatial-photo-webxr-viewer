// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://zfox23.github.io',
  base: 'spatial-photo-webxr-viewer',
  integrations: [react(), tailwind()],
  vite: {
    server: {
      fs: {
        allow: ['..']
      }
    }
  }
});