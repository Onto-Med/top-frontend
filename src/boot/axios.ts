import { defineBoot } from '#q-app/wrappers'
import axios, { AxiosInstance, AxiosStatic } from 'axios'
import {
  DocumentApi,
  PhraseApi,
  ConceptclusterApi,
  DefaultApi,
  EntityApi,
  OrganisationApi,
  QueryApi,
  RepositoryApi,
  UserApi,
  CodeApi,
  ConceptPipelineApi,
} from '@onto-med/top-api'
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
export const ConceptPipelineApiKey: InjectionKey<ConceptPipelineApi> = Symbol('conceptPipelineApi')
export const UserApiKey: InjectionKey<UserApi> = Symbol('userApi')
export const CodeApiKey: InjectionKey<CodeApi> = Symbol('codeApi')

const api = axios.create({
  baseURL: env.API_URL,
})

export default defineBoot(({ app }) => {
  api.interceptors.request.use(
    (config) => {
      const keycloak = app.config.globalProperties.$keycloak as Keycloak
      if (keycloak && keycloak.token)
        (config.headers as Record<string, unknown>).Authorization = `Bearer ${keycloak.token}`
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  app.config.globalProperties.$axios = api

  app.provide(AxiosKey, axios)
  app.provide(DefaultApiKey, new DefaultApi(undefined, '', api))
  app.provide(EntityApiKey, new EntityApi(undefined, '', api))
  app.provide(OrganisationApiKey, new OrganisationApi(undefined, '', api))
  app.provide(RepositoryApiKey, new RepositoryApi(undefined, '', api))
  app.provide(QueryApiKey, new QueryApi(undefined, '', api))
  app.provide(DocumentApiKey, new DocumentApi(undefined, '', api))
  app.provide(PhraseApiKey, new PhraseApi(undefined, '', api))
  app.provide(ConceptClusterApiKey, new ConceptclusterApi(undefined, '', api))
  app.provide(ConceptPipelineApiKey, new ConceptPipelineApi(undefined, '', api))
  app.provide(UserApiKey, new UserApi(undefined, '', api))
  app.provide(CodeApiKey, new CodeApi(undefined, '', api))
})

export { api }
