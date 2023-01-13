import { boot } from 'quasar/wrappers'
import { createPinia } from 'pinia'
import { DataSourceApi, DefaultApi, EntityApi, ExpressionConstantApi, ExpressionFunctionApi, ForkApi, OrganisationApi, RepositoryApi } from '@onto-med/top-api'
import { AxiosInstance } from 'axios'

export default boot(({ app }) => {
  const pinia = createPinia()
  pinia.use(() => ({
    entityApi: new EntityApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    expressionConstantApi: new ExpressionConstantApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    expressionFunctionApi: new ExpressionFunctionApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    forkApi: new ForkApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    organisationApi: new OrganisationApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    repositoryApi: new RepositoryApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    dataSourceApi: new DataSourceApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined),
    defaultApi: new DefaultApi(undefined, '', app.config.globalProperties.$axios as AxiosInstance|undefined)
  }))
  app.use(pinia)
})
