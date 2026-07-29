<script setup lang="ts">
// Placeholder home page — the real homepage (hero, search, business grid)
// is built in a later phase. This proves out the auth/layout wiring.
const user = useSupabaseUser()
</script>

<template>
  <div class="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 class="text-3xl font-bold">
      Welcome to Zelp
    </h1>
    <p v-if="user" class="text-muted">
      Signed in as {{ user.email }}
    </p>
    <p v-else class="text-muted">
      Not signed in.
    </p>
    <div v-if="!user" class="flex gap-2">
      <UButton to="/login" variant="ghost" label="Log in" />
      <UButton to="/signup" label="Sign up" />
    </div>
  </div>
</template>
