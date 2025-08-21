const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: 'docs',
  publicPath: process.env.NODE_ENV === 'production'
    ? '/travel-emotion-map-frontend/'
    : '/',
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})