<template>
  <q-select
    v-model="entityType"
    stack-label
    emit-value
    map-options
    :readonly="readonly"
    :label="label || t('entityType')"
    :options="options || defaultOptions"
    :error="required ? !entityType : false"
  />
</template>

<script lang="ts">
import { defineComponent, SetupContext, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType } from '@onto-med/top-api'

export default defineComponent({
  props: {
    modelValue: String,
    label: String,
    options: Array,
    readonly: Boolean,
    required: Boolean
  },
  emits: ['update:modelValue'],
  setup (props: Record<string, unknown>, { emit }: SetupContext) {
    const { t } = useI18n()
    const entityType = computed({
      get (): string { return props.modelValue as string },
      set (value: string): void { emit('update:modelValue', value) }
    })
    const defaultOptions = computed(() =>
      Object.values(EntityType)
        .map(d => { return { label: t(d), value: d } })
        .sort((a, b) => a.label.localeCompare(b.label))
    )

    return { t, entityType, defaultOptions }
  }
})
</script>
