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
      `[Plan B Wholesale] Missing environment variable "${key}". ` +
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

  /**
   * Serve the built-in demo catalogue instead of reading Firestore.
   *
   * For evaluating the ordering flow before a Firebase project exists. Off
   * unless explicitly set, because a deployment that silently showed sample
   * frames would be worse than one that showed an error.
   */
  useSampleCatalogue: flag('VITE_USE_SAMPLE_CATALOGUE'),

  /**
   * Cloudinary, which hosts catalogue photos and clips.
   *
   * Both values are public by design — an unsigned upload preset is meant to be
   * in a client bundle, and the cloud name is in every delivery URL. What keeps
   * this safe is the preset's own configuration (unsigned, folder-restricted, no
   * `public_id`), not secrecy. The API *secret* is never here and never in any
   * client code; see the note on `deleteFrameMedia`.
   */
  cloudinary: {
    cloudName: optional('VITE_CLOUDINARY_CLOUD_NAME', 'hffecbkp'),
    uploadPreset: optional('VITE_CLOUDINARY_UPLOAD_PRESET', 'ml_eyeware'),
  },

  /** Where finished orders are sent. Handle only — the `@` is stripped for us. */
  telegramHandle: optional('VITE_TELEGRAM_HANDLE', 'planbvision'),

  /** Shown beside the Viber button so a buyer can save the number. */
  viberNumber: optional('VITE_VIBER_NUMBER', '+95 9 000 000 000'),

  /**
   * The "How to Use" clip played on first launch.
   *
   * Optional by design. With no URL the onboarding modal falls back to an
   * illustrated three-step walkthrough rather than rendering a broken `<video>`
   * — a dead player on first launch reads as a broken app, which is the worst
   * possible first impression for a tool someone was told to install.
   */
  onboardingVideoUrl: optional('VITE_ONBOARDING_VIDEO_URL'),
  /** Still frame behind the video before it plays. Optional. */
  onboardingPosterUrl: optional('VITE_ONBOARDING_POSTER_URL'),

  isDev: import.meta.env.DEV,
} as const;
