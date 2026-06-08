import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    define: {
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(env.REACT_APP_API_BASE_URL || 'http://localhost:3001'),
      'process.env.REACT_APP_TINYMCE_API_KEY': JSON.stringify(env.REACT_APP_TINYMCE_API_KEY || ''),
      'process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY': JSON.stringify(env.REACT_APP_UPLOADCARE_PUBLIC_KEY || ''),
      'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(env.REACT_APP_GOOGLE_CLIENT_ID || ''),
      'process.env.GENERATE_SOURCEMAP': JSON.stringify(env.GENERATE_SOURCEMAP || 'false'),
      'process.env': {
        REACT_APP_API_BASE_URL: env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
        REACT_APP_TINYMCE_API_KEY: env.REACT_APP_TINYMCE_API_KEY || '',
        REACT_APP_UPLOADCARE_PUBLIC_KEY: env.REACT_APP_UPLOADCARE_PUBLIC_KEY || '',
        REACT_APP_GOOGLE_CLIENT_ID: env.REACT_APP_GOOGLE_CLIENT_ID || '',
        GENERATE_SOURCEMAP: env.GENERATE_SOURCEMAP || 'false',
      }
    }
  }
})
