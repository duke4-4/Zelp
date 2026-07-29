<script setup lang="ts">
// Zelp's colour system is intentionally light-first; don't retain an old
// browser preference that turns Soapstone and Granite Ink into low-contrast.
useColorMode().preference = 'light'
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
