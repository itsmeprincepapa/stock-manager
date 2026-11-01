import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuration de Vite : deux plugins
export default defineConfig({
  plugins: [
    // Permet à Vite de comprendre React
    react(),
    // Active Tailwind
    tailwindcss(),
  ],
})