/**
 * Keeps already-authenticated users off guest-only routes
 * (login, signup) by redirecting them to the home page.
 */
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()

  if (user.value) {
    return navigateTo('/')
  }
})
