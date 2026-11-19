//'createApp(App)': Inicializa la instancia raíz de la aplicación Vue con el componente principal.
//'createPinia()': Instancia el almacén global de estado antes de montar la app.
//'app.use(...)': Instala los plugins esenciales de la arquitectura:
//- Pinia: Estado global compartido.
//- Vue Router: Sistema de enrutamiento y navegación por URLs.
//'app.mount('#app')': Conecta la aplicación compilada al nodo contenedor con id 'app' en index.html.
 
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/estilos/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')