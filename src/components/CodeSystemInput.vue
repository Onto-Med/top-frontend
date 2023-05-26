<template>
  <q-select
    :model-value="modelValue"
    :options="options"
    :readonly="readonly"
    :label="t('codeSystem')"
    stack-label
    clearable
    option-value="uri"
    option-label="shortName"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #option="scope">
      <q-item dense v-bind="scope.itemProps">
        <q-item-section :title="scope.opt.name">
          {{ scope.opt.shortName }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { CodeSystem } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'CodeSystemInput',
  props: {
    modelValue: {
      type: Object as () => CodeSystem
    },
    options: {
      type: Array as () => CodeSystem[],
      required: true
    },
    readonly: Boolean
  },
  emits: ['update:modelValue'],
  setup () {
    const { t } = useI18n()
    return { t }
  }
})
</script>
