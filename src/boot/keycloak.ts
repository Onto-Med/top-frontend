import { boot } from 'quasar/wrappers'
import VueKeyCloak from '@dsb-norge/vue-keycloak-js'
import axios from 'axios'
import { InjectionKey } from 'vue'
import { KeycloakInstance } from '@dsb-norge/vue-keycloak-js/dist/types'

export const KeycloakKey: InjectionKey<unknown> = Symbol('keycloak')

export default boot(async ({ app }) => {
  function tokenInterceptor () {
    axios.interceptors.request.use(config => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
      config.headers.Authorization = `Bearer ${app.config.globalProperties.$keycloak.token}`
      return config
    }, error => {
      return Promise.reject(error)
    })
  }

  return new Promise(resolve => {
    app.use(VueKeyCloak, {
      init: {
        onLoad: 'login-required',
        checkLoginIframe: false
      },
      config: {
        url: 'http://127.0.0.1:8080/',
        realm: 'myrealm',
        clientId: 'app-vue'
      },
      onReady: (keycloak: KeycloakInstance) => {
        void tokenInterceptor()
        app.provide(KeycloakKey, keycloak)
        resolve()
      }
    })
  })
})
