// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
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

  // Supabase Konfiguration
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: undefined,
      exclude: ['/*'], // Alle Seiten sind für Gäste zugänglich
      cookieRedirect: false
    }
  },

  // Pinia Konfiguration
  pinia: {
    storesDirs: ['./stores/**']
  },

  // PWA Konfiguration
  pwa: {
    registerType: 'autoUpdate',
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
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
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
      meta: [
        { name: 'description', content: 'Minimalist Pomodoro & Task Focus App with beautiful wave animations' },
        { name: 'theme-color', content: '#0f172a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Mono' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { property: 'og:title', content: 'Mono - Pomodoro Focus App' },
        { property: 'og:description', content: 'Minimalist Pomodoro & Task Focus App with beautiful wave animations' },
        { property: 'og:type', content: 'website' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'shortcut icon', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/pwa-192x192.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' }
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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },

  compatibilityDate: '2024-01-01'
})
