import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

import App from '@/app/App';
// Side-effect import: initialises i18next before the first render, so no
// component ever sees a missing-translation flash.
import '@/app/i18n';
import '@/styles/index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('[Plan B Vision] Root element #root is missing from index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App />
    <Toaster position="top-center" richColors closeButton />
  </StrictMode>,
);
