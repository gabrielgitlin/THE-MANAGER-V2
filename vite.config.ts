import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Enable source maps for debugging
    sourcemap: false,
    // Chunk size warning at 500KB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split heavy deps into separate files
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-xlsx': ['xlsx'],
        },
      },
    },
    // Minification
    minify: 'esbuild',
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'recharts',
      'zustand',
      'lucide-react',
    ],
  },
});
