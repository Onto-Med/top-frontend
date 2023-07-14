import { QSelect, QVirtualScroll } from 'quasar'

export interface ScrollDetails {
  to: number,
  direction: string,
  ref: QSelect
}

export interface VScrollDetails {
  index: number,
  from: number,
  to: number,
  direction: 'increase' | 'decrease',
  ref: QVirtualScroll
}
