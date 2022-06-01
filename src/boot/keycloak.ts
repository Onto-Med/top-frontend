import { boot } from 'quasar/wrappers'
import VueKeyCloak from '@dsb-norge/vue-keycloak-js'
import { KeycloakInstance } from '@dsb-norge/vue-keycloak-js/dist/types'
import { useEntity } from 'src/pinia/entity'

export default boot(async ({ app }) => {
  return new Promise(resolve => {
    if (process.env.AUTH_ENABLED) {
      app.use(VueKeyCloak, {
        init: {
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false,
          'public-client': true
        },
        config: {
          url: 'http://127.0.0.1:8081/',
          realm: 'myrealm',
          clientId: 'app-vue'
        },
        onReady: (keycloak: KeycloakInstance) => {
          const entityStore = useEntity()
          entityStore.keycloak = keycloak
          resolve()
        }
      })
    } else {
      resolve()
    }
  })
})
