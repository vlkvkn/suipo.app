import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { ghPages } from 'vite-plugin-gh-pages';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ghPages({dir: 'dist',branch: 'gh-pages',cname: 'suipo.app'})
  ],
  base: "/",
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});