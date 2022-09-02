<template>
  <div>
    <q-btn flat icon="settings" :title="t('setting', 2)" @click="showDialog = true" />
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
            @update:model-value="$emit('update:default-aggregation-function', $event)"
          >
            <template #selected>
              {{ te('functions.' + defaultAggregationFunction.title) ? t('functions.' + defaultAggregationFunction.title) : defaultAggregationFunction.title }}
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                {{ te('functions.' + scope.opt.title) ? t('functions.' + scope.opt.title) : scope.opt.title }}
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-t="'dateTimeRestrictionDescription'" />
          <div class="row q-mt-sm">
            <range-input
              v-model:minimum="state.values[0]"
              v-model:maximum="state.values[1]"
              v-model:min-operator="state.minOperator"
              v-model:max-operator="state.maxOperator"
              :type="DataType.DateTime"
              class="col"
            />
            <q-btn
              flat
              icon="clear"
              :title="t('clearThing', { thing: t('dateTimeRestriction') })"
              class="col-auto"
              @click="clearDateTimeRestriction()"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTimeRestriction, DataType, ExpressionFunction } from '@onto-med/top-api'
import RangeInput from '../EntityEditor/RangeInput.vue'

export default defineComponent({
  components: { RangeInput },
  props: {
    dateTimeRestriction: {
      type: Object as () => DateTimeRestriction,
      default: () => { return { values: [] } }
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
  emits: ['update:dateTimeRestriction', 'update:default-aggregation-function'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, te } = useI18n()
    const state = reactive(JSON.parse(JSON.stringify(props.dateTimeRestriction)) as DateTimeRestriction)

    watch(
      () => state,
      () => emit('update:dateTimeRestriction', state),
      { deep: true }
    )
    return {
      t,
      te,
      state,
      DataType,
      showDialog: ref(false),

      clearDateTimeRestriction () {
        state.minOperator = undefined
        state.maxOperator = undefined
        state.values = []
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.criterion-config
  max-width: 800px
</style>
