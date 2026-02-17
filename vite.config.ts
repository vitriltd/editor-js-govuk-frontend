import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/precompiled-templates.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EditorJsGovukFrontend',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['@editorjs/editorjs'],
      output: {
        globals: {
          '@editorjs/editorjs': 'EditorJS',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith('.css')) {
            return 'editor-overrides.css';
          }
          return assetInfo.names?.[0] ?? '[name][extname]';
        },
      },
    },
    cssCodeSplit: false,
  },
});
