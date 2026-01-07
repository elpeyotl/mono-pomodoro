import { defineStore } from 'pinia'

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

interface TimerState {
  currentMode: TimerMode
  isRunning: boolean
}

export const useTimerStore = defineStore('timer', {
  state: (): TimerState => ({
    currentMode: 'focus',
    isRunning: false
  }),
  
  actions: {
    setMode(mode: TimerMode) {
      this.currentMode = mode
    },
    
    setRunning(running: boolean) {
      this.isRunning = running
    }
  }
})
