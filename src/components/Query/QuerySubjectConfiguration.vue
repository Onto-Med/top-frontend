<template>
  <div>
    <q-btn dense flat icon="settings" :title="t('setting', 2)" @click="showDialog = true" />
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

        <q-card-section v-if="showAggregationFunction">
          <small v-t="'aggregationFunctionDescription'" />
          <q-select
            :model-value="defaultAggregationFunctionId"
            :options="aggregationFunctionOptions"
            :label="t('aggregationFunction')"
            option-value="id"
            emit-value
            map-options
            @update:model-value="$emit('update:defaultAggregationFunctionId', $event)"
          >
            <template #selected>
              {{
                te('functions.' + defaultAggregationFunctionId)
                  ? t('functions.' + defaultAggregationFunctionId)
                  : defaultAggregationFunctionId
              }}
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                {{ te('functions.' + scope.opt.id) ? t('functions.' + scope.opt.id) : scope.opt.title }}
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-t="'dateTimeRestrictionDescription'" />
          <div class="row q-mt-sm">
            <range-input
              v-model:minimum="minimum"
              v-model:maximum="maximum"
              v-model:min-operator="minOperator"
              v-model:max-operator="maxOperator"
              :type="DataType.DateTime"
              class="col"
            />
            <q-btn
              flat
              icon="delete"
              :title="t('clearThing', { thing: t('dateTimeRestriction') })"
              class="col-auto"
              @click="clearDateTimeRestriction()"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('close')" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTimeRestriction, DataType, ExpressionFunction } from '@onto-med/top-api'
import RangeInput from '../EntityEditor/RangeInput.vue'

const props = defineProps({
  dateTimeRestriction: {
    type: Object as () => DateTimeRestriction,
    default: () => {
      return { type: DataType.DateTime, values: [] }
    }
  },
  defaultAggregationFunctionId: {
    type: String,
    require: true
  },
  aggregationFunctionOptions: {
    type: Array as () => ExpressionFunction[],
    default: () => []
  },
  showAggregationFunction: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:dateTimeRestriction', 'update:defaultAggregationFunctionId'])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const showDialog = ref(false)

const minimum = computed({
  get: () => (props.dateTimeRestriction.values ? props.dateTimeRestriction.values[0] : undefined),
  set: (val) => {
    let newModelValue = clone(props.dateTimeRestriction)
    if (!newModelValue.values) newModelValue.values = []
    newModelValue.values[0] = val as Date
    newModelValue.values[1] = newModelValue.values[1]
    emit('update:dateTimeRestriction', newModelValue)
  }
})

const maximum = computed({
  get: () => (props.dateTimeRestriction.values ? props.dateTimeRestriction.values[1] : undefined),
  set: (val) => {
    let newModelValue = clone(props.dateTimeRestriction)
    if (!newModelValue.values) newModelValue.values = []
    newModelValue.values[1] = val as Date
    newModelValue.values[0] = newModelValue.values[0]
    emit('update:dateTimeRestriction', newModelValue)
  }
})

const minOperator = computed({
  get: () => props.dateTimeRestriction.minOperator,
  set: (val) => {
    let newModelValue = clone(props.dateTimeRestriction)
    newModelValue.minOperator = val
    emit('update:dateTimeRestriction', newModelValue)
  }
})

const maxOperator = computed({
  get: () => props.dateTimeRestriction.maxOperator,
  set: (val) => {
    let newModelValue = clone(props.dateTimeRestriction)
    newModelValue.maxOperator = val
    emit('update:dateTimeRestriction', newModelValue)
  }
})

function clone(restriction: DateTimeRestriction) {
  return {
    type: DataType.DateTime,
    minOperator: restriction.minOperator,
    maxOperator: restriction.maxOperator,
    values: restriction.values?.slice()
  } as DateTimeRestriction
}

function clearDateTimeRestriction() {
  let newModelValue = JSON.parse(JSON.stringify(props.dateTimeRestriction)) as DateTimeRestriction
  newModelValue.values = []
  emit('update:dateTimeRestriction', newModelValue)
}
</script>

<style lang="sass" scoped>
.criterion-config
  max-width: 800px
</style>
