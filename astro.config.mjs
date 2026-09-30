import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// Vercel sets VERCEL=1 at build time, Netlify does not — so this single
// config deploys beta to Vercel and master to Netlify with no branch hacks.
// Netlify-only features (netlify.toml immutable-cache headers) stay inert
// on Vercel; Vercel applies its own default caching to hashed assets.
export default defineConfig({
  output: 'server',
  adapter: process.env.VERCEL ? vercel() : netlify(),
  integrations: [react()],
});
