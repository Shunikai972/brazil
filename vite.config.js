import { defineConfig } from 'vite';
import { cpSync, existsSync } from 'node:fs';

// The project keeps its media in /assets (served as-is in dev). At build time the folder is
// copied verbatim into dist/assets so runtime paths like "assets/lula/x.webp" keep working,
// while Vite's own bundles go to dist/build to avoid collisions.
export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    assetsDir: 'build',
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
  server: { host: true },
  plugins: [
    {
      name: 'copy-static-assets',
      apply: 'build',
      closeBundle() {
        if (!existsSync('assets')) return;
        cpSync('assets', 'dist/assets', {
          recursive: true,
          filter: (src) => !/\.md$/i.test(src),
        });
      },
    },
  ],
});
