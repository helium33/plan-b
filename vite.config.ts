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
         * Adding Firebase in Module 2 tripled a single bundle that the browser
         * had to re-download in full after any change to our own code. These
         * libraries change only when we upgrade them, so giving them stable
         * chunks means a repeat visitor re-fetches app code alone.
         *
         * This does not shrink the *first* load — that needs route-level
         * `React.lazy`, which is a separate change with its own loading states.
         */
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
            'firebase/analytics',
          ],
          motion: ['motion/react'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
})
