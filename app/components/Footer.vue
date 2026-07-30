<script setup lang="ts">
// Multi-column footer, adapted from the reference prototype's `.foot` /
// `.foot-grid` layout. Only links to routes that actually exist in this
// app — no About/Careers/Press/Legal columns, since those pages don't
// exist here and a link to nowhere is worse than a shorter footer.
const year = new Date().getFullYear()

const columns = [
  {
    heading: 'Discover',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Search', to: '/search' },
      { label: 'Favorites', to: '/favorites' },
    ],
  },
  {
    heading: 'For businesses',
    links: [
      { label: 'Zelp for Business', to: '/business' },
      { label: 'Business dashboard', to: '/business/dashboard' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Log in', to: '/login' },
      { label: 'Sign up', to: '/signup' },
    ],
  },
]
</script>

<template>
  <footer class="hidden border-t border-line sm:block">
    <FlagLine />

    <div class="zelp-container flex flex-col gap-10 py-10">
      <div class="grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <img src="/brand/zelp-icon.svg" alt="" class="mb-3 size-8">
          <p class="text-ink-muted max-w-[30ch] text-sm leading-relaxed">
            Reviews of Zimbabwean places, written by the people who actually go there.
          </p>
        </div>

        <div v-for="column in columns" :key="column.heading">
          <h4 class="text-ink-faint mb-3 text-[11px] font-bold tracking-[0.14em] uppercase">
            {{ column.heading }}
          </h4>
          <ul class="flex flex-col gap-2.5">
            <li v-for="link in column.links" :key="link.to">
              <ULink :to="link.to" class="text-ink-muted hover:text-flame-500 text-[13.5px]">
                {{ link.label }}
              </ULink>
            </li>
          </ul>
        </div>
      </div>

      <div class="text-ink-faint flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs">
        <span>© {{ year }} Zelp</span>
        <span>Made in Zimbabwe</span>
      </div>
    </div>
  </footer>
</template>
