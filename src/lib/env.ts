/**
 * Typed, validated access to the Vite environment.
 *
 * Anything read from `import.meta.env` funnels through here so that a missing
 * variable fails loudly at boot instead of surfacing as an opaque Firebase
 * error three screens into the app.
 */

type EnvKey =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID';

function required(key: EnvKey): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `[Plan B Vision] Missing environment variable "${key}". ` +
        'Copy .env.example to .env.local and fill in your Firebase credentials.',
    );
  }
  return value;
}

function optional(key: string, fallback = ''): string {
  return import.meta.env[key] ?? fallback;
}

function flag(key: string): boolean {
  return import.meta.env[key] === 'true';
}

export const env = {
  firebase: {
    apiKey: required('VITE_FIREBASE_API_KEY'),
    authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: required('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: required('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: required('VITE_FIREBASE_APP_ID'),
    measurementId: optional('VITE_FIREBASE_MEASUREMENT_ID'),
  },
  useEmulators: flag('VITE_USE_FIREBASE_EMULATORS'),
  telegramHandle: optional('VITE_TELEGRAM_HANDLE', 'planbvision'),
  store: {
    phone: optional('VITE_STORE_PHONE', '+95 9 000 000 000'),
    email: optional('VITE_STORE_EMAIL', 'hello@planbvision.com'),
  },
  isDev: import.meta.env.DEV,
} as const;
