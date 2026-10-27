import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'

const prerenderScript = fileURLToPath(new URL('./src/prerender.jsx', import.meta.url))
// Rollup reports module ids with forward slashes, also on Windows
const samePath = (a, b) => a?.replaceAll('\\', '/') === b.replaceAll('\\', '/')

// The pre-render script and React's server renderer are only needed while building, so they are
// dropped from dist/ once the pages are written (browsers never load them)
const dropBuildOnlyChunks = {
  name: 'drop-build-only-chunks',
  apply: 'build',
  generateBundle: {
    // After vite-prerender-plugin has run the script
    order: 'post',
    handler(_opts, bundle) {
      const entry = Object.values(bundle).find(c => c.type === 'chunk' && samePath(c.facadeModuleId, prerenderScript))
      if (!entry) return
      const usedByPages = new Set(
        Object.values(bundle)
          .filter(c => c.type === 'chunk' && c !== entry)
          .flatMap(c => [...c.imports, ...c.dynamicImports]),
      )
      for (const file of [entry.fileName, ...entry.dynamicImports]) {
        if (file === entry.fileName || !usedByPages.has(file)) delete bundle[file]
      }
    },
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Saves every page as finished HTML at build time, for search engines and AI crawlers
    vitePrerenderPlugin({ renderTarget: '#root', prerenderScript, additionalPrerenderRoutes: ['/spa.html'] }),
    dropBuildOnlyChunks,
  ],
  // The BrickManager app (frontend/) uses 5173-5175, so the website gets its own port
  server: { port: 5176 },
})
