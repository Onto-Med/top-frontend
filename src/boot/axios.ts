import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance } from 'axios'
import { DefaultApi, EntityApi, ExpressionOperatorApi, ForkApi, OrganisationApi, RepositoryApi } from '@onto-med/top-api'
import { AxiosStatic } from 'axios'
import { InjectionKey } from 'vue'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
  }
}

export const AxiosKey: InjectionKey<AxiosStatic> = Symbol('axios')
export const DefaultApiKey: InjectionKey<DefaultApi> = Symbol('defaultApi')
export const EntityApiKey: InjectionKey<EntityApi> = Symbol('entityApi')
export const OrganisationApiKey: InjectionKey<OrganisationApi> = Symbol('organisationApi')
export const RepositoryApiKey: InjectionKey<RepositoryApi> = Symbol('repositoryApi')
export const ExpressionOperatorApiKey: InjectionKey<ExpressionOperatorApi> = Symbol('expressionOperatorApi')
export const ForkApiKey: InjectionKey<ForkApi> = Symbol('forkApi')

export default boot(({ app }) => {
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080'
  })
  app.provide(AxiosKey, axios)
  app.provide(DefaultApiKey, new DefaultApi(undefined, '', axiosInstance))
  app.provide(EntityApiKey, new EntityApi(undefined, '', axiosInstance))
  app.provide(OrganisationApiKey, new OrganisationApi(undefined, '', axiosInstance))
  app.provide(RepositoryApiKey, new RepositoryApi(undefined, '', axiosInstance))
  app.provide(ExpressionOperatorApiKey, new ExpressionOperatorApi(undefined, '', axiosInstance))
  app.provide(ForkApiKey, new ForkApi(undefined, '', axiosInstance))
});

