import { defineBoot } from '#q-app/wrappers'
import VueKeyCloak from '@dsb-norge/vue-keycloak-js'
import { useEntityStore } from 'src/stores/entity-store'
import useNotify from 'src/mixins/useNotify'
import { VueKeycloakOptions } from '@dsb-norge/vue-keycloak-js'
import { env } from 'src/config'

export default defineBoot(async ({ app }) => {
  const { notify } = useNotify()

  return new Promise((resolve) => {
    if (env.OAUTH2_ENABLED) {
      app.use(VueKeyCloak, {
        init: {
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          checkLoginIframe: false,
          'public-client': true,
        },
        config: {
          url: env.OAUTH2_URL,
          realm: env.OAUTH2_REALM,
          clientId: env.OAUTH2_CLIENT_ID,
        },
        onReady: (keycloak) => {
          const entityStore = useEntityStore()
          entityStore.keycloak = keycloak
          resolve()
        },
        onInitError: () => {
          notify('Keycloak initialisation failed!')
          resolve()
        },
      } as VueKeycloakOptions)
    } else {
      resolve()
    }
  })
})
