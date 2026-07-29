<template>
  <div class="bg-stone flex min-h-screen flex-col">
    <Navbar />
    <main class="flex-1 pb-20 sm:pb-0">
      <slot />
    </main>
    <Footer />
  </div>
</template>
