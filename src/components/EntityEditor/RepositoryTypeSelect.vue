<template>
  <q-select
    v-model="repositoryType"
    :stack-label="required"
    emit-value
    map-options
    :readonly="readonly"
    :label="label || t('repositoryType')"
    :options="options || defaultOptions"
    :error="required && !repositoryType"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RepositoryType } from '@onto-med/top-api'

export default defineComponent({
  props: {
    modelValue: String,
    label: String,
    options: Array,
    readonly: Boolean,
    required: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const { t } = useI18n()

    return {
      t,

      repositoryType: computed({
        get (): string { return props.modelValue as string },
        set (value: string): void { emit('update:modelValue', value) }
      }),

      defaultOptions: computed(() =>
        Object.values(RepositoryType)
          .map(d => { return { label: t(d), value: d } })
          .sort((a, b) => a.label.localeCompare(b.label))
      )
    }
  }
})
</script>
