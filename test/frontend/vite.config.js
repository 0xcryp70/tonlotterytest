import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // This allows access from external devices
    proxy: {
      '/auth': 'http://localhost:3002',
      '/steps': 'http://localhost:3002'
    }
  }
});
