import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '',
  build : {
    minify: false
  }
  // optimizeDeps: {
  //   include: ['woff2'],
  // },
  // define: {
  //   'process.env': {},
  //   'process.version': {},
  //   'process.versions.modules': {},
  //   'process.platform': {},
  // }
})
