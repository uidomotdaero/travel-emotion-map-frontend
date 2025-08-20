import { createApp } from 'vue'
import App from './App.vue'

// window.kakao 객체 확인
window.kakao = window.kakao || {}

const app = createApp(App)
app.mount('#app')
