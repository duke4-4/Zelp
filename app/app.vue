<script setup lang="ts">
// Site-wide SEO defaults. Every page's own `useSeoMeta` (title/description at
// minimum) overrides these by key -- Nuxt/unhead merges `useSeoMeta` calls
// from app.vue and the active page by tag identity, with the page's own call
// winning. `title` is deliberately NOT set here: the `app.head.titleTemplate`
// in nuxt.config.ts ('%s — Zelp') already supplies the "— Zelp" suffix for
// every page's own title, and a fallback default here would just be dead
// code (every page in app/pages/ sets a real title).
const siteConfig = useSiteConfig()
const ogImageUrl = computed(() => new URL('/og-image.png', siteConfig.url).toString())

useSeoMeta({
  ogSiteName: 'Zelp',
  ogType: 'website',
  ogImage: ogImageUrl,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl,
})

// Nuxt already injects a default charset/viewport meta tag automatically
// (see nuxt/dist/core -- head.resolve fills these in when absent), so only
// `lang` needs setting explicitly here; it has no default and was missing.
useHead({
  htmlAttrs: { lang: 'en' },
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <AppSplash />
    </ClientOnly>
  </UApp>
</template>
