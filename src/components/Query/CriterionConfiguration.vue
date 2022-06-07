<template>
  <q-btn icon="settings" :title="t('setting', 2)" @click="showDialog = true" />
  <q-dialog v-model="showDialog">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('setting', 2) }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-for="(restriction, index) in ageRestrictions" :key="index" class="row">
          <range-input
            v-model:minimum="restriction.values[0]"
            v-model:maximum="restriction.values[1]"
            v-model:min-operator="restriction.minOperator"
            v-model:max-operator="restriction.maxOperator"
            :type="DataType.Number"
            class="col"
          />
          <q-btn icon="remove" :title="t('removeThing', { thing: t('ageRestriction') })" class="col-auto" @click="removeAgeRestriction(index)" />
        </div>
        <q-btn flat icon="add" :label="t('addThing', { thing: t('ageRestriction') })" @click="addAgeRestriction()" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-for="(restriction, index) in timeRestrictions" :key="index" class="row">
          <range-input
            v-model:minimum="restriction.values[0]"
            v-model:maximum="restriction.values[1]"
            v-model:min-operator="restriction.minOperator"
            v-model:max-operator="restriction.maxOperator"
            :type="DataType.DateTime"
            class="col"
          />
          <q-btn icon="remove" :title="t('removeThing', { thing: t('timeRestriction') })" class="col-auto" @click="removeTimeRestriction(index)" />
        </div>
        <q-btn flat icon="add" :label="t('addThing', { thing: t('timeRestriction') })" @click="addTimeRestriction()" />
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('close')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NumberRestriction, DateTimeRestriction, DataType } from '@onto-med/top-api'
import RangeInput from '../EntityEditor/RangeInput.vue'

export default defineComponent({
  components: { RangeInput },
  props: {
    ageRestrictions: {
      type: Array as () => NumberRestriction[],
      default: () => []
    },
    timeRestrictions: {
      type: Array as () => DateTimeRestriction[],
      default: () => []
    }
  },
  emits: ['update:ageRestrictions', 'update:timeRestrictions'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,
      DataType,
      showDialog: ref(false),

      addAgeRestriction: () => {
        const newValue = JSON.parse(JSON.stringify(props.ageRestrictions)) as NumberRestriction[]
        newValue.push({ type: DataType.Number, values: [] })
        emit('update:ageRestrictions', newValue)
      },

      addTimeRestriction: () => {
        const newValue = JSON.parse(JSON.stringify(props.timeRestrictions)) as DateTimeRestriction[]
        newValue.push({ type: DataType.DateTime, values: [] })
        emit('update:timeRestrictions', newValue)
      },

      removeAgeRestriction: (index: number) => {
        const newValue = JSON.parse(JSON.stringify(props.ageRestrictions)) as NumberRestriction[]
        newValue.splice(index, 1)
        emit('update:ageRestrictions', newValue)
      },

      removeTimeRestriction: (index: number) => {
        const newValue = JSON.parse(JSON.stringify(props.timeRestrictions)) as DateTimeRestriction[]
        newValue.splice(index, 1)
        emit('update:timeRestrictions', newValue)
      }
    }
  }
})
</script>
