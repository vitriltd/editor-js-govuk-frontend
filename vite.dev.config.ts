import { defineConfig, type Plugin } from 'vite';
import path, { resolve } from 'node:path';

/**
 * Vite plugin that rewrites `/assets/*` requests to serve files from
 * govuk-frontend's dist assets directory. This fixes font loading (and
 * images) during development — the compiled CSS references these at
 * absolute `/assets/…` paths.
 */
function govukAssets(): Plugin {
  const assetsDir = path.resolve(
    __dirname,
    'node_modules/govuk-frontend/dist/govuk/assets'
  );

  return {
    name: 'govuk-assets',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/assets/')) {
          req.url = `/@fs/${assetsDir}${req.url.slice('/assets'.length)}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: 'demo',
  base: process.env.CI ? '/editor-js-govuk-frontend/' : undefined,
  plugins: [govukAssets()],
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..'],
    },
  },
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'demo/index.html'),
        output: resolve(__dirname, 'demo/output.html'),
      },
    },
  },
});
