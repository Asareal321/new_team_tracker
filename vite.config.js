import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Temporary: emit source maps so production stack traces are readable
    // while diagnosing the board crash. Can be removed once resolved.
    sourcemap: true,
  },
})
