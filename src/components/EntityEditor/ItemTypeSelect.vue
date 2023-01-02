<template>
  <q-select
    v-model="itemType"
    :stack-label="required"
    emit-value
    map-options
    :readonly="readonly"
    :label="label || t('itemType.title')"
    :options="localOptions"
    :error="required ? !itemType : false"
    :clearable="!required"
  >
    <template v-if="tooltip" #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section v-t="scope.opt.label" :title="scope.opt.title" />
      </q-item>
    </template>
    <template v-if="description" #after>
      <q-icon name="help" :title="t('itemType.description')" />
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ItemType } from '@onto-med/top-api'

export default defineComponent({
  props: {
    modelValue: String,
    label: String,
    options: Array as () => ItemType[],
    readonly: Boolean,
    required: Boolean,
    description: Boolean,
    tooltip: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const itemType = computed({
      get (): string { return props.modelValue as string },
      set (value: string): void { emit('update:modelValue', value) }
    })

    return {
      t,
      itemType,
      localOptions: computed(() =>
        (props.options ? props.options : Object.values(ItemType))
          .map(d => { return { label: t(d), value: d } })
          .sort((a, b) => a.label.localeCompare(b.label)))
    }
  }
})
</script>
