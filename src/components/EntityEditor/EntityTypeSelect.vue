<template>
  <q-select
    v-model="entityType"
    :stack-label="required"
    emit-value
    map-options
    :readonly="readonly"
    :label="label || t('entityType')"
    :options="localOptions"
    :error="required ? !entityType : false"
    :clearable="!required"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType } from '@onto-med/top-api'

export default defineComponent({
  props: {
    modelValue: String,
    label: String,
    options: Array as () => EntityType[],
    readonly: Boolean,
    required: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const entityType = computed({
      get (): string { return props.modelValue as string },
      set (value: string): void { emit('update:modelValue', value) }
    })

    return {
      t,
      entityType,
      localOptions: computed(() =>
        (props.options ? props.options : Object.values(EntityType))
          .map(d => { return { label: t(d), value: d } })
          .sort((a, b) => a.label.localeCompare(b.label)))
    }
  }
})
</script>
