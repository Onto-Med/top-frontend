<template>
  <q-select
    v-model="localSelected"
    :stack-label="required"
    emit-value
    map-options
    hide-bottom-space
    :readonly="readonly"
    :label="localLabel"
    :options="localOptions"
    :error="required ? !localSelected : false"
    :clearable="!required"
  >
    <template v-if="showTooltip" #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section :title="scope.opt.title">
          {{ scope.opt.label }}
        </q-item-section>
      </q-item>
    </template>
    <template v-if="showDescription" #after>
      <q-icon name="help" :title="localDescription" />
    </template>
  </q-select>
</template>

<script setup lang="ts" generic="T extends string">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  i18nPrefix: string
  description?: string
  label?: string
  options?: T[]
  readonly?: boolean
  required?: boolean
  selected?: T
  showDescription?: boolean
  showTooltip?: boolean
  enum?: object
}>()

const emit = defineEmits(['update:selected'])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()

const localSelected = computed({
  get: () => props.selected as T,
  set: (value: T) => emit('update:selected', value),
})

const localLabel = computed(() =>
  props.label
    ? props.label
    : te(`${props.i18nPrefix}.title`)
      ? t(`${props.i18nPrefix}.title`)
      : te(props.i18nPrefix)
        ? t(props.i18nPrefix)
        : undefined,
)

const localDescription = computed(() => {
  if (!props.showDescription) return undefined
  return props.description
    ? props.description
    : te(`${props.i18nPrefix}.description`)
      ? t(`${props.i18nPrefix}.description`)
      : undefined
})

const localOptions = computed(() =>
  (props.options ? props.options : props.enum ? Object.values(props.enum) : [])
    .map((d: string) => {
      const labelKey = `${props.i18nPrefix}s.${d}`
      const descriptionKey = `${props.i18nPrefix}Descriptions.${d}`
      if (te(labelKey)) {
        return {
          label: t(labelKey),
          value: d,
          title: te(descriptionKey) ? t(descriptionKey) : '',
        }
      } else {
        return {
          label: te(d) ? t(d) : d,
          value: d,
        }
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label)),
)
</script>
