import { Notify } from 'quasar'

export default function (this: void) {
  return {
    alert (this: void, msg: string, type?: string): void {
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
  }
}
