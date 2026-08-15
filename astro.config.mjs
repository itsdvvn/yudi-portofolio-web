import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

function customKeystaticIntegration() {
  const base = keystatic();
  return {
    ...base,
    name: 'custom-keystatic',
    hooks: {
      ...base.hooks,
      'astro:config:setup': (params) => {
        base.hooks['astro:config:setup']({
          ...params,
          injectRoute: (route) => {
            if (route.pattern === '/keystatic/[...params]') {
              params.injectRoute({
                ...route,
                entrypoint: new URL('./src/pages/keystatic/[...params].astro', import.meta.url).pathname,
                entryPoint: new URL('./src/pages/keystatic/[...params].astro', import.meta.url).pathname,
              });
            } else {
              params.injectRoute(route);
            }
          }
        });
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://itsdvvn.my.id',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    react(),
    customKeystaticIntegration(),
    tailwind({
      applyBaseStyles: false,
    })
  ],
  output: 'server'
});

