<template>
  <expandable-card
    v-model:show-help="showHelp"
    :title="label || t('restriction')"
    :help-text="t('entityEditor.restrictionHelp')"
    :expanded="expanded"
    :error="!isValid"
    @update:expanded="$emit('update:expanded', $event)"
  >
    <template #default>
      <div class="row q-mb-md q-gutter-md">
        <q-select
          v-model="state.quantifier"
          stack-label
          emit-value
          map-options
          outlined
          hide-bottom-space
          :readonly="readonly"
          :label="t('quantifier')"
          :options="quantifiers || defaultQuantifiers"
        />

        <q-input
          v-if="state.quantifier && [Quantifier.Exact, Quantifier.Min, Quantifier.Max].includes(state.quantifier)"
          v-model="state.cardinality"
          type="number"
          :readonly="readonly"
          :error="state.cardinality === undefined"
          :label="t('cardinality')"
        />
      </div>

      <q-slide-transition>
        <div>
          <q-btn-toggle
            v-if="canHaveRange"
            v-model="hasRange"
            no-caps
            class="q-mb-md"
            :disable="readonly"
            :options="[
              { label: t('valueRange'), value: true },
              { label: t('enumeration'), value: false }
            ]"
            @update:model-value="handleHasRangeChanged"
          />

          <range-input
            v-if="hasRange"
            v-model:minimum="state.values[0]"
            v-model:maximum="state.values[1]"
            v-model:min-operator="(state as NumberRestriction | DateTimeRestriction).minOperator"
            v-model:max-operator="(state as NumberRestriction | DateTimeRestriction).maxOperator"
            :readonly="readonly"
            :operators="operators"
            :type="state.type"
            :unit="unit"
          />

          <div v-for="(_, index) in state.values" v-else :key="index" class="row">
            <q-input v-model="state.values[index]" outlined :readonly="readonly" :type="inputType">
              <template #after>
                <q-btn
                  color="red"
                  icon="remove"
                  class="remove-localized-text-btn"
                  :title="t('remove')"
                  @click="state.values?.splice(index, 1)"
                />
              </template>
            </q-input>
          </div>
        </div>
      </q-slide-transition>
    </template>

    <template v-if="!hasRange" #append>
      <q-card-actions class="q-pa-md">
        <q-btn
          color="primary"
          icon="add"
          class="add-restriction-value-btn"
          :disable="readonly"
          :label="t('addThing', { thing: name || t('value') })"
          @click="addValue()"
        />
      </q-card-actions>
    </template>
  </expandable-card>
</template>

<script setup lang="ts">
import {
  BooleanRestriction,
  DataType,
  DateTimeRestriction,
  NumberRestriction,
  Quantifier,
  Restriction,
  RestrictionOperator,
  StringRestriction
} from '@onto-med/top-api'
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import RangeInput from 'src/components/EntityEditor/RangeInput.vue'

const props = defineProps({
  modelValue: {
    type: Object as () => Restriction,
    default: () => {
      return {}
    }
  },
  name: String,
  label: String,
  unit: String,
  operators: Array,
  quantifiers: Array,
  expanded: Boolean,
  readonly: Boolean
})

const emit = defineEmits(['update:modelValue', 'update:expanded'])

const { t } = useI18n()
const state = reactive(
  JSON.parse(JSON.stringify(props.modelValue || {})) as
    | NumberRestriction
    | StringRestriction
    | BooleanRestriction
    | DateTimeRestriction
)
const canHaveRange = computed(() => [DataType.Number, DataType.DateTime].includes(state.type))
const showHelp = ref(false)
const hasRange = ref(
  canHaveRange.value &&
    ((props.modelValue as NumberRestriction | DateTimeRestriction).minOperator !== undefined ||
      (props.modelValue as NumberRestriction | DateTimeRestriction).maxOperator !== undefined)
)

const defaultQuantifiers = computed(() =>
  Object.values(Quantifier).map((d) => {
    return { label: t('quantifierType.' + d), value: d }
  })
)

const isValid = computed(
  () =>
    state.quantifier &&
    (![Quantifier.Exact, Quantifier.Min, Quantifier.Max].includes(state.quantifier) || state.cardinality !== undefined)
)

const inputType = computed(() => {
  if (state.type === DataType.DateTime) return 'datetime-local'
  if (state.type === DataType.Number) return 'number'
  return 'text'
})

if (!state.values) {
  state.values = []
  hasRange.value = canHaveRange.value
}

if (hasRange.value) {
  if ((state as NumberRestriction).minOperator === undefined)
    (state as NumberRestriction).minOperator = RestrictionOperator.GreaterThanOrEqualTo
  if ((state as NumberRestriction).maxOperator === undefined)
    (state as NumberRestriction).maxOperator = RestrictionOperator.LessThan
}

if (!state.quantifier) {
  state.quantifier = Quantifier.Min
  state.cardinality = 1
}

watch(
  () => state,
  () => emit('update:modelValue', state),
  { deep: true }
)

function handleHasRangeChanged(newValue: boolean) {
  if (!newValue && [DataType.Number, DataType.DateTime].includes(state.type)) {
    {
      ;(state as NumberRestriction | DateTimeRestriction).minOperator = undefined
    }
    ;(state as NumberRestriction | DateTimeRestriction).maxOperator = undefined
  } else {
    state.values?.splice(2)
    if ((state as NumberRestriction).minOperator === undefined)
      (state as NumberRestriction).minOperator = RestrictionOperator.GreaterThanOrEqualTo
    if ((state as NumberRestriction).maxOperator === undefined)
      (state as NumberRestriction).maxOperator = RestrictionOperator.LessThan
  }
}

function addValue() {
  if (!state.values) state.values = []
  state.values.push(null as never)
}
</script>
