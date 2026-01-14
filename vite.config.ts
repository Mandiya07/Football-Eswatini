
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Define authorized admin emails (comma separated)
  const defaultAdmins = 'admin@eswatini.football, master@footballeswatini.com, admin@footballeswatini.com';
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.FOOTBALL_DATA_API_KEY': JSON.stringify(env.FOOTBALL_DATA_API_KEY),
      'process.env.ADMIN_EMAIL': JSON.stringify(env.ADMIN_EMAIL || defaultAdmins),
    },
  };
});
