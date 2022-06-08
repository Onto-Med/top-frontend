<template>
  <div class="row items-center">
    <q-select
      :model-value="minOperator"
      :options="minOperators"
      :readonly="readonly"
      outlined
      emit-value
      map-options
      class="operator-input"
      @update:model-value="$emit('update:minOperator', $event)"
    />
    <q-input
      :model-value="minimum"
      :label="t('minimum')"
      outlined
      :type="type"
      class="q-mr-md"
      @update:model-value="updateMinimum($event)"
    />

    <q-select
      :model-value="maxOperator"
      :options="maxOperators"
      :readonly="readonly"
      emit-value
      map-options
      outlined
      class="operator-input"
      @update:model-value="$emit('update:maxOperator', $event)"
    />
    <q-input
      :model-value="maximum"
      :label="t('maximum')"
      outlined
      :type="type"
      @update:model-value="$emit('update:maximum', $event)"
    />
  </div>
</template>

<script lang="ts">
import { DataType, RestrictionOperator } from '@onto-med/top-api'
import { defineComponent } from 'vue'
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
        RestrictionOperator.GreaterThan,
        RestrictionOperator.GreaterThanOrEqualTo
      ]
    },
    maxOperators: {
      type: Array,
      default: () => [
        RestrictionOperator.LessThan,
        RestrictionOperator.LessThanOrEqualTo
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

      updateMinimum: (value: number|Date) => {
        if (props.type === DataType.Number) {
          emit('update:minimum', value as number)
        } else if (props.type === DataType.DateTime) {
          emit('update:minimum', new Date(value))
        }
      },
      updateMaximum: (value: number|Date) => {
        if (props.type === DataType.Number) {
          emit('update:minimum', value as number)
        } else if (props.type === DataType.DateTime) {
          emit('update:minimum', new Date(value))
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