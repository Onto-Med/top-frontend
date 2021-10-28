<template>
  <q-select
    v-model="dataType"
    :label="label || defaultLabel"
    stack-label
    emit-value
    map-options
    :options="options || defaultOptions"
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
    label: String,
    options: Array
  },
  emits: ['update:modelValue'],
  computed: {
    dataType: {
      get (): string { return this.modelValue },
      set (value: string): void { this.$emit('update:modelValue', value) }
    },
    defaultLabel () {
      return this.$t('dataType')
    },
    defaultOptions () {
      return [ DataType.Number, DataType.Boolean, DataType.DateTime, DataType.String ]
          .map(d => { return { label: this.$t(d), value: d } })
    }
  }
})
</script>
