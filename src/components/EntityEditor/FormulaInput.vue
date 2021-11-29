<template>
  <expandable-card :title="label" :help-text="helpText" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <q-input :model-value="modelValue" debounce="200" type="textarea" @update:model-value="$emit('update:modelValue', $event)" />
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ExpandableCard from 'src/components/ExpandableCard.vue'

export default defineComponent({
  name: 'ExpressionInput',
  components: {
    ExpandableCard
  },
  props: {
    modelValue: String,
    label: String,
    helpText: String,
    expanded: Boolean,
    showHelp: Boolean
  },
  emits: ['update:modelValue'],
  setup () {
    return { }
  }
})
</script>
