export const env = {
  AUTH_ENABLED:     process.env.AUTH_ENABLED || false,
  OAUTH2_URL:       process.env.OAUTH2_URL || 'http://127.0.0.1:8081',
  OAUTH2_REALM:     process.env.OAUTH2_REALM || 'top-realm',
  OAUTH2_CLIENT_ID: process.env.OAUTH2_CLIENT_ID || 'top-frontend',
  API_URL:          process.env.API_URL || 'http://127.0.0.1:8080',
  GDPR_NOTICE:      process.env.GDPR_NOTICE || false,
  GDPR_POLICY_URL:  process.env.GDPR_POLICY_URL,
  SYSTEM_NOTICE:    process.env.SYSTEM_NOTICE
} as NodeJS.ProcessEnv
