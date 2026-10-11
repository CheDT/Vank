import { defineConfig } from 'vite';

const apiProxy = {
  '/api': { target: `http://127.0.0.1:${process.env.PORT || 3001}` }
};

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: Number(process.env.VANK_FRONTEND_PORT || 5173), strictPort: true, proxy: apiProxy },
  preview: { host: '127.0.0.1', proxy: apiProxy }
});
