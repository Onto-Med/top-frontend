<template>
  <div class="row items-center">
    <q-select
      :model-value="minOperator || minOperators[0]"
      :options="minOperators"
      :readonly="readonly"
      outlined
      emit-value
      map-options
      class="operator-input"
      @update:model-value="$emit('update:minOperator', $event)"
    />
    <q-input
      :model-value="minimumValue"
      :label="t('minimum')"
      stack-label
      outlined
      :type="inputType"
      class="q-mr-md"
      @update:model-value="updateMinimum($event)"
    />

    <q-select
      :model-value="maxOperator || maxOperators[0]"
      :options="maxOperators"
      :readonly="readonly"
      emit-value
      map-options
      outlined
      class="operator-input"
      @update:model-value="$emit('update:maxOperator', $event)"
    />
    <q-input
      :model-value="maximumValue"
      :label="t('maximum')"
      stack-label
      outlined
      :type="inputType"
      @update:model-value="updateMaximum($event)"
    />
  </div>
</template>

<script lang="ts">
import { DataType, RestrictionOperator } from '@onto-med/top-api'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    minimum: [Number, Date],
    maximum: [Number, Date],
    minOperator: String,
    maxOperator: String,
    minOperators: {
      type: Array,
      default: () => [
        RestrictionOperator.GreaterThanOrEqualTo,
        RestrictionOperator.GreaterThan
      ]
    },
    maxOperators: {
      type: Array,
      default: () => [
        RestrictionOperator.LessThanOrEqualTo,
        RestrictionOperator.LessThan
      ]
    },
    readonly: Boolean,
    type: String
  },
  emits: ['update:minimum', 'update:maximum', 'update:minOperator', 'update:maxOperator'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,

      minimumValue: computed(() => {
        if (props.type === DataType.DateTime && props.minimum instanceof Date)
          return props.minimum.toISOString().substr(0, 16)
        return props.minimum
      }),

      maximumValue: computed(() => {
        if (props.type === DataType.DateTime && props.maximum instanceof Date)
          return props.maximum.toISOString().substr(0, 16)
        return props.maximum
      }),

      inputType: computed(() => {
        if (props.type === DataType.DateTime) return 'datetime-local'
        return props.type
      }),

      updateMinimum: (value: number|Date) => {
        if (props.type === DataType.Number) {
          emit('update:minimum', value as number)
        } else if (props.type === DataType.DateTime) {
          emit('update:minimum', value ? new Date(value) : undefined)
        }
      },

      updateMaximum: (value: number|Date) => {
        if (props.type === DataType.Number) {
          emit('update:maximum', value as number)
        } else if (props.type === DataType.DateTime) {
          emit('update:maximum', value ? new Date(value) : undefined)
        }
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.operator-input
  width: 80px
</style>
