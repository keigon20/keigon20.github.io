import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Set `site` once the Cloudflare Pages domain is known.
export default defineConfig({
  integrations: [preact()],
});
