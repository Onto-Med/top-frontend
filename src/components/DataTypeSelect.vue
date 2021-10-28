<template>
  <q-select
    v-model="dataType"
    :label="label"
    stack-label
    emit-value
    map-options
    :options="options"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DataType } from 'src/components/models'

export default defineComponent({
  name: 'DataTypeSelect',
  props: {
    modelValue: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default () {
        return this.$t('dataType')
      }
    },
    options: {
      type: Array,
      default (): Array<unknown> {
        return [ DataType.Number, DataType.Boolean, DataType.DateTime, DataType.String ]
          .map(d => { return { label: this.$(d), value: d } })
      }
    }
  },
  emits: ['update:modelValue'],
  computed: {
    dataType: {
      get (): string { return this.modelValue },
      set (value: string): void { this.$emit('update:modelValue', value) }
    }
  }
})
</script>
