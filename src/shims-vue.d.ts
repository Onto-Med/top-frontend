import type { Quasar } from 'quasar'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $q: Quasar
  }
}
