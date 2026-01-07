<template>
  <div class="space-y-8">
    <!-- Welcome Message -->
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-2">
        {{ user ? `Welcome back, ${user.email?.split('@')[0]}` : 'One task at a time.' }}
      </h1>
      <p class="text-gray-400">
        {{ user ? 'Your focus sessions are synced to the cloud.' : 'You are in guest mode. Login to sync your data.' }}
      </p>
    </div>

    <!-- Main Content: Timer (left) + Tasks (right) on desktop -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <!-- Timer - Left Side -->
      <div class="lg:sticky lg:top-8">
        <PomodoroTimer />
      </div>

      <!-- Task List - Right Side -->
      <div>
        <TaskList />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>
