import { Notify } from 'quasar'
import { useI18n } from 'vue-i18n'

export default function (this: void) {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { t } = useI18n()

  return {
    alert (this: void, msg: string, type?: string): void {
      const innerType = type ? type : 'warning'
      const textColor = innerType == 'warning' ? 'black' : 'white'

      Notify.create({
        type: innerType,
        message: msg,
        progress: true,
        multiLine: true,
        actions: [
          {
            label: t('dismiss'),
            color: textColor
          }
        ]
      })
    }
  }
}
