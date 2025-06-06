import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import { LocalStorage } from 'quasar'
import messages from 'src/i18n'
import { datetimeFormats } from 'src/config'

export type MessageLanguages = keyof typeof messages
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = (typeof messages)['en']

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

const locale =
  (typeof LocalStorage.getItem('language') === 'string'
    ? String(LocalStorage.getItem('language'))
    : null) || navigator.language.split('-')[0]
const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
  locale,
  legacy: false,
  messages,
  datetimeFormats,
})

export default defineBoot(({ app }) => {
  app.use(i18n)
})

export { i18n }
