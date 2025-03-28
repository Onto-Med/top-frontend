<template>
  <div class="row items-center">
    <q-input
      :model-value="minimumValue"
      :label="t('minimum')"
      stack-label
      outlined
      dense
      :readonly="readonly"
      :type="inputType"
      class="q-mr-md"
      @update:model-value="updateMinimum($event)"
    >
      <template #before>
        <q-select
          :model-value="minOperator || minOperators[0]"
          :options="minOperators"
          :readonly="readonly"
          outlined
          dense
          emit-value
          map-options
          class="operator-input"
          @update:model-value="$emit('update:minOperator', $event)"
        />
      </template>
    </q-input>

    <q-input
      :model-value="maximumValue"
      :label="t('maximum')"
      stack-label
      outlined
      dense
      :readonly="readonly"
      :type="inputType"
      @update:model-value="updateMaximum($event)"
    >
      <template #before>
        <q-select
          :model-value="maxOperator || maxOperators[0]"
          :options="maxOperators"
          :readonly="readonly"
          emit-value
          map-options
          outlined
          dense
          class="operator-input"
          @update:model-value="$emit('update:maxOperator', $event)"
        />
      </template>
    </q-input>
    <div v-if="unit" class="q-ml-md">
      {{ t('inUnit', { unit: unit }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { DataType, RestrictionOperator } from '@onto-med/top-api'
import { computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { date } from 'quasar'

const props = defineProps({
  unit: String,
  minimum: [Number, Date],
  maximum: [Number, Date],
  minOperator: String,
  maxOperator: String,
  minOperators: {
    type: Array,
    default: () => [RestrictionOperator.GreaterThanOrEqualTo, RestrictionOperator.GreaterThan],
  },
  maxOperators: {
    type: Array,
    default: () => [RestrictionOperator.LessThanOrEqualTo, RestrictionOperator.LessThan],
  },
  readonly: Boolean,
  type: String,
})

const emit = defineEmits([
  'update:minimum',
  'update:maximum',
  'update:minOperator',
  'update:maxOperator',
])

const { t } = useI18n()

void nextTick(() => {
  if (!props.minOperator) emit('update:minOperator', RestrictionOperator.GreaterThanOrEqualTo)
}).then(() => {
  if (!props.maxOperator) emit('update:maxOperator', RestrictionOperator.LessThan)
})

const minimumValue = computed(() => {
  if (props.type === DataType.DateTime && props.minimum instanceof Date)
    return date.formatDate(props.minimum, 'YYYY-MM-DDTHH:mm')
  return props.minimum as number
})

const maximumValue = computed(() => {
  if (props.type === DataType.DateTime && props.maximum instanceof Date)
    return date.formatDate(props.maximum, 'YYYY-MM-DDTHH:mm')
  return props.maximum as number
})

const inputType = computed(() => {
  if (props.type === DataType.DateTime) return 'datetime-local' as 'text'
  return 'number'
})

function updateMinimum(value?: number | string | null) {
  if (!value) emit('update:minimum', undefined)
  if (props.type === DataType.Number) {
    emit('update:minimum', value as number)
  } else if (props.type === DataType.DateTime) {
    emit('update:minimum', new Date(value as string))
  }
}

function updateMaximum(value?: number | string | null) {
  if (!value) emit('update:maximum', undefined)
  if (props.type === DataType.Number) {
    emit('update:maximum', value as number)
  } else if (props.type === DataType.DateTime) {
    emit('update:maximum', new Date(value as string))
  }
}
</script>

<style lang="scss" scoped>
.operator-input {
  width: 80px;
}
</style>
