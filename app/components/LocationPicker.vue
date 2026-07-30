<script setup lang="ts">
// Client-only Mapbox GL single-pin location picker, used by BusinessForm's
// Location section *alongside* (not instead of) the plain lat/lng number
// inputs — dragging/clicking the pin here and typing into those inputs
// both drive the same `state.lat`/`state.lng`, kept in sync in both
// directions (see the props watcher below).
//
// Deliberately a separate small component rather than a third MapView
// "mode": MapView's job is rendering a *list* of business markers from a
// `businesses` prop (multi-marker, popups, "search this area", fit-to-
// bounds) — none of that applies to a single free-form draggable pin, and
// bolting picker-only branches (drag handling, click-to-place, external
// lat/lng sync) onto every one of MapView's methods would make an already
// long component harder to follow for both use cases. What *is* shared
// (the lazy `import('mapbox-gl')`, reading the token from runtime config,
// the "no token -> plain graceful message" fallback) is intentionally
// duplicated here rather than factored out of MapView, since it's a
// handful of lines against MapView's ~250 lines of marker/popup logic that
// don't apply here at all.

import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl'

const props = withDefaults(defineProps<{
  lat?: number | null
  lng?: number | null
  disabled?: boolean
}>(), {
  lat: null,
  lng: null,
  disabled: false,
})

const emit = defineEmits<{
  /**
   * Fired only when the pin is moved by a genuine user gesture (drag or
   * map click) — never as a reaction to the `lat`/`lng` props changing
   * from outside (typing in the numeric inputs, "use my current
   * location"), which only ever moves the marker programmatically. That
   * one-directional split, plus the `lastEmitted` echo-check in the props
   * watcher below, is what keeps the two-way sync from feeding back into
   * itself.
   */
  'update:location': [location: { lat: number, lng: number }]
}>()

// Same default Zimbabwe-wide view as MapView.vue's own DEFAULT_CENTER/
// DEFAULT_ZOOM — kept identical rather than inventing a second "sensible
// default" elsewhere in the app.
const DEFAULT_CENTER: [number, number] = [30.0, -19.0]
const DEFAULT_ZOOM = 5.5
const PIN_ZOOM = 14

const config = useRuntimeConfig()
const mapboxToken = config.public.mapboxToken

const mapContainer = ref<HTMLDivElement | null>(null)
const loadError = ref<string | null>(null)
const mapReady = ref(false)

// See MapView.vue's identical comment: the module's default export (the
// `mapboxgl` namespace object) is what's actually used at runtime.
let mapboxgl: typeof import('mapbox-gl')['default'] | null = null
let map: MapboxMap | null = null
let marker: MapboxMarker | null = null

// True for the duration of a user-driven drag — the props watcher skips
// programmatic `setLngLat` calls while this is set, so a stale prop value
// (from before the drag's `dragend` has round-tripped back through the
// parent) can't yank the marker back mid-gesture.
let dragging = false

// The most recent {lat, lng} *this component* emitted, so the props
// watcher can tell "the parent just echoed back what we told it" apart
// from "the number inputs changed externally" and skip re-driving the map
// for the former — the actual feedback-loop guard.
let lastEmitted: { lat: number, lng: number } | null = null

function round(value: number): number {
  // Same ~11cm precision as BusinessForm's existing "use my current
  // location" handler, so an emitted value and its round-tripped prop
  // compare equal.
  return Math.round(value * 1e6) / 1e6
}

function hasCoords(lat: number | null | undefined, lng: number | null | undefined): lat is number {
  return typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng)
}

function createPinElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'zelp-map-pin'
  el.setAttribute('role', 'img')
  el.setAttribute('aria-label', 'Business location — drag to adjust')
  return el
}

function placeOrMoveMarker(lngLat: [number, number]) {
  if (!map || !mapboxgl) return
  if (marker) {
    marker.setLngLat(lngLat)
    return
  }
  marker = new mapboxgl.Marker({ element: createPinElement(), anchor: 'bottom', draggable: !props.disabled })
    .setLngLat(lngLat)
    .addTo(map)

  marker.on('dragstart', () => { dragging = true })
  marker.on('dragend', () => {
    dragging = false
    const position = marker!.getLngLat()
    const location = { lat: round(position.lat), lng: round(position.lng) }
    lastEmitted = location
    emit('update:location', location)
  })
}

function handleMapClick(lat: number, lng: number) {
  if (props.disabled || !map || !mapboxgl) return
  const location = { lat: round(lat), lng: round(lng) }
  placeOrMoveMarker([location.lng, location.lat])
  lastEmitted = location
  emit('update:location', location)
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

    const initialHasPin = hasCoords(props.lat, props.lng)
    const initialCenter: [number, number] = initialHasPin ? [props.lng as number, props.lat as number] : DEFAULT_CENTER
    const initialZoom = initialHasPin ? PIN_ZOOM : DEFAULT_ZOOM

    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: true,
      // Embedded inside a normal scrolling form — cooperative gestures
      // (ctrl/two-finger to zoom) stop scroll-wheel from trapping page
      // scroll the moment the cursor crosses the map, same reasoning as
      // MapView's 'mini' mode.
      cooperativeGestures: true,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('error', (event) => {
      console.error('[LocationPicker] Mapbox GL error:', event.error)
      if (!mapReady.value) loadError.value = 'The map failed to load. Please try again later.'
    })

    if (!props.disabled) {
      map.on('click', (event) => handleMapClick(event.lngLat.lat, event.lngLat.lng))
    }

    map.on('load', () => {
      mapReady.value = true
      if (initialHasPin) placeOrMoveMarker(initialCenter)
    })
  } catch (error) {
    console.error('[LocationPicker] Failed to initialize Mapbox GL:', error)
    loadError.value = 'The map failed to load. Please try again later.'
  }
}

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  marker?.remove()
  map?.remove()
  map = null
})

// External changes (typing into the lat/lng number inputs, "use my
// current location") flow in here and move the marker programmatically.
// This branch never emits `update:location` itself, and the `lastEmitted`
// echo-check above skips re-driving the map when what flowed back in is
// just this component's own previous emit — together those two things are
// what stop drag/click <-> props from looping.
watch(() => [props.lat, props.lng], ([lat, lng]) => {
  if (!mapReady.value) return

  if (!hasCoords(lat, lng)) {
    // Coordinates were cleared externally (e.g. the number inputs were
    // emptied) — this component never emits null, so a null here is
    // unambiguously an external change, not an echo.
    marker?.remove()
    marker = null
    lastEmitted = null
    return
  }

  if (dragging) return

  const rounded = { lat: round(lat as number), lng: round(lng as number) }
  if (lastEmitted && lastEmitted.lat === rounded.lat && lastEmitted.lng === rounded.lng) {
    // Echo of our own emit round-tripping back through the parent's
    // state — the marker is already exactly here, nothing to do.
    lastEmitted = null
    return
  }

  const lngLat: [number, number] = [rounded.lng, rounded.lat]
  placeOrMoveMarker(lngLat)
  if (map) map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), PIN_ZOOM), duration: 300 })
})
</script>

<template>
  <div class="relative h-full w-full overflow-hidden rounded-[14px] border border-line">
    <!-- Missing/empty runtime token — degrade to just the numeric inputs
         above rather than showing a broken map. -->
    <div
      v-if="!mapboxToken"
      class="bg-stone flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-2 p-6 text-center"
    >
      <UIcon name="i-lucide-map-off" class="text-ink-faint size-7" />
      <p class="text-ink-faint max-w-xs text-xs">
        Map picker unavailable — missing configuration. You can still enter coordinates manually above.
      </p>
    </div>

    <ClientOnly v-else>
      <div ref="mapContainer" class="h-full min-h-[220px] w-full" />

      <div
        v-if="loadError"
        class="bg-stone absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center"
      >
        <UIcon name="i-lucide-alert-circle" class="text-closed-500 size-7" />
        <p class="text-ink-faint max-w-xs text-xs">
          {{ loadError }}
        </p>
      </div>

      <p
        v-else-if="mapReady && !hasCoords(lat, lng)"
        class="zelp-surface text-ink-muted pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 px-3 py-1.5 text-center text-xs"
      >
        Click the map to drop a pin
      </p>

      <template #fallback>
        <div class="bg-stone h-full min-h-[220px] w-full" />
      </template>
    </ClientOnly>
  </div>
</template>

<style>
/* The marker DOM node is created imperatively by Mapbox GL, not part of
 * this component's Vue-rendered template, so `<style scoped>` wouldn't
 * reach it — this rule is intentionally global, same as MapView.vue's
 * identical `.zelp-map-pin` rule. It's duplicated here (rather than
 * imported/shared) because pages that use LocationPicker without also
 * using MapView (e.g. /business/new) aren't guaranteed to have MapView's
 * own SFC style block in their bundle. */
.zelp-map-pin {
  width: 30px;
  height: 35px;
  background-image: url('/brand/zelp-icon.svg');
  background-size: contain;
  background-repeat: no-repeat;
  cursor: grab;
  filter: drop-shadow(0 2px 3px rgba(21, 32, 27, 0.28));
}

.zelp-map-pin:active {
  cursor: grabbing;
}
</style>
