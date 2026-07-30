<script setup lang="ts">
// The signed-in user's own profile view. There's no public "view someone
// else's profile" route in the required page list — this is always "my
// profile", never a `[id]`/`[username]` param.

definePageMeta({
  middleware: 'auth',
  robots: false,
})

const { data: profile, status } = useMyProfile()
const pending = computed(() => status.value === 'pending')

const socialEntries = computed(() => {
  const socials = profile.value?.socials
  if (!socials) return []
  return Object.entries(socials).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
})

useSeoMeta({
  title: 'Your profile',
  description: 'Your Zelp account profile.',
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-5 py-8">
    <div v-if="pending" class="flex items-center gap-4">
      <USkeleton class="bg-ink-100 size-16 shrink-0 rounded-full" />
      <div class="flex flex-1 flex-col gap-2">
        <USkeleton class="bg-ink-100 h-5 w-40" />
        <USkeleton class="bg-ink-100 h-3.5 w-28" />
      </div>
    </div>

    <template v-else-if="profile">
      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          <ProfileAvatar :avatar-url="profile.avatarUrl" :name="profile.fullName || profile.username" size="xl" />
          <div class="flex flex-col">
            <h1 class="text-ink text-xl font-semibold">
              {{ profile.fullName || 'Your name isn\'t set yet' }}
            </h1>
            <span v-if="profile.username" class="text-ink-muted text-sm">@{{ profile.username }}</span>
          </div>
        </div>

        <UButton to="/profile/edit" label="Edit profile" icon="i-lucide-pencil" variant="outline" color="neutral" />
      </div>

      <p v-if="profile.bio" class="text-ink-muted mb-6 text-sm whitespace-pre-line">
        {{ profile.bio }}
      </p>

      <div class="flex flex-col gap-2.5 text-sm">
        <p v-if="profile.location" class="text-ink-muted flex items-center gap-2">
          <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
          {{ profile.location }}
        </p>
        <a
          v-if="profile.website"
          :href="profile.website"
          target="_blank"
          rel="noopener noreferrer"
          class="text-ink-muted hover:text-flame-500 flex items-center gap-2"
        >
          <UIcon name="i-lucide-globe" class="size-4 shrink-0" />
          <span class="truncate">{{ profile.website }}</span>
        </a>
        <div v-if="socialEntries.length" class="flex flex-wrap gap-2 pt-1">
          <UBadge
            v-for="[platform, url] in socialEntries"
            :key="platform"
            :label="platform"
            variant="subtle"
            color="neutral"
            :to="url"
            target="_blank"
          />
        </div>
      </div>

      <EmptyState
        v-if="!profile.bio && !profile.location && !profile.website && !socialEntries.length"
        icon="i-lucide-user"
        title="Your profile is looking a little empty"
        description="Add a bio, location or links so other Zelp users can get to know you."
      >
        <template #actions>
          <UButton to="/profile/edit" label="Edit profile" />
        </template>
      </EmptyState>
    </template>
  </div>
</template>
