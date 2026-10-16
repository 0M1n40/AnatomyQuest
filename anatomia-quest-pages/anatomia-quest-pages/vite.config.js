import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Caminhos relativos: funciona em https://usuario.github.io/NOME-DO-REPO/
  base: './',
  server: { port: 5173 },
});
