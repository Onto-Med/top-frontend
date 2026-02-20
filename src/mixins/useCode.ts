import { Code, CodeScope } from '@onto-med/top-api'
import { CodeApiKey } from 'src/boot/axios'
import { CodeWithScope } from 'src/components/models'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

export default function (this: void) {
  const { t } = useI18n()
  const codeApi = inject(CodeApiKey)

  const codeEquals = (code1?: Code, code2?: Code) => {
    if (!code1 || !code2) return false
    return code1.codeSystem.uri == code2.codeSystem.uri && code1.code == code2.code
  }

  return {
    codeEquals,

    collectCodes: async (codes?: CodeWithScope[]): Promise<Code[]> => {
      if (!codes) return Promise.resolve([])
      if (!codeApi) return Promise.reject({ message: t('errorLoadingData', { type: 'Code' }) })

      return Promise.all(
        codes.flatMap(async ({ code, scope }, index) => {
          const firstIndex = codes.findIndex((c) => codeEquals(c.code, code))
          if (firstIndex !== index) return undefined
          if (scope == CodeScope.Self) return code
          return (
            await codeApi?.getCode(
              encodeURIComponent(code.uri!),
              code?.codeSystem?.externalId || '',
              scope,
            )
          )?.data
        }),
      ).then((r) => r.filter((e): e is Code => !!e))
    },
  }
}
