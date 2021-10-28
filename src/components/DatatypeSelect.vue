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
      default: 'Data Type'
    },
    options: {
      type: Array,
      default: (): Array<unknown> => [
        { label: 'Numeric', value: DataType.Number },
        { label: 'Boolean', value: DataType.Boolean },
        { label: 'Date and Time', value: DataType.DateTime },
        { label: 'Text', value: DataType.String }
      ]
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
