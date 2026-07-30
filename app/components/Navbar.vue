<script setup lang="ts">
const user = useSupabaseUser()
const { signOut } = useAuth()
const route = useRoute()
// Real avatar_url once uploaded (Phase 6); falls back to the email initial
// via ProfileAvatar while signed out or before it's loaded.
const { data: myProfile } = useMyProfile()

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

// Desktop nav — active-state highlighting reuses the same
// bg-flame-tint/text-flame-500 "soft" pill treatment as the button system's
// own `variant="soft" color="primary"` combo (see app.config.ts's
// `colors.primary: 'flame'`), so an active item reads as a filled chip
// instead of just a colour change on plain ghost buttons.
function isActiveRoute(prefix: string) {
  return route.path === prefix || route.path.startsWith(`${prefix}/`)
}
const exploreActive = computed(() => isActiveRoute('/search') || isActiveRoute('/map'))
const listBusinessActive = computed(() => isActiveRoute('/business/new') || isActiveRoute('/business/edit'))
const favoritesActive = computed(() => isActiveRoute('/favorites'))

const displayName = computed(() => myProfile.value?.fullName || user.value?.email || '')
</script>

<template>
  <header class="bg-stone/90 sticky top-0 z-40 border-b border-line backdrop-blur">
    <div class="zelp-container flex h-[68px] items-center justify-between gap-4">
      <ULink to="/" class="flex shrink-0 items-center" aria-label="Zelp home">
        <img
          src="/brand/zelp-logo-horizontal.svg"
          alt="Zelp"
          class="h-9 w-auto"
        >
      </ULink>

      <!-- Desktop nav -->
      <div class="hidden items-center gap-1 sm:flex">
        <UButton
          to="/search"
          :variant="exploreActive ? 'soft' : 'ghost'"
          :color="exploreActive ? 'primary' : 'neutral'"
          label="Explore"
          icon="i-lucide-compass"
        />
        <UButton
          to="/business/new"
          :variant="listBusinessActive ? 'soft' : 'ghost'"
          :color="listBusinessActive ? 'primary' : 'neutral'"
          label="List a business"
          icon="i-lucide-store"
        />
        <UButton
          v-if="user"
          to="/favorites"
          square
          :variant="favoritesActive ? 'soft' : 'ghost'"
          :color="favoritesActive ? 'primary' : 'neutral'"
          icon="i-lucide-heart"
          aria-label="Favorites"
        />

        <span class="mx-1 h-6 w-px bg-line" />

        <template v-if="user">
          <UDropdownMenu
            :items="[[{ label: 'Profile', icon: 'i-lucide-user', to: '/profile' }], [{ label: 'Log out', icon: 'i-lucide-log-out', onSelect: handleSignOut }]]"
            :content="{ align: 'end' }"
          >
            <UButton
              variant="ghost"
              color="neutral"
              :loading="signingOut"
              class="rounded-full py-1 pr-2.5 pl-1.5"
            >
              <ProfileAvatar :avatar-url="myProfile?.avatarUrl" :name="displayName" size="xs" />
              <span class="max-w-32 truncate text-sm font-medium">{{ displayName }}</span>
              <UIcon name="i-lucide-chevron-down" class="text-ink-faint size-3.5" />
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
       there's a single, brand-consistent mobile navigation surface. Active
       tab gets a bg-flame-tint pill behind its icon (not just a colour
       swap) so the current destination reads clearly at a glance. -->
  <nav
    class="bg-surface/95 fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(21,32,27,0.06)] backdrop-blur sm:hidden"
    aria-label="Primary"
  >
    <ULink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] tracking-wide transition-colors"
      :class="isActiveTab(tab.to) ? 'text-flame-500 font-semibold' : 'text-ink-faint font-medium hover:text-ink-muted'"
    >
      <span
        class="flex h-7 w-12 items-center justify-center rounded-full transition-colors"
        :class="isActiveTab(tab.to) ? 'bg-flame-tint' : ''"
      >
        <UIcon :name="tab.icon" class="size-5" />
      </span>
      {{ tab.label }}
    </ULink>
  </nav>
</template>
