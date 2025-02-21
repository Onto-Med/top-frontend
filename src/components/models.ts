import { Entity } from '@onto-med/top-api'
import { QSelect, QVirtualScroll } from 'quasar'

export interface ScrollDetails {
  to: number
  direction: string
  ref: QSelect
}

export interface VScrollDetails {
  index: number
  from: number
  to: number
  direction: 'increase' | 'decrease'
  ref: QVirtualScroll
}

export interface ForkResult {
  count: number
  entity?: Entity
}
