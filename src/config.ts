export const env = {
  OAUTH2_ENABLED:   process.env.OAUTH2_ENABLED || false,
  OAUTH2_URL:       process.env.OAUTH2_URL || 'http://127.0.0.1:8081',
  OAUTH2_REALM:     process.env.OAUTH2_REALM || 'top-realm',
  OAUTH2_CLIENT_ID: process.env.OAUTH2_CLIENT_ID || 'top-frontend',
  API_URL:          process.env.API_URL || 'http://127.0.0.1:8080',
  GDPR_NOTICE:      process.env.GDPR_NOTICE || false,
  GDPR_POLICY_URL:  process.env.GDPR_POLICY_URL,
  SYSTEM_NOTICE:    process.env.SYSTEM_NOTICE
} as NodeJS.ProcessEnv

/**
 * To add new languages please insert respective configurations to the following exports.
 */
export const languages = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' }
]

export const datetimeFormats = {
  en: {
    short: {
      year: 'numeric', month: 'short', day: 'numeric'
    },
    long: {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: 'numeric'
    }
  },
  de: {
    short: {
      year: 'numeric', month: 'numeric', day: 'numeric'
    },
    long: {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric'
    }
  }
}
