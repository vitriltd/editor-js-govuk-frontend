import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import dts from 'vite-plugin-dts';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  define: {
    __PLUGIN_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/precompiled-templates.ts', 'src/cli/**/*.ts'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli/migrate.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: ['@editorjs/editorjs', 'node:process', 'node:readline'],
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
