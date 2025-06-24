import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', '@revenuecat/purchases-js'],
  },
  // Load environment variables from 'env' file instead of '.env'
  envDir: '.',
  envPrefix: 'VITE_',
});