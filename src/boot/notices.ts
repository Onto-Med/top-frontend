import { Cookies, LocalStorage, Notify, openURL } from 'quasar'
import { computed } from 'vue'
import { i18n } from 'src/boot/i18n'
import packageInfo from '../../package.json'
import { env } from 'src/config'

if (env.SYSTEM_NOTICE) {
  const noticeHashCode = hashCode(env.SYSTEM_NOTICE)
  if (noticeHashCode !== LocalStorage.getItem('seenSystemNotice')) {
    Notify.create({
      message: env.SYSTEM_NOTICE,
      type: 'info',
      timeout: 0,
      position: 'top',
      actions: [
        {
          icon: 'close',
          color: 'white',
          handler() {
            LocalStorage.set('seenSystemNotice', noticeHashCode)
          },
        },
      ],
    })
  }
}

if (env.GDPR_NOTICE && Cookies.has('gdpr') !== true) {
  const policyUrl = env.GDPR_POLICY_URL
  const t = i18n.global.t

  const actions = [
    {
      label: computed(() => t('accept')) as unknown as string,
      color: 'yellow',
      noDismiss: false,
      handler() {
        Cookies.set('gdpr', 'true', { expires: 5 * 365 })
      },
    },
  ]

  if (policyUrl) {
    actions.push({
      label: computed(() => t('learnMore')) as unknown as string,
      color: 'grey',
      noDismiss: true,
      handler() {
        openURL(policyUrl)
      },
    })
  }

  Notify.create({
    message: computed(() =>
      t('gdprNotice', { productName: packageInfo.productName }),
    ) as unknown as string,
    multiLine: true,
    classes: 'gdpr-notice',
    timeout: 0,
    position: 'bottom-right',
    actions,
  })
}

/**
 * Returns a hash code from a string.
 * @param  {String} str The string to hash.
 * @return {Number} A 32bit integer.
 */
function hashCode(str: string): number {
  let hash = 0,
    i
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return hash
}
