
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third argument '' allows loading variables without the VITE_ prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Define authorized admin emails (comma separated)
  const defaultAdmins = 'admin@eswatini.football, master@footballeswatini.com, admin@footballeswatini.com';
  
  return {
    plugins: [react()],
    define: {
      // Direct literal replacements for process.env access
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.FOOTBALL_DATA_API_KEY': JSON.stringify(env.FOOTBALL_DATA_API_KEY || env.VITE_FOOTBALL_DATA_API_KEY || ''),
      'process.env.API_FOOTBALL_KEY': JSON.stringify(env.API_FOOTBALL_KEY || env.VITE_API_FOOTBALL_KEY || ''),
      'process.env.ADMIN_EMAIL': JSON.stringify(env.ADMIN_EMAIL || defaultAdmins),
      
      // Global constants as a secondary backup
      '__FOOTBALL_DATA_KEY__': JSON.stringify(env.FOOTBALL_DATA_API_KEY || env.VITE_FOOTBALL_DATA_API_KEY || ''),
      '__API_FOOTBALL_KEY__': JSON.stringify(env.API_FOOTBALL_KEY || env.VITE_API_FOOTBALL_KEY || ''),
    },
  };
});
