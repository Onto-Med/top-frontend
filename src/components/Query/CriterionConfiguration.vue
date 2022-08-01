<template>
  <div>
    <q-btn flat icon="settings" :color="hasContent ? 'primary' : ''" :title="t('setting', 2)" @click="showDialog = true" />
    <q-dialog v-model="showDialog">
      <q-card class="criterion-config">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ t('setting', 2) }}
          </div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-t="'aggregationFunctionDescription'" />
          <q-select
            :model-value="defaultAggregationFunction"
            :options="aggregationFunctionOptions"
            :label="t('aggregationFunction')"
            option-value="id"
            option-label="title"
            @update:model-value="$emit('update:default-aggregation-function', $event)"
          />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-t="'ageRestrictionDescription'" />
          <div v-for="(restriction, index) in ageRestrictions" :key="index" class="row">
            <range-input
              v-model:minimum="restriction.values[0]"
              v-model:maximum="restriction.values[1]"
              v-model:min-operator="restriction.minOperator"
              v-model:max-operator="restriction.maxOperator"
              :type="DataType.Number"
              class="col"
            />
            <q-btn flat icon="remove" :title="t('removeThing', { thing: t('ageRestriction') })" class="col-auto" @click="removeAgeRestriction(index)" />
          </div>
          <q-btn flat icon="add" class="q-mt-md" :label="t('addThing', { thing: t('ageRestriction') })" @click="addAgeRestriction()" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-t="'dateTimeRestrictionDescription'" />
          <div v-for="(restriction, index) in dateTimeRestrictions" :key="index" class="row">
            <range-input
              v-model:minimum="restriction.values[0]"
              v-model:maximum="restriction.values[1]"
              v-model:min-operator="restriction.minOperator"
              v-model:max-operator="restriction.maxOperator"
              :type="DataType.DateTime"
              class="col"
            />
            <q-btn flat icon="remove" :title="t('removeThing', { thing: t('dateTimeRestriction') })" class="col-auto" @click="removeDateTimeRestriction(index)" />
          </div>
          <q-btn flat icon="add" class="q-mt-md" :label="t('addThing', { thing: t('dateTimeRestriction') })" @click="addDateTimeRestriction()" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NumberRestriction, DateTimeRestriction, DataType, ExpressionFunction } from '@onto-med/top-api'
import RangeInput from '../EntityEditor/RangeInput.vue'

export default defineComponent({
  components: { RangeInput },
  props: {
    ageRestrictions: {
      type: Array as () => NumberRestriction[],
      default: () => []
    },
    dateTimeRestrictions: {
      type: Array as () => DateTimeRestriction[],
      default: () => []
    },
    defaultAggregationFunction: {
      type: Object as () => ExpressionFunction,
      require: true
    },
    aggregationFunctionOptions: {
      type: Array as () => ExpressionFunction[],
      default: () => []
    }
  },
  emits: ['update:ageRestrictions', 'update:dateTimeRestrictions', 'update:default-aggregation-function'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,
      DataType,
      showDialog: ref(false),

      hasContent: computed(() => props.ageRestrictions.length > 0 || props.dateTimeRestrictions.length > 0),

      addAgeRestriction: () => {
        const newValue = JSON.parse(JSON.stringify(props.ageRestrictions)) as NumberRestriction[]
        newValue.push({ type: DataType.Number, values: [] })
        emit('update:ageRestrictions', newValue)
      },

      addDateTimeRestriction: () => {
        const newValue = JSON.parse(JSON.stringify(props.dateTimeRestrictions)) as DateTimeRestriction[]
        newValue.push({ type: DataType.DateTime, values: [] })
        emit('update:dateTimeRestrictions', newValue)
      },

      removeAgeRestriction: (index: number) => {
        const newValue = JSON.parse(JSON.stringify(props.ageRestrictions)) as NumberRestriction[]
        newValue.splice(index, 1)
        emit('update:ageRestrictions', newValue)
      },

      removeDateTimeRestriction: (index: number) => {
        const newValue = JSON.parse(JSON.stringify(props.dateTimeRestrictions)) as DateTimeRestriction[]
        newValue.splice(index, 1)
        emit('update:dateTimeRestrictions', newValue)
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.criterion-config
  max-width: 800px
</style>
