import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setupVeeValidate } from './utils/vee-validate-config'
import router from './router'
import './index.css'
import App from './App.vue'

// VeeValidateのグローバル設定
setupVeeValidate()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
