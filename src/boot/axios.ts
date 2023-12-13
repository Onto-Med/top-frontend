import { boot } from 'quasar/wrappers'
import axios, { AxiosInstance, AxiosStatic } from 'axios'
import { DocumentApi, PhraseApi, ConceptclusterApi, DefaultApi, EntityApi, OrganisationApi, QueryApi, RepositoryApi, UserApi, CodeApi } from '@onto-med/top-api'
import { InjectionKey } from 'vue'
import { Keycloak } from '@dsb-norge/vue-keycloak-js/dist/types'
import { env } from 'src/config'

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
export const QueryApiKey: InjectionKey<QueryApi> = Symbol('queryApi')
export const DocumentApiKey: InjectionKey<DocumentApi> = Symbol('documentApi')
export const PhraseApiKey: InjectionKey<PhraseApi> = Symbol('phraseApi')
export const ConceptClusterApiKey: InjectionKey<ConceptclusterApi> = Symbol('conceptClusterApi')
export const UserApiKey: InjectionKey<UserApi> = Symbol('userApi')
export const CodeApiKey: InjectionKey<CodeApi> = Symbol('codeApi')

export default boot(({ app }) => {
  const axiosInstance = axios.create({
    baseURL: env.API_URL
  })
  axiosInstance.interceptors.request.use(config => {
    const keycloak = app.config.globalProperties.$keycloak as Keycloak
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
  app.provide(QueryApiKey, new QueryApi(undefined, '', axiosInstance))
  app.provide(DocumentApiKey, new DocumentApi(undefined, '', axiosInstance))
  app.provide(PhraseApiKey, new PhraseApi(undefined, '', axiosInstance))
  app.provide(ConceptClusterApiKey, new ConceptclusterApi(undefined, '', axiosInstance))
  app.provide(UserApiKey, new UserApi(undefined, '', axiosInstance))
  app.provide(CodeApiKey, new CodeApi(undefined, '', axiosInstance))
});

