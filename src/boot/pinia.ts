import { boot } from 'quasar/wrappers'
import { createPinia } from 'pinia'
import { EntityApi, ExpressionOperatorApi, ForkApi, OrganisationApi, RepositoryApi } from '@onto-med/top-api'

export default boot(({ app }) => {
  const pinia = createPinia()
  pinia.use(() => ({
    entityApi: new EntityApi(undefined, '', app.config.globalProperties.$axios),
    expressionOperatorApi: new ExpressionOperatorApi(undefined, '', app.config.globalProperties.$axios),
    forkApi: new ForkApi(undefined, '', app.config.globalProperties.$axios),
    organisationApi: new OrganisationApi(undefined, '', app.config.globalProperties.$axios),
    repositoryApi: new RepositoryApi(undefined, '', app.config.globalProperties.$axios)
  }))
  app.use(pinia)
})
