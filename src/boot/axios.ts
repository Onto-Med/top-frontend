import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import { EntityApi, ExpressionOperatorApi, ForkApi, OrganisationApi, RepositoryApi } from '@onto-med/top-api'
import { AxiosStatic } from 'axios'
import { InjectionKey } from 'vue'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
  }
}

export const AxiosKey: InjectionKey<AxiosStatic> = Symbol('axios')
export const EntityApiKey: InjectionKey<EntityApi> = Symbol('entityApi')
export const OrganisationApiKey: InjectionKey<OrganisationApi> = Symbol('organisationApi')
export const RepositoryApiKey: InjectionKey<RepositoryApi> = Symbol('repositoryApi')
export const ExpressionOperatorApiKey: InjectionKey<ExpressionOperatorApi> = Symbol('expressionOperatorApi')
export const ForkApiKey: InjectionKey<ForkApi> = Symbol('forkApi')

export default boot(({ app }) => {
  app.provide(AxiosKey, axios)
  app.provide(EntityApiKey, new EntityApi())
  app.provide(OrganisationApiKey, new OrganisationApi())
  app.provide(RepositoryApiKey, new RepositoryApi())
  app.provide(ExpressionOperatorApiKey, new ExpressionOperatorApi())
  app.provide(ForkApiKey, new ForkApi())
});

