<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-line hidden sm:block">
    <div class="text-ink-faint mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-sm sm:flex-row">
      <p>© {{ year }} Zelp</p>
      <!-- TODO: add category/support links once those pages exist (later phase). -->
      <nav class="flex items-center gap-4">
        <ULink to="/" class="hover:text-flame-500">
          Home
        </ULink>
      </nav>
    </div>
  </footer>
</template>
