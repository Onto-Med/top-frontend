<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">
        {{ label || t('restriction') }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-md">
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
        <q-checkbox v-model="state.negated" :label="t('negated')" />
      </div>

      <q-btn-toggle
        v-model="hasRange"
        no-caps
        class="q-mb-md"
        :options="[ { label: t('valueRange'), value: true }, { label: t('enumeration'), value: false } ]"
        @update:model-value="handleHasRangeChanged($event)"
      />

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
import { defineComponent, ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataType, IRestriction, RestrictionOperator, QuantorType } from 'src/components/models'

export default defineComponent({
  name: 'RestrictionInput',
  props: {
    modelValue: {
      type: Object as () => IRestriction,
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
    const state = reactive(JSON.parse(JSON.stringify(props.modelValue)) as IRestriction)
    const hasRange = ref(props.modelValue.minOperator !== undefined || props.modelValue.maxOperator !== undefined)
    const defaultOperators = ([ null ] as Array<RestrictionOperator|null>).concat(Object.values(RestrictionOperator))
    const defaultQuantors = Object.values(QuantorType).map(d => { return { label: t(d), value: d } })
    watch(
      () => state,
      () => emit('update:modelValue', state),
      { deep: true }
    )
    const handleHasRangeChanged = (newValue: boolean) => {
      const newState = JSON.parse(JSON.stringify(state)) as IRestriction
      if (!newValue) {
        newState.minOperator = undefined
        newState.maxOperator = undefined
      } else {
        newState.values.splice(2)
      }
      emit('update:modelValue', newState)
    }

    return { t, defaultOperators, defaultQuantors, state, hasRange, handleHasRangeChanged, QuantorType }
  }
})
</script>
