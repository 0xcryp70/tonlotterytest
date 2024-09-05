import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // This will make Vite listen on 0.0.0.0
    changeOrigin: true,
    secure: false,
    port: 8383,  // You can specify the port, or leave it to default
    proxy: {
      '/auth': 'http://localhost:3002',
      '/steps': 'http://localhost:3002'
    }
  }
});
