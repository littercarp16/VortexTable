import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    root: '.',
    outDir: '../dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VortexTable',
      fileName: (format) => `vortex-table.${format}.js`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
    },
    emptyOutDir: true,
    sourcemap: true,
    target: 'esnext',
  },
  server: {
    port: 5173,
    open: '/examples/index.html',
  },
}); 