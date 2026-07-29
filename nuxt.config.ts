// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-17',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

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

