<template>
  <q-select
    v-model="datatype"
    :label="label"
    stack-label
    emit-value
    :options="options"
  />
</template>

<script lang="ts">
export default {
  props: {
    modelValue: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: 'Datatype'
    },
    options: {
      type: Array,
      default: (): Array<unknown> => [
        { label: 'Numeric', value: 'numeric' },
        { label: 'Boolean', value: 'boolean' },
        { label: 'Date and Time', value: 'datetime' },
        { label: 'Text', value: 'string' }
      ]
    }
  },
  emits: ['update:modelValue'],
  computed: {
    datatype: {
      get (): string { return this.modelValue },
      set (value: string): void { this.$emit('update:modelValue', value) }
    }
  }
}
</script>
