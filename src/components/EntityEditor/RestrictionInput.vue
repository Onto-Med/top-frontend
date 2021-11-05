<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">
        {{ label || t('restriction') }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-md">
      <q-btn-toggle
        v-model="hasRange"
        no-caps
        class="q-mb-md"
        :options="[ { label: t('valueRange'), value: true }, { label: t('enumeration'), value: false } ]"
      />

      <div v-show="hasRange" class="row">
        <q-input v-model="local.values[0]" outlined :type="local.type">
          <template #before>
            <q-select
              v-model="local.minOperator"
              :options="operators || defaultOperators"
              outlined
              emit-value
              map-options
            />
          </template>
        </q-input>
      </div>

      <div v-show="hasRange" class="row">
        <q-input v-model="local.values[1]" outlined :type="local.type">
          <template #before>
            <q-select
              v-model="local.maxOperator"
              :options="operators || defaultOperators"
              emit-value
              map-options
              outlined
            />
          </template>
        </q-input>
      </div>

      <div v-for="(value, index) in local.values" v-show="!hasRange" :key="index" class="row">
        <q-input v-model="local.values[index]" outlined :type="local.type">
          <template #after>
            <q-btn
              color="red"
              icon="remove"
              class="remove-localized-text-btn"
              :title="t('remove')"
              @click="local.values.splice(index, 1)"
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
        @click="local.values.push(null)"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataType, IRestriction, RestrictionOperator } from 'src/components/models'

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
    dataType: String as () => DataType
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const hasRange = ref(props.modelValue.minOperator !== undefined || props.modelValue.maxOperator !== undefined)
    const defaultOperators = computed(() => Object.values(RestrictionOperator))
    const local = computed({
      get: (): IRestriction => props.modelValue,
      set: (newValue): void => {
        emit('update:modelValue', newValue)
      }
    })
    return { t, defaultOperators, local, hasRange }
  }
})
</script>
