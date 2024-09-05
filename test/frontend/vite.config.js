import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Bind to all network interfaces
    port: 8383,        // Frontend port
    ws: true,
    proxy: {
      '/auth': 'http://api3.tonlottery.info',
      '/steps': 'http://api3.tonlottery.info'
    }
  }
});
