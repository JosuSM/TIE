import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/TIE/', // Sets up CSS and JS paths correctly for josusm.github.io/TIE
})
