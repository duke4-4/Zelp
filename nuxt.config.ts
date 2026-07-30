// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-17',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#D9502B' },
        // iOS Safari standalone mode (Android/desktop installability comes
        // from the web app manifest itself, registered by @vite-pwa/nuxt).
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Zelp' },
      ],
    },
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

  // Self-host the two brand typefaces (Outfit for display/headings, Inter
  // for body/UI) so cheap Android/3G devices aren't round-tripping to
  // Google Fonts. `@nuxt/fonts` provisions these automatically from the
  // `font-family` values referenced in app/assets/css/main.css's `@theme`
  // block (--font-display / --font-sans).
  fonts: {
    families: [
      { name: 'Outfit', provider: 'google', weights: [600] },
      { name: 'Inter', provider: 'google', weights: [400, 500] },
    ],
  },

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    public: {
      // Overridden by NUXT_PUBLIC_MAPBOX_TOKEN at runtime.
      mapboxToken: '',
    },
  },

  // Installable PWA: lets users add Zelp to their home screen / desktop
  // dock, like the YouTube or ChatGPT web apps. `manifest.icons` covers
  // Android/desktop install prompts; `apple-touch-icon.png` (referenced via
  // `app.head.link` below) covers iOS "Add to Home Screen". Service worker
  // only precaches the built app shell/static assets — it deliberately does
  // NOT cache Supabase API responses, so business/review data is never
  // served stale.
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Zelp — Discover Zimbabwean Businesses',
      short_name: 'Zelp',
      description: 'Find and review trusted businesses across Zimbabwe.',
      theme_color: '#D9502B',
      background_color: '#F7F1E7',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      lang: 'en',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Precache the app shell only; never intercept/cache Supabase calls.
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      runtimeCaching: [],
    },
    devOptions: {
      // The dev server on this machine can't serve requests at all right
      // now (unrelated Node<22 Supabase issue) — no reason to also run the
      // PWA dev-mode SW, which just adds noise. Production builds still get
      // the real service worker.
      enabled: false,
    },
  },

  supabase: {
    // These fall back to the SUPABASE_URL / SUPABASE_KEY /
    // SUPABASE_SERVICE_ROLE_KEY env vars (the module's defaults),
    // wired explicitly here for clarity.
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Auth redirect middleware is configured in a later phase.
    redirect: false,
    // Root-level types/ (outside app/) so server/ code can share it too.
    types: '~~/types/database.types.ts',
  },
})
