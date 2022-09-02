import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance, AxiosStatic } from 'axios'
import { DefaultApi, EntityApi, ExpressionConstantApi, ExpressionFunctionApi, ForkApi, OrganisationApi, RepositoryApi } from '@onto-med/top-api'
import { InjectionKey } from 'vue'
import { KeycloakInstance } from '@dsb-norge/vue-keycloak-js/dist/types'

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
export const ExpressionConstantApiKey: InjectionKey<ExpressionConstantApi> = Symbol('expressionConstantApi')
export const ExpressionFunctionApiKey: InjectionKey<ExpressionFunctionApi> = Symbol('expressionFunctionApi')
export const ForkApiKey: InjectionKey<ForkApi> = Symbol('forkApi')

export default boot(({ app }) => {
  const axiosInstance = axios.create({
    baseURL: process.env.API_URL
  })
  axiosInstance.interceptors.request.use(config => {
    const keycloak = (app.config.globalProperties.$keycloak as KeycloakInstance)
    if (keycloak && keycloak.token)
      (config.headers as Record<string, unknown>).Authorization = `Bearer ${keycloak.token}`
    return config
  }, error => {
    return Promise.reject(error)
  })

  app.config.globalProperties.$axios = axiosInstance

  app.provide(AxiosKey, axios)
  app.provide(DefaultApiKey, new DefaultApi(undefined, '', axiosInstance))
  app.provide(EntityApiKey, new EntityApi(undefined, '', axiosInstance))
  app.provide(OrganisationApiKey, new OrganisationApi(undefined, '', axiosInstance))
  app.provide(RepositoryApiKey, new RepositoryApi(undefined, '', axiosInstance))
  app.provide(ExpressionConstantApiKey, new ExpressionConstantApi(undefined, '', axiosInstance))
  app.provide(ExpressionFunctionApiKey, new ExpressionFunctionApi(undefined, '', axiosInstance))
  app.provide(ForkApiKey, new ForkApi(undefined, '', axiosInstance))
});

