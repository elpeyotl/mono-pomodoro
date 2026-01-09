/**
 * Confetti Composable for Gamification
 * Provides mini confetti for task completion and big celebration for milestones
 */

import confetti from 'canvas-confetti'

export function useConfetti() {
  /**
   * Mini confetti burst at a specific element position
   * Used when a single task is completed
   */
  function miniConfetti(element?: HTMLElement | null) {
    if (typeof window === 'undefined') return
    
    // Default to center if no element provided
    let x = 0.5
    let y = 0.5
    
    if (element) {
      const rect = element.getBoundingClientRect()
      x = (rect.left + rect.width / 2) / window.innerWidth
      y = (rect.top + rect.height / 2) / window.innerHeight
    }
    
    // Small, subtle confetti burst
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { x, y },
      colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7'], // Green shades
      scalar: 0.6,
      gravity: 1.2,
      drift: 0,
      ticks: 80,
      disableForReducedMotion: true
    })
  }
  
  /**
   * Big celebration confetti
   * Used when all tasks of a tag or all tasks are completed
   */
  function celebrationConfetti() {
    if (typeof window === 'undefined') return
    
    const duration = 2000
    const animationEnd = Date.now() + duration
    const colors = ['#22c55e', '#10b981', '#f59e0b', '#eab308', '#8b5cf6', '#a855f7']
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        disableForReducedMotion: true
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        disableForReducedMotion: true
      })
      
      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame)
      }
    }
    
    frame()
    
    // Center burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
        scalar: 1.2,
        disableForReducedMotion: true
      })
    }, 300)
  }
  
  /**
   * Firework-style confetti
   * Alternative celebration style
   */
  function fireworkConfetti() {
    if (typeof window === 'undefined') return
    
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      disableForReducedMotion: true
    }
    
    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }
    
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#22c55e', '#10b981']
    })
    fire(0.2, {
      spread: 60,
      colors: ['#f59e0b', '#eab308']
    })
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#8b5cf6', '#a855f7']
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#22c55e', '#f59e0b', '#8b5cf6']
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#10b981', '#eab308', '#a855f7']
    })
  }
  
  return {
    miniConfetti,
    celebrationConfetti,
    fireworkConfetti
  }
}
