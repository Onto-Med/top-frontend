import { Cookies, Notify, openURL } from 'quasar'
import { computed } from 'vue'
import { i18n } from 'src/boot/i18n'
import packageInfo from '../../package.json'

if (process.env.GDPR_NOTICE && Cookies.has('gdpr') !== true) {
  const policyUrl = process.env.GDPR_POLICY_URL
  const t = i18n.global.t

  const actions = [
    {
      label: computed(() => t('accept')) as unknown as string,
      color: 'yellow',
      noDismiss: true,
      handler () {
        Cookies.set('gdpr', 'true', { expires: 5 * 365 })
      }
    }
  ]

  if (policyUrl) {
    actions.push({
      label: computed(() => t('learnMore')) as unknown as string,
      color: 'grey',
      noDismiss: true,
      handler () {
        openURL(policyUrl)
      }
    })
  }

  Notify.create({
    message: computed(() => t('gdprNotice', { productName: packageInfo.productName })) as unknown as string,
    multiLine: true,
    classes: 'gdpr-notice',
    timeout: 0,
    position: 'bottom-right',
    actions
  })
}
