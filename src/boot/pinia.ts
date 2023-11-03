import { boot } from 'quasar/wrappers'
import { createPinia } from 'pinia'
import { DefaultApi, EntityApi, OrganisationApi, QueryApi, RepositoryApi, CodeApi, UserApi } from '@onto-med/top-api'
import { AxiosInstance } from 'axios'

export default boot(({ app }) => {
  const pinia = createPinia()
  pinia.use(() => ({
    entityApi: new EntityApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    organisationApi: new OrganisationApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    repositoryApi: new RepositoryApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    defaultApi: new DefaultApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    queryApi: new QueryApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    codeApi: new CodeApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    userApi: new UserApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined)
  }))
  app.use(pinia)
})
