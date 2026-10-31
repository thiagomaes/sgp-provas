import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    server: {
      // A API publicada só libera o CORS para o site publicado. Em
      // desenvolvimento, a web chama /api na própria origem e o Vite repassa
      // para o VITE_API_URL (ver src/services/http.ts).
      proxy: env.VITE_API_URL
        ? {
            '/api': {
              target: env.VITE_API_URL,
              changeOrigin: true,
              rewrite: (caminho) => caminho.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
  }
})
