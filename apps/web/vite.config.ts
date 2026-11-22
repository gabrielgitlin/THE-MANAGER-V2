import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Vendor chunks: split heavy dependencies into their own long-cached files.
const VENDOR_CHUNKS: Record<string, string[]> = {
  'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-router', 'scheduler'],
  'vendor-supabase': ['@supabase'],
  'vendor-charts': ['recharts', 'd3-', 'victory-vendor'],
  'vendor-ui': ['framer-motion', 'lucide-react'],
  'vendor-pdf': ['jspdf', 'jspdf-autotable'],
  'vendor-xlsx': ['xlsx'],
};

function vendorChunk(id: string): string | undefined {
  const match = id.split('node_modules/').pop();
  if (!match || !id.includes('node_modules')) return undefined;
  for (const [chunk, pkgs] of Object.entries(VENDOR_CHUNKS)) {
    if (pkgs.some((pkg) => match.startsWith(pkg.endsWith('-') ? pkg : `${pkg}/`))) return chunk;
  }
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
});
