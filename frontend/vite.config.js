

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use root-relative assets so the app works whether GitHub Pages serves
  // at the repo root or under a project subpath.
  base: '/',
})


