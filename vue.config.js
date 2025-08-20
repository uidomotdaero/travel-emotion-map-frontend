const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: [],
  // GitHub Pages 배포 시 사용할 publicPath
  publicPath: process.env.NODE_ENV === 'production'
    ? '/travel-emotion-map/' // GitHub Pages 저장소 이름
    : '/', // 개발 환경에서는 '/'

  // 빌드된 파일이 저장될 경로 설정
  outputDir: '../../..', // C:\Users\songj\Downloads\uidomotdaero\uidomotdaero\ 로 빌드됨

  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
})