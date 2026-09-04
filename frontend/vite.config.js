import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    // "@" aponta pra raiz do projeto frontend/ (não pra src/) porque é onde o
    // CLI da animateicons cria lib/utils.ts por padrão — assim os componentes
    // de ícone gerados por "npx animateicons add" funcionam sem editar nada
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})



