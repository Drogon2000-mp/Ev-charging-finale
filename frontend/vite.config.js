

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages deployments under a subpath.
// If you host at a custom root domain (e.g. https://example.com/), change base to '/'.
export default defineConfig({
  plugins: [react()],
  base: '/Ev-charging-Finale-main/',
})

