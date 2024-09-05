import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'my-test-container',  // Make Vite listen on 'my-test-container'
    changeOrigin: true,
    secure: false,
    ws: true,
    port: 8383,  // You can specify the port, or leave it to default
    proxy: {
      '/auth': 'http://localhost:3002',
      '/steps': 'http://localhost:3002'
    }
  }
});
