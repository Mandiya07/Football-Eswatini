
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Define authorized admin emails (comma separated)
  const defaultAdmins = 'admin@eswatini.football, master@footballeswatini.com, admin@footballeswatini.com';
  
  // PRODUCTION KEYS PROVIDED BY USER
  const FOOTBALL_DATA_DEFAULT = 'ce4539218db6423cbbc6e9dd409f1e34';
  const API_FOOTBALL_DEFAULT = 'f3d2acc1bcb78da93841c0792745b828';

  return {
    plugins: [react()],
    define: {
      // Direct literal replacements for process.env access
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
      
      // Prioritize Environment Variable > User Provided Default
      'process.env.FOOTBALL_DATA_API_KEY': JSON.stringify(env.FOOTBALL_DATA_API_KEY || env.VITE_FOOTBALL_DATA_API_KEY || FOOTBALL_DATA_DEFAULT),
      'process.env.API_FOOTBALL_KEY': JSON.stringify(env.API_FOOTBALL_KEY || env.VITE_API_FOOTBALL_KEY || API_FOOTBALL_DEFAULT),
      
      'process.env.ADMIN_EMAIL': JSON.stringify(env.ADMIN_EMAIL || defaultAdmins),
      
      // Global constants as a secondary backup
      '__FOOTBALL_DATA_KEY__': JSON.stringify(env.FOOTBALL_DATA_API_KEY || env.VITE_FOOTBALL_DATA_API_KEY || FOOTBALL_DATA_DEFAULT),
      '__API_FOOTBALL_KEY__': JSON.stringify(env.API_FOOTBALL_KEY || env.VITE_API_FOOTBALL_KEY || API_FOOTBALL_DEFAULT),
    },
  };
});
