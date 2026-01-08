<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Prevent body scroll on mobile - only inner containers should scroll */
@media (max-width: 1023px) {
  html, body {
    height: 100%;
    overflow: hidden;
    position: fixed;
    width: 100%;
  }
  
  #__nuxt {
    height: 100%;
    overflow: hidden;
  }
}
</style>
