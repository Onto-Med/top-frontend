export default function(this: void) {
  return {
    copy: <T>(value: T): T => {
      return JSON.parse(JSON.stringify(value)) as T
    },

    toValidId: (id: string|number|null): string => {
      return id ? (id as string).replace(/[^\w\d\-]/ig, '_').toLowerCase() : ''
    }
  }
}
