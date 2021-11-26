<template>
  <q-card>
    <q-card-section class="q-pa-sm">
      <q-toolbar>
        <q-toolbar-title>{{ label || t('restriction') }}</q-toolbar-title>
        <q-btn
          dense
          round
          flat
          icon="info"
          :title="t('showThing', { thing: t('help') })"
          @click="showHelp = !showHelp"
        />
      </q-toolbar>
    </q-card-section>

    <q-separator />

    <q-card-section class="row q-pa-none">
      <div class="col q-pa-md">
        <div class="row q-mb-md">
          <q-select
            v-model="state.quantor"
            stack-label
            emit-value
            map-options
            outlined
            hide-bottom-space
            style="width: 200px"
            :label="t('quantor')"
            :options="quantors || defaultQuantors"
          />
        </div>

        <div v-show="![Quantor.None, Quantor.Exists].includes(state.quantor)">
          <div class="row">
            <q-btn-toggle
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
      </div>

      <q-separator v-show="showHelp" vertical />

      <div v-show="showHelp" class="col-6 q-pa-md">
        <div class="text-subtitle1">
          {{ t('help') }}:
        </div>
        {{ t('entityEditor.restrictionHelp') }}
      </div>
    </q-card-section>

    <q-separator v-show="!hasRange" />

    <q-card-actions v-show="!hasRange">
      <q-btn
        color="primary"
        icon="add"
        class="add-restriction-value-btn"
        :label="t('addThing', { thing: name || t('value') })"
        @click="state.values.push(null)"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { BooleanRestriction, DataType, DateTimeRestriction, NumberRestriction, Quantor, Restriction, RestrictionOperator, StringRestriction } from '@onto-med/top-api'
import { defineComponent, ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'RestrictionInput',
  props: {
    modelValue: {
      type: Object as () => Restriction,
      required: true
    },
    name: String,
    label: String,
    operators: Array,
    quantors: Array,
    dataType: String as () => DataType
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const state = reactive(JSON.parse(JSON.stringify(props.modelValue)) as Restriction)
    const hasRange = ref(
      (props.modelValue.type === DataType.Number || props.modelValue.type === DataType.DateTime)
      && (
        (props.modelValue as NumberRestriction|DateTimeRestriction).minOperator !== undefined
        || (props.modelValue as NumberRestriction|DateTimeRestriction).maxOperator !== undefined
      )
    )
    const defaultOperators = ([ null ] as Array<RestrictionOperator|null>).concat(Object.values(RestrictionOperator))
    const showHelp = ref(false)

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
          if (newState.values) newState.values.splice(2)
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
        if (newState.values) newState.values.splice(2)
      }
      emit('update:modelValue', newState)
    }

    return { t, defaultOperators, defaultQuantors, state, showHelp, hasRange, handleHasRangeChanged, Quantor }
  }
})
</script>
