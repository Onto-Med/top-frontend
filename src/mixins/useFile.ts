export default function (this: void) {
  return {
    saveToFile (this: void, content: string, filename: string): void {
      const data = content
      const blob = new Blob([data], { type: 'text/plain' })
      const a = document.createElement('a')
      a.download = filename
      a.href = window.URL.createObjectURL(blob)
      a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')

      const e = new MouseEvent('click', {
        bubbles: true,
        cancelable: false,
        view: window
      })
      a.dispatchEvent(e)
    }
  }
}
