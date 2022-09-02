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
          url:      process.env.OAUTH2_URL,
          realm:    process.env.OAUTH2_REALM,
          clientId: process.env.OAUTH2_CLIENT_ID
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
