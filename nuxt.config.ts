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
  ],

  css: ['~/assets/css/main.css'],

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
