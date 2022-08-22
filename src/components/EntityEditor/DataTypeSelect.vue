<template>
  <q-select
    v-model="dataType"
    stack-label
    emit-value
    map-options
    :readonly="readonly"
    :label="label || t('dataType')"
    :options="options || defaultOptions"
    :error="!dataType"
  />
</template>

<script lang="ts">
import { defineComponent, SetupContext, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataType } from '@onto-med/top-api'

export default defineComponent({
  name: 'DataTypeSelect',
  props: {
    modelValue: String,
    label: String,
    options: Array,
    readonly: Boolean
  },
  emits: ['update:modelValue'],
  setup (props: Record<string, unknown>, { emit }: SetupContext) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const dataType = computed({
      get (): string { return props.modelValue as string },
      set (value: string): void { emit('update:modelValue', value) }
    })
    const defaultOptions = computed(() =>
      Object.values(DataType)
        .map(d => { return { label: t(d), value: d } })
        .sort((a, b) => a.label.localeCompare(b.label))
    )

    return { t, dataType, defaultOptions }
  }
})
</script>
