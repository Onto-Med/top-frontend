declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    AUTH_ENABLED: boolean;
    OAUTH2_URL: string;
    OAUTH2_REALM: string;
    OAUTH2_CLIENT_ID: string;
    API_URL: string;
    GDPR_NOTICE: boolean;
    GDPR_POLICY_URL: string | undefined;
  }
}
