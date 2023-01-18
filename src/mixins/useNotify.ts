import { Notify } from 'quasar'
import { AxiosError } from 'axios'
import { ErrorResponse } from '@onto-med/top-api'

export default function (this: void) {
  const notify = (msg: string, type?: string): void => {
    const innerType = type ? type : 'warning'
    const textColor = innerType == 'warning' ? 'black' : 'white'

    Notify.create({
      classes: 'default-alert',
      type: innerType,
      message: msg,
      progress: true,
      multiLine: true,
      actions: [
        {
          icon: 'close',
          color: textColor
        }
      ]
    })
  }

  return {
    notify,

    renderError: (e: AxiosError | Error): void => {
      if (e.hasOwnProperty('response')) {
        notify(((e as AxiosError).response?.data as ErrorResponse).message)
      } else {
        notify(e.message)
      }
    }
  }
}
