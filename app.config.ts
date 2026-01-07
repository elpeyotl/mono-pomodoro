export default defineAppConfig({
  ui: {
    // Globale Dark Mode Styles für alle Komponenten
    primary: 'emerald',
    gray: 'neutral',
    
    // UCard Dark Mode Styling
    card: {
      base: 'overflow-hidden',
      background: 'bg-gray-900 dark:bg-gray-900',
      divide: 'divide-y divide-gray-800 dark:divide-gray-800',
      ring: 'ring-1 ring-gray-800 dark:ring-gray-800',
      rounded: 'rounded-lg',
      shadow: 'shadow-lg',
      body: {
        base: '',
        background: '',
        padding: 'px-4 py-5 sm:p-6'
      },
      header: {
        base: '',
        background: 'bg-gray-900/50 dark:bg-gray-900/50',
        padding: 'px-4 py-5 sm:px-6'
      },
      footer: {
        base: '',
        background: 'bg-gray-900/50 dark:bg-gray-900/50',
        padding: 'px-4 py-4 sm:px-6'
      }
    },
    
    // Button Styling
    button: {
      color: {
        gray: {
          outline: 'ring-1 ring-inset ring-gray-700 text-gray-300 dark:text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-800'
        }
      }
    },
    
    // Input Styling für Dark Mode
    input: {
      color: {
        white: {
          outline: 'bg-gray-900 dark:bg-gray-900 text-gray-100 dark:text-gray-100 ring-1 ring-inset ring-gray-700 dark:ring-gray-700'
        }
      }
    }
  }
})
