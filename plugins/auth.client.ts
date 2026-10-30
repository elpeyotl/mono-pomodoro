export default defineNuxtPlugin(() => {
  const user = useAuthUser()
  const session = authClient.useSession()

  watch(session, (s) => {
    if (s.isPending) return
    const u = s.data?.user
    // Nur bei echtem Wechsel neu setzen, sonst laden die Stores bei jedem Session-Refresh neu
    if (u?.id !== user.value?.id) {
      user.value = u ? { id: u.id, email: u.email, name: u.name } : null
    }
  }, { immediate: true, deep: true })
})
