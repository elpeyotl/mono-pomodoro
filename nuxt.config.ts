// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vueuse/nuxt'
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

  // App Konfiguration
  app: {
    head: {
      title: 'Mono - Pomodoro Focus App',
      meta: [
        { name: 'description', content: 'Minimalist Pomodoro & Task Focus App with beautiful wave animations' },
        { name: 'theme-color', content: '#0f172a' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
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
