<template>
  <expandable-card :title="label || t('restriction')" :help-text="t('entityEditor.restrictionHelp')" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <div class="row q-mb-md">
        <q-select
          v-model="state.quantor"
          stack-label
          emit-value
          map-options
          outlined
          hide-bottom-space
          :label="t('quantor')"
          :options="quantors || defaultQuantors"
        />
      </div>

      <q-slide-transition>
        <div v-show="![Quantor.None, Quantor.Exists].includes(state.quantor)">
          <div class="row">
            <q-btn-toggle
              v-if="canHaveRange"
              v-model="hasRange"
              no-caps
              class="q-mb-md"
              :options="[ { label: t('valueRange'), value: true }, { label: t('enumeration'), value: false } ]"
              @update:model-value="handleHasRangeChanged"
            />
            <q-checkbox v-model="state.negated" :label="t('negated')" class="q-mb-sm" />
          </div>

          <div v-show="hasRange" class="row">
            <q-input v-model="state.values[0]" outlined :type="state.type">
              <template #before>
                <q-select
                  v-model="state.minOperator"
                  :options="operators || defaultOperators"
                  outlined
                  emit-value
                  map-options
                  class="operator-input"
                />
              </template>
            </q-input>
          </div>

          <div v-show="hasRange" class="row">
            <q-input v-model="state.values[1]" outlined :type="state.type">
              <template #before>
                <q-select
                  v-model="state.maxOperator"
                  :options="operators || defaultOperators"
                  emit-value
                  map-options
                  outlined
                  class="operator-input"
                />
              </template>
            </q-input>
          </div>

          <div v-for="(value, index) in state.values" v-show="!hasRange" :key="index" class="row">
            <q-input v-model="state.values[index]" outlined :type="state.type">
              <template #after>
                <q-btn
                  color="red"
                  icon="remove"
                  class="remove-localized-text-btn"
                  :title="t('remove')"
                  @click="state.values.splice(index, 1)"
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
          :label="t('addThing', { thing: name || t('value') })"
          @click="addValue()"
        />
      </q-card-actions>
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { BooleanRestriction, DataType, DateTimeRestriction, NumberRestriction, Quantor, Restriction, RestrictionOperator, StringRestriction } from '@onto-med/top-api'
import { defineComponent, ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'

export default defineComponent({
  name: 'RestrictionInput',
  components: {
    ExpandableCard
  },
  props: {
    modelValue: {
      type: Object as () => Restriction,
      default: () => { return {} }
    },
    name: String,
    label: String,
    operators: Array,
    quantors: Array,
    expanded: Boolean,
    showHelp: Boolean,
    dataType: String as () => DataType
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const state = reactive(JSON.parse(JSON.stringify(props.modelValue || {})) as NumberRestriction|StringRestriction|BooleanRestriction|DateTimeRestriction)
    if (!state.values) state.values = []
    const canHaveRange = computed(() => [DataType.Number, DataType.DateTime].includes(state.type))
    const hasRange = ref(
      canHaveRange.value
      && (
        (props.modelValue as NumberRestriction|DateTimeRestriction).minOperator !== undefined
        || (props.modelValue as NumberRestriction|DateTimeRestriction).maxOperator !== undefined
      )
    )
    const defaultOperators = ([ null ] as Array<RestrictionOperator|null>).concat(Object.values(RestrictionOperator))

    const defaultQuantors = computed(() =>
      Object.values(Quantor).map(d => { return { label: t('quantorType.' + d), value: d } })
    )

    watch(
      () => state,
      () => {
        const newState = JSON.parse(JSON.stringify(state)) as NumberRestriction|StringRestriction|BooleanRestriction|DateTimeRestriction
        if (newState.quantor && [Quantor.None, Quantor.Exists].includes(newState.quantor)) {
          if (newState.type === DataType.Number || newState.type === DataType.DateTime) {
            {(newState as NumberRestriction|DateTimeRestriction).minOperator = undefined}
            (newState as NumberRestriction|DateTimeRestriction).maxOperator = undefined
          }
          newState.negated = undefined
          newState.values = []
        }
        emit('update:modelValue', newState)
      },
      { deep: true }
    )

    const handleHasRangeChanged = (newValue: boolean) => {
      const newState = JSON.parse(JSON.stringify(state)) as NumberRestriction|StringRestriction|BooleanRestriction|DateTimeRestriction
      if (!newValue && (newState.type === DataType.Number || newState.type === DataType.DateTime)) {
        {(newState as NumberRestriction|DateTimeRestriction).minOperator = undefined}
        (newState as NumberRestriction|DateTimeRestriction).maxOperator = undefined
      } else {
        newState.values?.splice(2)
      }
      emit('update:modelValue', newState)
    }

    return { t, defaultOperators, defaultQuantors, state, hasRange, canHaveRange, handleHasRangeChanged, Quantor,
      addValue () {
        if (!state.values) state.values = []
        state.values.push()
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.operator-input
  width: 80px
</style>