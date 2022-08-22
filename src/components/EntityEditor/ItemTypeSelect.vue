<template>
  <q-select
    v-model="itemType"
    stack-label
    emit-value
    map-options
    :readonly="readonly"
    :label="label || t('itemType')"
    :options="options || defaultOptions"
    :error="!itemType"
  >
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section v-t="scope.opt.label" :title="scope.opt.title" />
      </q-item>
    </template>
    <template #after>
      <q-icon name="help" :title="t('itemType.description')" />
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, SetupContext, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemType } from '@onto-med/top-api'

export default defineComponent({
  props: {
    modelValue: String,
    label: String,
    options: Array,
    readonly: Boolean
  },
  emits: ['update:modelValue'],
  setup (props: Record<string, unknown>, { emit }: SetupContext) {
    const { t } = useI18n()
    const itemType = computed({
      get (): string { return props.modelValue as string },
      set (value: string): void { emit('update:modelValue', value) }
    })
    const defaultOptions = computed(() =>
      Object.values(ItemType).map(d => { return { label: t(d), value: d, title: t(`${d}.description`) } })
    )

    return { t, itemType, defaultOptions }
  }
})
</script>
