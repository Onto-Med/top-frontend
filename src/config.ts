import { DefineDateTimeFormat } from 'vue-i18n'

/**
 * This object is a workaround to make the TOP frontend configurable in a Docker
 * setup using environment variables.
 * In a Docker container, only the final built JavaScript code is available, with
 * calls to `process.env` being completely replaced with the actual values. The
 * field names listed here are preserved after built and can be accessed and
 * replaced with custom values provided via environment variables.
 */
export const env = {
  OAUTH2_ENABLED: process.env.OAUTH2_ENABLED,
  OAUTH2_URL: process.env.OAUTH2_URL || 'http://127.0.0.1:8081',
  OAUTH2_REALM: process.env.OAUTH2_REALM || 'top-realm',
  OAUTH2_CLIENT_ID: process.env.OAUTH2_CLIENT_ID || 'top-frontend',
  API_URL: process.env.API_URL || 'http://127.0.0.1:8080',
  GDPR_NOTICE: process.env.GDPR_NOTICE,
  GDPR_POLICY_URL: process.env.GDPR_POLICY_URL,
  SYSTEM_NOTICE: process.env.SYSTEM_NOTICE,
  DOCUMENTS_ENABLED: process.env.DOCUMENTS_ENABLED,
  RAG_ENABLED: process.env.RAG_ENABLED,
  MAX_COMBINED_DOCUMENTS_UPLOAD: process.env.MAX_COMBINED_DOCUMENTS_UPLOAD || '2MB',
  ACCEPT_DOCUMENT_UPLOAD_TYPE: process.env.ACCEPT_DOCUMENT_UPLOAD_TYPE || '.txt',
  TOP_PHENOTYPIC_QUERY_DOC_BASE_URL:
    process.env.TOP_PHENOTYPIC_QUERY_DOC_BASE_URL ||
    'https://onto-med.github.io/top-phenotypic-query/care/smith/top/top_phenotypic_query/c2reasoner',
  QUERIES_ENABLED: process.env.QUERIES_ENABLED || process.env.QUERIES_ENABLED === undefined,
} as NodeJS.ProcessEnv

/**
 * List of function types for which no documentation reference should be displayed.
 */
export const noDocFunctionTypes = ['component', 'textFunction']

/**
 * To add new languages please insert respective configurations to the following exports.
 */
export const languages = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
]

export const datetimeFormats = {
  en: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    shortWithTime: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
  } as DefineDateTimeFormat,
  de: {
    short: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    },
    shortWithTime: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
  } as DefineDateTimeFormat,
}
