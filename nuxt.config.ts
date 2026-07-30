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
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    // Both are no-ops unless actually deployed on Vercel (they report to
    // Vercel's own dashboard) -- safe to ship everywhere, silent elsewhere.
    '@vercel/analytics/nuxt',
    '@vercel/speed-insights/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      // Per-page useSeoMeta({ title: ... }) calls (every page in
      // app/pages/ sets one) fill in `%s`; site-wide OG/Twitter/theme
      // defaults live in app.vue via useSeoMeta so page-level calls can
      // override them by key.
      titleTemplate: '%s — Zelp',
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
    // Brand motion spec (see app/assets/css/main.css's own 180ms ease-out
    // splash transition): a short fade+slight-slide between routes.
    // `main.css`'s global `prefers-reduced-motion` rule already collapses
    // every `transition-duration` to ~0, so this degrades to an instant,
    // non-animated swap for users who've asked for reduced motion --
    // nothing extra to wire up here for that.
    pageTransition: { name: 'zelp-page', mode: 'out-in' },
    layoutTransition: { name: 'zelp-page', mode: 'out-in' },
  },

  colorMode: {
    // Light-only, by design -- no dark mode toggle (see app.vue, which
    // pins the preference to 'light' on every load).
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

  // Canonical origin for SEO plumbing (robots.txt, sitemap.xml, canonical
  // links, OpenGraph absolute URLs) -- shared by @nuxtjs/sitemap and
  // @nuxtjs/robots via the underlying nuxt-site-config module. Override with
  // NUXT_PUBLIC_SITE_URL once a production domain is live; the fallback
  // below is just so `nuxi build`/typecheck have *something* absolute to
  // resolve against locally, it's never shown as app content.
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://zelp.co.zw',
    name: 'Zelp',
  },

  // Static routes plus every real published business (added dynamically by
  // server/api/__sitemap__/urls.ts, auto-discovered by this module) --
  // never hardcoded or fabricated entries. Pages that are private
  // (auth-gated) or intentionally noindex (auth flows, /map) are excluded
  // here too, so the sitemap only ever lists pages actually worth indexing.
  sitemap: {
    exclude: [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/map',
      '/profile',
      '/profile/edit',
      '/favorites',
      '/business',
      '/business/new',
      '/business/dashboard',
      '/business/edit/**',
    ],
  },

  // robots.txt: block crawling of anything auth-gated outright (saves crawl
  // budget and keeps those URLs out of search engine logs entirely); the
  // login/signup/forgot-password/reset-password auth pages are left
  // crawlable here (see their own `robots: noindex` meta tag in each page)
  // since that's the combination that actually lets a crawler see and obey
  // the noindex tag, rather than fighting it via robots.txt alone.
  // `/business$` (exact match only, via the trailing `$`) targets just the
  // bare owner hub -- NOT the `/business/<slug>` detail pages, which must
  // stay crawlable.
  robots: {
    disallow: [
      '/profile',
      '/favorites',
      '/business/dashboard',
      '/business/new',
      '/business/edit',
      '/reset-password',
      '/business$',
    ],
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
