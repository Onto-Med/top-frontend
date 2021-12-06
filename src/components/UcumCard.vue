<template>
  <expandable-card :title="t('unit', 2)" :help-text="t('ucumCard.help')" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <div v-for="(unit, index) in modelValue" :key="index" class="row">
        <ucum-input :model-value="modelValue[index].unit" @update:modelValue="updateUnitByIndex({ unit: $event }, index)">
          <template #after>
            <q-btn icon="remove" class="remove-ucum-btn" :title="t('remove')" color="red" @click="removeUnitByIndex(index)" />
          </template>
        </ucum-input>
      </div>
    </template>

    <template #append>
      <q-card-actions class="q-pa-md">
        <q-btn icon="add" color="primary" class="add-ucum-btn" :label="t('addThing', { thing: t('unit') })" @click="addUnit" />
      </q-card-actions>
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import UcumInput from 'src/components/UcumInput.vue'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import { Unit } from '@onto-med/top-api'

export default defineComponent({
  name: 'UcumCard',
  components: {
    UcumInput,
    ExpandableCard
  },
  props: {
    modelValue: {
      type: Array as () => Array<Unit>,
      required: true
    },
    expanded: Boolean,
    showHelp: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,
      removeUnitByIndex (index: number) {
        let newModelValue = props.modelValue.slice()
        newModelValue.splice(index, 1)
        emit('update:modelValue', newModelValue)
      },
      updateUnitByIndex (unit: Unit, index: number) {
        let newModelValue = props.modelValue.slice()
        newModelValue[index] = unit
        emit('update:modelValue', newModelValue)
      },
      addUnit () {
        let newModelValue = props.modelValue.slice()
        newModelValue.push({ unit: undefined, preferred: false })
        emit('update:modelValue', newModelValue)
      },
    }
  }
})
</script>
