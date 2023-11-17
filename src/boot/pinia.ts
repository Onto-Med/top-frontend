import { boot } from 'quasar/wrappers'
import { createPinia } from 'pinia'
import { DefaultApi, EntityApi, OrganisationApi, QueryApi, RepositoryApi, CodeApi, UserApi } from '@onto-med/top-api'
import { AxiosInstance } from 'axios'

export default boot(({ app }) => {
  const pinia = createPinia()
  const axios = app.config.globalProperties.$axios as AxiosInstance | undefined
  pinia.use(() => ({
    entityApi: new EntityApi(undefined, '', axios),
    organisationApi: new OrganisationApi(undefined, '', axios),
    repositoryApi: new RepositoryApi(undefined, '', axios),
    defaultApi: new DefaultApi(undefined, '', axios),
    queryApi: new QueryApi(undefined, '', axios),
    codeApi: new CodeApi(undefined, '', axios),
    userApi: new UserApi(undefined, '', axios)
  }))
  app.use(pinia)
})
