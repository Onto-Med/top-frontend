<template>
  <div>
    <q-select
      :dense="dense"
      emit-value
      use-input
      input-debounce="0"
      clearable
      :class="{ 'ucum-select-field': fixedWidth }"
      :label="showLabel ? t('unit') : undefined"
      :readonly="readonly"
      :model-value="modelValue"
      :options="options"
      :display-value="displayValue"
      @filter="filterFn"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section avatar>
            <strong>{{ scope.opt.value }}</strong>
          </q-item-section>
          <q-item-section>{{ scope.opt.label }}</q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <q-item>
          <q-item-section v-t="'inputRequired'" class="text-italic text-grey" />
        </q-item>
      </template>
      <template #after>
        <slot name="after" />
      </template>
    </q-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as ucumLhc from '@lhncbc/ucum-lhc'
import { useI18n } from 'vue-i18n'

interface TypedUcumLhcUtils {
  validateUnitString(string?: string, bool?: boolean): Record<string, unknown>
}

const props = defineProps<{
  modelValue?: string
  readonly?: boolean
  showLabel?: boolean
  fixedWidth?: boolean
  dense?: boolean
}>()

defineEmits(['update:modelValue'])

const { t } = useI18n()

const utils = ucumLhc.UcumLhcUtils.getInstance() as TypedUcumLhcUtils
const options = ref(null as unknown as Array<Record<string, string>>)

const validation = computed(() => utils.validateUnitString(props.modelValue))

const displayValue = computed(() => {
  if (validation.value && validation.value.status === 'valid') {
    const unit = validation.value.unit as Record<string, string>
    return `${unit.code} (${unit.name})`
  }
  return ''
})

function filterFn(val: string, update: (arg0: () => void) => void, abort: () => void) {
  if (!val || val.length === 0) {
    abort()
    return
  }

  const result: Record<string, unknown> = utils.validateUnitString(val, true)

  if (result.suggestions) {
    update(
      () =>
        (options.value = (result.suggestions as { units: Array<string[]> }[])
          .flatMap((s) => s.units)
          .map((u) => {
            return { value: u[0] || '', label: u[1] || '' }
          })),
    )
  } else if (result.unit) {
    const unit = result.unit as { code: string; name: string }
    update(() => (options.value = [{ value: unit.code, label: unit.name }]))
  } else {
    abort()
  }
}
</script>

<style lang="sass" scoped>
.ucum-validity-icon
  width: 30px
.ucum-select-field
  width: 300px
</style>
