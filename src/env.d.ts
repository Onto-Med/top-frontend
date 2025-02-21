declare module 'uuid'

declare module '@lhncbc/ucum-lhc'

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined
    VUE_ROUTER_BASE: string | undefined
    OAUTH2_ENABLED: string
    OAUTH2_URL: string
    OAUTH2_REALM: string
    OAUTH2_CLIENT_ID: string
    API_URL: string
    GDPR_NOTICE: string
    GDPR_POLICY_URL: string | undefined
    SYSTEM_NOTICE: string | undefined
    DOCUMENTS_ENABLED: string
    TOP_PHENOTYPIC_QUERY_DOC_BASE_URL: string
  }
}
