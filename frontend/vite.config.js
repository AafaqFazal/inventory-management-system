import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';
import polyfillNode from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [
    react(),
    checker({
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
      },
    }),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'node_modules'),
      src: path.resolve(__dirname, 'src'),
      stream: 'stream-browserify', // Ensure this alias exists if needed
    },
  },
  build: {
    rollupOptions: {
      plugins: [polyfillNode()],
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3030,
  },
});
