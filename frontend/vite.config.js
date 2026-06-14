import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
    define: {
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(env.REACT_APP_API_BASE_URL || 'http://localhost:3001'),
      'process.env.REACT_APP_TINYMCE_API_KEY': JSON.stringify(env.REACT_APP_TINYMCE_API_KEY || ''),
      'process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY': JSON.stringify(env.REACT_APP_UPLOADCARE_PUBLIC_KEY || ''),
      'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(env.REACT_APP_GOOGLE_CLIENT_ID || ''),
      'process.env.GENERATE_SOURCEMAP': JSON.stringify(env.GENERATE_SOURCEMAP || 'false'),
      'process.env.VITE_PRICE_API_URL': JSON.stringify(env.VITE_PRICE_API_URL || 'https://razorpay-gateway-yyz0.onrender.com/price'),
      'process.env.VITE_RAZORPAY_KEY_ID': JSON.stringify(env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SzymsJUoBmAKDO'),
      'process.env': {
        REACT_APP_API_BASE_URL: env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
        REACT_APP_TINYMCE_API_KEY: env.REACT_APP_TINYMCE_API_KEY || '',
        REACT_APP_UPLOADCARE_PUBLIC_KEY: env.REACT_APP_UPLOADCARE_PUBLIC_KEY || '',
        REACT_APP_GOOGLE_CLIENT_ID: env.REACT_APP_GOOGLE_CLIENT_ID || '',
        GENERATE_SOURCEMAP: env.GENERATE_SOURCEMAP || 'false',
        VITE_PRICE_API_URL: env.VITE_PRICE_API_URL || 'https://razorpay-gateway-yyz0.onrender.com/price',
        VITE_RAZORPAY_KEY_ID: env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SzymsJUoBmAKDO',
      }
    }
  }
})
