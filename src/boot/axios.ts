import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import { EntityApi } from '@onto-med/top-api'
import { AxiosStatic } from 'axios'
import { InjectionKey } from 'vue'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
  }
}

export const AxiosKey: InjectionKey<AxiosStatic> = Symbol('axios')
export const EntityApiKey: InjectionKey<EntityApi> = Symbol('entityApi')

export default boot(({ app }) => {
  app.provide(AxiosKey, axios)
  app.provide(EntityApiKey, new EntityApi())
});

