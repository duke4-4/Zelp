<template>
  <div class="border-default flex flex-col overflow-hidden rounded-lg border">
    <USkeleton class="aspect-[4/3] w-full rounded-none" />
    <div class="flex flex-col gap-2 p-4">
      <USkeleton class="h-5 w-3/4" />
      <div class="flex gap-1">
        <USkeleton class="h-5 w-14 rounded-full" />
        <USkeleton class="h-5 w-16 rounded-full" />
      </div>
      <USkeleton class="h-4 w-24" />
      <USkeleton class="h-4 w-32" />
    </div>
  </div>
</template>
