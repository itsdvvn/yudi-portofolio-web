import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://itsdvvn.my.id',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    react(),
    markdoc(),
    keystatic(),
    tailwind({
      applyBaseStyles: false,
    })
  ],
  output: 'server'
});
