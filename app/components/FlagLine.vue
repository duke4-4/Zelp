<script setup lang="ts">
// The "flagline" motif: a thin bar carrying the Zimbabwean flag's stripe
// sequence (green, yellow, red, black, red, yellow, green) as a gradient.
// Adapted from docs/reference/zelp-v2-prototype.html's `.flagline` /
// `.flagline.tall`, replacing the chevron-frieze pattern at its three
// sanctioned spots (see docs/zelp-brand-guidelines.md) plus a small,
// deliberate set of equivalent spots — see call sites for the full list.
//
// These are the literal national flag colours, not the Zelp brand palette
// (flame/gold/green tokens) — per the brief, they're locked to this one
// component and used nowhere else in the app.
withDefaults(defineProps<{
  tall?: boolean
}>(), {
  tall: false,
})
</script>

<template>
  <div class="zelp-flagline" :class="tall ? 'zelp-flagline--tall' : ''" aria-hidden="true" />
</template>

<style scoped>
.zelp-flagline {
  --zw-green: #319b42;
  --zw-yellow: #ffd200;
  --zw-red: #de2010;
  --zw-black: #101010;

  height: 3px;
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    var(--zw-green) 0 14.28%,
    var(--zw-yellow) 14.28% 28.57%,
    var(--zw-red) 28.57% 42.85%,
    var(--zw-black) 42.85% 57.14%,
    var(--zw-red) 57.14% 71.42%,
    var(--zw-yellow) 71.42% 85.71%,
    var(--zw-green) 85.71% 100%
  );
}

.zelp-flagline--tall {
  height: 5px;
}
</style>
