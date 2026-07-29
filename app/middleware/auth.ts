/**
 * Protects authenticated-only routes. Redirects anonymous visitors to
 * `/login`, preserving the originally-requested path in a `redirect`
 * query param so the login page can send them back after signing in.
 */
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
