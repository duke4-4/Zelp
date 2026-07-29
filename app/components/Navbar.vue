<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const user = useSupabaseUser()
const { signOut } = useAuth()

const mobileMenuOpen = ref(false)
const signingOut = ref(false)

const userInitial = computed(() => {
  const email = user.value?.email
  return email ? email.charAt(0).toUpperCase() : '?'
})

// `/profile` doesn't exist yet — it's built in a later phase, but the link
// is wired now so it starts working the moment that page lands.
const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    { label: 'Profile', icon: 'i-lucide-user', to: '/profile' },
  ],
  [
    { label: 'Log out', icon: 'i-lucide-log-out', onSelect: handleSignOut },
  ],
])

async function handleSignOut() {
  signingOut.value = true
  try {
    await signOut()
    mobileMenuOpen.value = false
    await navigateTo('/')
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <header class="border-default bg-default/75 sticky top-0 z-40 border-b backdrop-blur">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
      <ULink to="/" class="text-primary shrink-0 text-xl font-bold">
        Zelp
      </ULink>

      <!-- Desktop nav -->
      <div class="hidden items-center gap-2 sm:flex">
        <template v-if="user">
          <UDropdownMenu :items="userMenuItems" :content="{ align: 'end' }">
            <UButton variant="ghost" color="neutral" :loading="signingOut">
              <UAvatar :text="userInitial" size="xs" />
              <span class="max-w-40 truncate">{{ user.email }}</span>
            </UButton>
          </UDropdownMenu>
        </template>
        <template v-else>
          <UButton to="/login" variant="ghost" color="neutral" label="Log in" />
          <UButton to="/signup" label="Sign up" />
        </template>
      </div>

      <!-- Mobile trigger -->
      <UButton
        class="sm:hidden"
        variant="ghost"
        color="neutral"
        icon="i-lucide-menu"
        aria-label="Open menu"
        @click="mobileMenuOpen = true"
      />
    </div>

    <!-- Mobile nav: TODO(Phase 3) — fold search/category links into this once they exist. -->
    <USlideover v-model:open="mobileMenuOpen" side="right" title="Menu">
      <template #body>
        <div class="flex flex-col gap-2">
          <template v-if="user">
            <p class="text-muted truncate px-1 text-sm">
              {{ user.email }}
            </p>
            <UButton
              to="/profile"
              variant="ghost"
              color="neutral"
              label="Profile"
              icon="i-lucide-user"
              block
              @click="mobileMenuOpen = false"
            />
            <UButton
              variant="ghost"
              color="neutral"
              label="Log out"
              icon="i-lucide-log-out"
              block
              :loading="signingOut"
              @click="handleSignOut"
            />
          </template>
          <template v-else>
            <UButton
              to="/login"
              variant="ghost"
              color="neutral"
              label="Log in"
              block
              @click="mobileMenuOpen = false"
            />
            <UButton
              to="/signup"
              label="Sign up"
              block
              @click="mobileMenuOpen = false"
            />
          </template>
        </div>
      </template>
    </USlideover>
  </header>
</template>
