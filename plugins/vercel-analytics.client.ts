import { inject } from '@vercel/analytics'

export default defineNuxtPlugin(() => {
  // Only inject analytics in production
  if (process.env.NODE_ENV === 'production') {
    inject()
  }
})
