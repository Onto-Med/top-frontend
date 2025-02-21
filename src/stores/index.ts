import { defineStore } from '#q-app/wrappers'
import { createPinia } from 'pinia'
import {
  DefaultApi,
  EntityApi,
  OrganisationApi,
  QueryApi,
  RepositoryApi,
  CodeApi,
  UserApi,
} from '@onto-med/top-api'
import { api } from 'src/boot/axios'

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module 'pinia' {
  export interface PiniaCustomProperties {
    readonly codeApi: CodeApi
    readonly defaultApi: DefaultApi
    readonly entityApi: EntityApi
    readonly organisationApi: OrganisationApi
    readonly queryApi: QueryApi
    readonly repositoryApi: RepositoryApi
    readonly userApi: UserApi
  }
}

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia()

  const axios = api
  pinia.use(() => ({
    entityApi: new EntityApi(undefined, '', axios),
    organisationApi: new OrganisationApi(undefined, '', axios),
    repositoryApi: new RepositoryApi(undefined, '', axios),
    defaultApi: new DefaultApi(undefined, '', axios),
    queryApi: new QueryApi(undefined, '', axios),
    codeApi: new CodeApi(undefined, '', axios),
    userApi: new UserApi(undefined, '', axios),
  }))

  return pinia
})
