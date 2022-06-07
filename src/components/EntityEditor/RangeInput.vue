<template>
  <div class="row items-center">
    <q-input :model-value="minimum" outlined :type="type" @update:model-value="updateMinimum($event)">
      <template #after>
        <q-select
          :model-value="minOperator"
          :options="operators || defaultOperators"
          :readonly="readonly"
          outlined
          emit-value
          map-options
          class="operator-input"
          @update:model-value="$emit('update:minOperator', $event)"
        />
      </template>
    </q-input>
    <q-field borderless>
      <template #control>
        <div class="self-center full-width no-outline q-px-sm" tabindex="0">
          {{ t('value', 2) }}
        </div>
      </template>
    </q-field>
    <q-input :model-value="maximum" outlined :type="type" @update:model-value="$emit('update:maximum', $event)">
      <template #before>
        <q-select
          :model-value="maxOperator"
          :options="operators || defaultOperators"
          :readonly="readonly"
          emit-value
          map-options
          outlined
          class="operator-input"
          @update:model-value="$emit('update:maxOperator', $event)"
        />
      </template>
    </q-input>
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
    operators: Array,
    readonly: Boolean,
    type: String
  },
  emits: ['update:minimum', 'update:maximum', 'update:minOperator', 'update:maxOperator'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,
      defaultOperators: ([ null ] as Array<RestrictionOperator|null>).concat(Object.values(RestrictionOperator)),

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