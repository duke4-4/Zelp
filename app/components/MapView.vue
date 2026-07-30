<script setup lang="ts">
// Client-only Mapbox GL map (Phase 7). `mapbox-gl` (and its stylesheet) are
// only ever loaded inside `onMounted`, wrapped by `<ClientOnly>`, so the
// library never touches SSR — Mapbox GL JS reaches into `window`/`document`
// at import time and would break server rendering otherwise.
//
// This component is a "dumb" renderer: the caller (app/pages/map.vue, or
// the business detail page's mini-map) owns the actual data fetch
// (`useMapBusinesses`) and passes the resolved list in via `businesses` —
// matching the Filters.vue / search.vue convention of route-owning pages
// driving data, components just rendering it. Every marker plotted here
// comes from a real, non-null `lat`/`lng` on a `businesses` row; there is
// no fallback/fabricated pin position anywhere in this file.

import type { MapBoundsFilter, MapBusinessItem } from '~/composables/useBusinesses'
import type { Map as MapboxMap, Marker as MapboxMarker, Popup as MapboxPopup } from 'mapbox-gl'

const props = withDefaults(defineProps<{
  businesses: MapBusinessItem[]
  /** True while the caller's fetch for `businesses` is in flight. */
  pending?: boolean
  /**
   * 'full' (default) is the /map page: shows the "search this area" and
   * "use my location" controls. 'mini' is the business-detail embed: fixed
   * center on a single business, no extra controls, limited interactivity
   * so it doesn't trap page scroll inside a small box.
   */
  mode?: 'full' | 'mini'
  /** Required for 'mini' mode; also used as the initial center for 'full'
   * mode when there are no businesses yet to fit bounds to. */
  center?: { lat: number, lng: number }
  zoom?: number
  /** Set by the caller once a "search this area" fetch has resolved with
   * zero results, so this component can show an honest "nothing here"
   * banner distinct from a Mapbox load failure. Null/undefined = hidden. */
  emptyBannerMessage?: string | null
}>(), {
  pending: false,
  mode: 'full',
  center: undefined,
  zoom: undefined,
  emptyBannerMessage: null,
})

const emit = defineEmits<{
  /** Fired when the user clicks "search this area", with the map's current
   * viewport bounds — the caller re-runs `useMapBusinesses` scoped to it. */
  'search-this-area': [bounds: MapBoundsFilter]
}>()

const config = useRuntimeConfig()
const mapboxToken = config.public.mapboxToken

// Default viewport when there's nothing to fit bounds to yet (no
// businesses with coordinates, and no `center` prop) — just a reasonable
// starting view of Zimbabwe, not a claim about any business's location.
const DEFAULT_CENTER: [number, number] = [30.0, -19.0]
const DEFAULT_ZOOM = 5.5

const mapContainer = ref<HTMLDivElement | null>(null)
const loadError = ref<string | null>(null)
const mapReady = ref(false)

// The module's `typeof import('mapbox-gl')` type includes all its named
// (mostly type-only) exports; what's actually used at runtime here is the
// default export (the `mapboxgl` namespace object: `.Map`, `.Marker`,
// `.Popup`, `.accessToken`, etc), hence indexing into `['default']`.
let mapboxgl: typeof import('mapbox-gl')['default'] | null = null
let map: MapboxMap | null = null
let markers: MapboxMarker[] = []
let activePopup: MapboxPopup | null = null
let youAreHereMarker: MapboxMarker | null = null

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function popupHtml(business: MapBusinessItem): string {
  const category = business.categories[0]?.name
  const ratingBlock = business.reviewCount > 0
    ? `<span class="text-gold-500">★</span><span class="tabular-nums">${business.avgRating.toFixed(1)}</span><span>(${business.reviewCount})</span>`
    : `<span class="text-ink-faint">New — no reviews yet</span>`
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`

  return `
    <div class="flex min-w-[190px] flex-col gap-1.5 p-1">
      <p class="text-ink text-sm font-semibold leading-snug">${escapeHtml(business.name)}</p>
      <div class="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
        ${ratingBlock}
        ${category ? `<span>&middot; ${escapeHtml(category)}</span>` : ''}
      </div>
      <div class="mt-1 flex items-center gap-3 text-xs font-medium">
        <a href="/business/${encodeURIComponent(business.slug)}" class="text-flame-500 hover:underline">View details</a>
        <a href="${directionsHref}" target="_blank" rel="noopener noreferrer" class="text-ink-muted hover:text-flame-500">Directions</a>
      </div>
    </div>
  `
}

function createPinElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'zelp-map-pin'
  el.setAttribute('role', 'img')
  el.setAttribute('aria-label', 'Business location')
  return el
}

function clearMarkers() {
  for (const marker of markers) marker.remove()
  markers = []
  activePopup?.remove()
  activePopup = null
}

function renderMarkers() {
  if (!map || !mapboxgl) return
  clearMarkers()

  for (const business of props.businesses) {
    const el = createPinElement()
    const popup = new mapboxgl.Popup({ offset: 28, closeButton: true, maxWidth: '240px' })
      .setHTML(popupHtml(business))

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([business.lng, business.lat])
      .setPopup(popup)
      .addTo(map)

    popup.on('open', () => {
      activePopup = popup
    })

    markers.push(marker)
  }
}

function fitToBusinesses() {
  if (!map || !mapboxgl) return

  if (props.mode === 'mini' && props.center) {
    map.jumpTo({ center: [props.center.lng, props.center.lat], zoom: props.zoom ?? 14 })
    return
  }

  if (props.businesses.length === 0) {
    const fallback = props.center ?? { lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] }
    map.jumpTo({ center: [fallback.lng, fallback.lat], zoom: props.center ? (props.zoom ?? 12) : DEFAULT_ZOOM })
    return
  }

  if (props.businesses.length === 1) {
    const only = props.businesses[0]!
    map.jumpTo({ center: [only.lng, only.lat], zoom: props.zoom ?? 13 })
    return
  }

  const bounds = new mapboxgl.LngLatBounds()
  for (const business of props.businesses) bounds.extend([business.lng, business.lat])
  map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 })
}

async function initMap() {
  if (!mapContainer.value || !mapboxToken) return

  try {
    const [mod] = await Promise.all([
      import('mapbox-gl'),
      import('mapbox-gl/dist/mapbox-gl.css'),
    ])
    mapboxgl = mod.default
    mapboxgl.accessToken = mapboxToken

    const initialCenter = props.mode === 'mini' && props.center
      ? [props.center.lng, props.center.lat] as [number, number]
      : DEFAULT_CENTER
    const initialZoom = props.mode === 'mini' ? (props.zoom ?? 14) : DEFAULT_ZOOM

    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: true,
      // The mini embed sits inside a normal scrolling page — scroll-zoom
      // would trap the page's scroll the moment the cursor crosses it.
      scrollZoom: props.mode === 'full',
      cooperativeGestures: props.mode === 'mini',
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: props.mode === 'full' }), 'top-right')

    map.on('error', (event) => {
      // Mapbox emits this for e.g. an invalid/expired token — surface it as
      // the same honest "couldn't load" state rather than a blank map.
      console.error('[MapView] Mapbox GL error:', event.error)
      if (!mapReady.value) loadError.value = 'The map failed to load. Please try again later.'
    })

    map.on('load', () => {
      mapReady.value = true
      fitToBusinesses()
      renderMarkers()
    })
  } catch (error) {
    console.error('[MapView] Failed to initialize Mapbox GL:', error)
    loadError.value = 'The map failed to load. Please try again later.'
  }
}

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  clearMarkers()
  youAreHereMarker?.remove()
  map?.remove()
  map = null
})

watch(() => props.businesses, () => {
  if (!mapReady.value) return
  renderMarkers()
  // Only auto-refit on the initial load implicitly (via the 'load' handler)
  // — re-fitting on every subsequent list change (e.g. after "search this
  // area") would fight the viewport the user just chose.
})

watch(() => [props.center, props.zoom], () => {
  if (mapReady.value && props.mode === 'mini') fitToBusinesses()
})

function handleSearchThisArea() {
  if (!map) return
  const bounds = map.getBounds()
  if (!bounds) return
  emit('search-this-area', {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  })
}

// --- Current location ---

const { coords: geoCoords, error: geoError, resume: resumeGeo } = useGeolocation({ immediate: false })
const locating = ref(false)

watch(geoCoords, (coords) => {
  if (!locating.value) return
  if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return
  locating.value = false

  if (map && mapboxgl) {
    map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14 })

    youAreHereMarker?.remove()
    const el = document.createElement('div')
    el.className = 'zelp-you-are-here'
    el.setAttribute('role', 'img')
    el.setAttribute('aria-label', 'Your current location')
    youAreHereMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([coords.longitude, coords.latitude])
      .addTo(map)
  }
})

watch(geoError, (error) => {
  if (error) locating.value = false
})

function handleLocateMe() {
  if (!navigator.geolocation) {
    // useGeolocation's `error` stays null when the API doesn't exist at
    // all — surface a message here instead of failing silently.
    loadError.value = null
    geoUnsupported.value = true
    return
  }
  geoUnsupported.value = false
  locating.value = true
  resumeGeo()
}

const geoUnsupported = ref(false)
const geoDenied = computed(() => geoError.value?.code === 1) // GeolocationPositionError.PERMISSION_DENIED
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <!-- Missing/empty runtime token — defensive for other environments,
         not expected here since NUXT_PUBLIC_MAPBOX_TOKEN is set. -->
    <div
      v-if="!mapboxToken"
      class="bg-stone flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <UIcon name="i-lucide-map-off" class="text-ink-faint size-8" />
      <p class="text-ink text-sm font-medium">Map unavailable — missing configuration</p>
      <p class="text-ink-faint max-w-xs text-xs">
        The Mapbox access token isn't set for this environment.
      </p>
    </div>

    <ClientOnly v-else>
      <div ref="mapContainer" class="h-full w-full" />

      <div
        v-if="loadError"
        class="bg-stone absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <UIcon name="i-lucide-alert-circle" class="text-closed-500 size-8" />
        <p class="text-ink text-sm font-medium">The map couldn't load</p>
        <p class="text-ink-faint max-w-xs text-xs">{{ loadError }}</p>
      </div>

      <template v-else>
        <!-- Full mode controls -->
        <div v-if="mode === 'full'" class="absolute top-4 left-1/2 z-10 -translate-x-1/2">
          <UButton
            label="Search this area"
            icon="i-lucide-search"
            color="neutral"
            variant="solid"
            class="shadow-floating bg-surface text-ink hover:bg-stone"
            @click="handleSearchThisArea"
          />
        </div>

        <div v-if="mode === 'full'" class="absolute right-4 bottom-6 z-10 flex flex-col items-end gap-2">
          <UButton
            icon="i-lucide-locate-fixed"
            color="neutral"
            variant="solid"
            square
            :loading="locating"
            class="shadow-floating bg-surface text-ink hover:bg-stone"
            aria-label="Use my current location"
            @click="handleLocateMe"
          />
          <p v-if="geoDenied" class="zelp-surface text-ink-muted max-w-52 p-2 text-right text-xs">
            Location access was denied. Enable it in your browser settings to use this.
          </p>
          <p v-else-if="geoUnsupported" class="zelp-surface text-ink-muted max-w-52 p-2 text-right text-xs">
            Your browser doesn't support location.
          </p>
        </div>

        <div
          v-if="emptyBannerMessage"
          class="zelp-surface text-ink-muted absolute top-16 left-1/2 z-10 -translate-x-1/2 px-3 py-2 text-center text-xs"
        >
          {{ emptyBannerMessage }}
        </div>

        <div v-if="pending" class="absolute top-4 right-4 z-10">
          <UBadge label="Updating…" color="neutral" variant="subtle" />
        </div>
      </template>

      <template #fallback>
        <div class="bg-stone h-full w-full" />
      </template>
    </ClientOnly>
  </div>
</template>

<style>
/* Marker DOM nodes are created imperatively by Mapbox GL (not part of this
 * component's Vue-rendered template), so `<style scoped>` wouldn't reach
 * them — these rules are intentionally global, under Zelp-prefixed class
 * names to avoid collisions.
 *
 * The pin graphic is the brand's standalone mark (public/brand/zelp-icon.svg
 * — see docs/zelp-brand-guidelines.md: "Standalone mark: avatars, map pins,
 * loading states"), which is itself already pin-shaped (a rounded square
 * tapering to a point), so it's used as-is rather than inventing a new
 * marker design. */
.zelp-map-pin {
  width: 30px;
  height: 35px;
  background-image: url('/brand/zelp-icon.svg');
  background-size: contain;
  background-repeat: no-repeat;
  cursor: pointer;
  filter: drop-shadow(0 2px 3px rgba(21, 32, 27, 0.28));
}

.zelp-you-are-here {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: var(--color-flame-500);
  border: 2.5px solid var(--color-surface);
  box-shadow:
    0 0 0 2px rgba(217, 80, 43, 0.35),
    0 1px 3px rgba(21, 32, 27, 0.35);
}

/* Mapbox popups are also raw DOM outside this component's scoped styles —
 * a light shape/shadow override so the popup chrome matches the rest of
 * the app's card treatment; popup *content* classes (text-ink, etc.) come
 * from the app's already-global Tailwind utilities. */
.mapboxgl-popup-content {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-floating);
  padding: 10px 12px;
}
</style>
