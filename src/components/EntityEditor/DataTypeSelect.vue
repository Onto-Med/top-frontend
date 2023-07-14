<template>
  <q-select
    v-model="dataType"
    :stack-label="required"
    emit-value
    map-options
    hide-bottom-space
    :readonly="readonly"
    :label="label || t('dataType')"
    :options="localOptions"
    :error="required ? !dataType : false"
    :clearable="!required"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataType } from '@onto-med/top-api'

export default defineComponent({
  props: {
    modelValue: String,
    label: String,
    options: Array as () => DataType[],
    readonly: Boolean,
    required: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const dataType = computed({
      get (): string { return props.modelValue as string },
      set (value: string): void { emit('update:modelValue', value) }
    })

    return {
      t,
      dataType,
      localOptions: computed(() =>
        (props.options ? props.options : Object.values(DataType))
          .map(d => { return { label: t(d), value: d } })
          .sort((a, b) => a.label.localeCompare(b.label)))
    }
  }
})
</script>
