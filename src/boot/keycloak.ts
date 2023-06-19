import { boot } from 'quasar/wrappers'
import VueKeyCloak from '@dsb-norge/vue-keycloak-js'
import { useEntity } from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import { VueKeycloakOptions } from '@dsb-norge/vue-keycloak-js/dist/types'
import { env } from 'src/config'

export default boot(async ({ app }) => {
  const { notify } = useNotify()

  return new Promise(resolve => {
    if (env.AUTH_ENABLED) {
      app.use(VueKeyCloak, {
        init: {
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false,
          'public-client': true
        },
        config: {
          url:      env.OAUTH2_URL,
          realm:    env.OAUTH2_REALM,
          clientId: env.OAUTH2_CLIENT_ID
        },
        onReady: (keycloak) => {
          const entityStore = useEntity()
          entityStore.keycloak = keycloak
          resolve()
        },
        onInitError: () => {
          notify('Keycloak initialisation failed!')
          resolve()
        }
      } as VueKeycloakOptions)
    } else {
      resolve()
    }
  })
})
