<template>
  <q-select
    :model-value="modelValue"
    :options="options"
    @update:modelValue="$emit('selectionChanged', $event)"
  >
    <template #selected-item="{ opt }">
      <span :title="opt.uri">{{ opt.name }}</span>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps" :title="scope.opt.uri">
        <q-item-section>
          <q-item-label>{{ scope.opt.name }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
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
    }
  },
  emits: ['selectionChanged'],
  setup () {
    return {}
  }
})
</script>
