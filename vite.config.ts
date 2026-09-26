import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  server: {
    /**
     * Vite does not read `PORT` on its own — it only honours `--port` or this
     * option. Tooling that hands a dev server its port through the environment
     * (containers, preview harnesses) would otherwise be silently ignored, and
     * the server would come up on a port nobody is watching.
     */
    port: Number(process.env.PORT) || 5173,

    /**
     * Bind IPv4 explicitly rather than taking Vite's `localhost` default.
     *
     * On Windows, `localhost` resolves to `::1` first, so the default binds the
     * IPv6 loopback *only*. Anything that reaches for `127.0.0.1` — curl, and
     * the preview harness that opens the page — then hangs in SYN_SENT against
     * a port that is genuinely listening, which reads as "the dev server is
     * broken" rather than "it is listening on the other loopback".
     *
     * Dev only. `vite build` never looks at this block.
     */
    host: '127.0.0.1',
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the big third-party dependencies into their own chunks.
         *
         * Firebase alone outweighs everything else in this app, so it gets two
         * entries rather than one. `firebase` holds what the catalogue needs and
         * loads on first paint; `firebase-staff` holds Auth and Storage, which
         * only `lib/firebase-staff.ts` imports and which only the lazily-loaded
         * `/admin` and `/sign-in` routes reach. Listing them together — as this
         * config used to — would force them into one chunk and undo the route
         * splitting entirely, because a manual chunk is emitted as a unit.
         *
         * The rest change only when we upgrade them, so stable chunks mean a
         * repeat visitor re-fetches app code alone.
         */
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/analytics'],
          'firebase-staff': ['firebase/auth'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
})
