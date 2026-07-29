<script setup lang="ts">
const user = useSupabaseUser()
const { signOut } = useAuth()
const route = useRoute()

const signingOut = ref(false)

async function handleSignOut() {
  signingOut.value = true
  try {
    await signOut()
    await navigateTo('/')
  } finally {
    signingOut.value = false
  }
}

// Bottom tab bar (mobile only) — mapped to the app's actual routes. Favorites
// and Profile don't exist until Phase 4/5, but per the design brief we link
// them anyway: they 404 gracefully rather than shipping a dead-looking tab.
const tabs = [
  { label: 'Home', to: '/', icon: 'i-lucide-house' },
  { label: 'Search', to: '/search', icon: 'i-lucide-search' },
  { label: 'Favorites', to: '/favorites', icon: 'i-lucide-heart' },
  { label: 'Profile', to: '/profile', icon: 'i-lucide-user' },
]

function isActiveTab(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <header class="bg-stone/90 sticky top-0 z-40 border-b border-line backdrop-blur">
    <div class="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-5">
      <ULink to="/" class="flex shrink-0 items-center gap-2" aria-label="Zelp home">
        <img
          src="/brand/zelp-icon.svg"
          alt="Zelp"
          class="size-9"
        >
        <span class="font-display text-ink hidden text-lg font-semibold sm:inline">Zelp</span>
      </ULink>

      <!-- Desktop nav -->
      <div class="hidden items-center gap-1 sm:flex">
        <UButton to="/search" variant="ghost" color="neutral" label="Explore" icon="i-lucide-compass" />
        <UButton to="/business/new" variant="ghost" color="neutral" label="List a business" />
        <template v-if="user">
          <UDropdownMenu
            :items="[[{ label: 'Profile', icon: 'i-lucide-user', to: '/profile' }], [{ label: 'Log out', icon: 'i-lucide-log-out', onSelect: handleSignOut }]]"
            :content="{ align: 'end' }"
          >
            <UButton variant="ghost" color="neutral" :loading="signingOut">
              <UAvatar :text="user.email?.charAt(0).toUpperCase() ?? '?'" size="xs" />
              <span class="max-w-40 truncate">{{ user.email }}</span>
            </UButton>
          </UDropdownMenu>
        </template>
        <template v-else>
          <UButton to="/login" variant="ghost" color="neutral" label="Log in" />
          <UButton to="/signup" label="Sign up" />
        </template>
      </div>
    </div>
  </header>

  <!-- Mobile bottom tab bar — replaces the old slideover mobile menu so
       there's a single, brand-consistent mobile navigation surface. -->
  <nav
    class="bg-surface/95 fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(21,32,27,0.06)] backdrop-blur sm:hidden"
    aria-label="Primary"
  >
    <ULink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium tracking-wide transition-colors"
      :class="isActiveTab(tab.to) ? 'text-flame-500' : 'text-ink-faint'"
    >
      <UIcon :name="tab.icon" class="size-5" />
      {{ tab.label }}
    </ULink>
  </nav>
</template>
