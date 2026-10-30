import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt'
  ],

  // Vercel Deployment - SSR aktiviert für beste Performance
  // Vercel erkennt Nuxt 3 automatisch und verwendet das richtige Preset
  nitro: {
    preset: 'vercel'
  },

  // Nuxt UI Konfiguration (Icons werden automatisch geladen)
  ui: {},

  // Pinia Konfiguration
  pinia: {
    storesDirs: ['./stores/**']
  },

  // PWA Konfiguration
  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Mono - Pomodoro Focus App',
      short_name: 'Mono',
      description: 'Minimalist Pomodoro & Task Focus App with beautiful wave animations',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      // /api/* nie aus dem Service Worker bedienen: OAuth-Callback und Verifizierungs-
      // Links sind Navigationen und dürfen nicht auf '/' umgebogen werden
      navigateFallbackDenylist: [/^\/api\//]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600 // Check for updates every hour
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  },

  // App Konfiguration
  app: {
    head: {
      title: 'Mono - Pomodoro Focus App',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { name: 'description', content: 'Free minimalist Pomodoro timer with task management. Focus on one task at a time with beautiful wave animations. Works offline as a PWA.' },
        { name: 'theme-color', content: '#0f172a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Mono' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        // Open Graph
        { property: 'og:title', content: 'Mono - Pomodoro Focus App' },
        { property: 'og:description', content: 'Free minimalist Pomodoro timer with task management. Focus on one task at a time.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://monopomodoro.app' },
        { property: 'og:image', content: 'https://monopomodoro.app/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:site_name', content: 'Mono Pomodoro' },
        { property: 'og:locale', content: 'en_US' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Mono - Pomodoro Focus App' },
        { name: 'twitter:description', content: 'Free minimalist Pomodoro timer with task management. Focus on one task at a time.' },
        { name: 'twitter:image', content: 'https://monopomodoro.app/og-image.png' },
        // Additional SEO
        { name: 'author', content: 'Mono Pomodoro' },
        { name: 'robots', content: 'index, follow' },
        { name: 'keywords', content: 'pomodoro, timer, focus, productivity, task management, pwa, offline' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'shortcut icon', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/pwa-192x192.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'canonical', href: 'https://monopomodoro.app' }
      ]
    }
  },

  // Tailwind Dark Mode
  colorMode: {
    preference: 'dark'
  },

  // Runtime Config für Environment Variables
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://monopomodoro.app',
      appVersion: pkg.version
    }
  },

  compatibilityDate: '2024-01-01'
})
