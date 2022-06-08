<template>
  <q-select
    :model-value="modelValue"
    :options="options"
    :readonly="readonly"
    option-value="uri"
    option-label="name"
    @update:modelValue="$emit('selectionChanged', $event)"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { CodeSystem } from '@onto-med/top-api'

export default defineComponent({
  name: 'CodeSystemInput',
  props: {
    modelValue: {
      type: Object as () => CodeSystem,
      required: true
    },
    options: {
      type: Array as () => CodeSystem[],
      required: true
    },
    readonly: Boolean
  },
  emits: ['selectionChanged'],
  setup () {
    return {}
  }
})
</script>
