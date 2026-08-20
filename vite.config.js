import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sheet-data': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        rewrite: () => '/spreadsheets/d/1AmQHjLeZgxmMQcsPKJ8JkKvSLqaFnhRQ/export?format=csv&gid=1760429901',
      },
    },
  },
})
