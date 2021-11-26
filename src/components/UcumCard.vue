<template>
  <q-card>
    <q-card-section class="q-pa-sm">
      <q-toolbar>
        <q-toolbar-title>{{ t('unit', 2) }}</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="info"
          :title="t('showThing', { thing: t('help') })"
          @click="showHelp = !showHelp"
        />
      </q-toolbar>
    </q-card-section>
    <q-separator />
    <q-card-section class="row q-pa-none">
      <div class="col q-pa-md">
        <div v-for="(unit, index) in modelValue" :key="index" class="row">
          <ucum-input :model-value="modelValue[index].unit" @update:modelValue="updateUnitByIndex({ unit: $event }, index)">
            <template #after>
              <q-btn icon="remove" class="remove-ucum-btn" :title="t('remove')" color="red" @click="removeUnitByIndex(index)" />
            </template>
          </ucum-input>
        </div>
      </div>
      <q-separator v-show="showHelp" vertical />
      <div v-show="showHelp" class="col-6 q-pa-md">
        <div class="text-subtitle1">
          {{ t('help') }}:
        </div>
        {{ t('ucumCard.help') }}
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions>
      <q-btn icon="add" color="primary" class="add-ucum-btn" :label="t('addThing', { thing: t('unit') })" @click="addUnit" />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UcumInput from 'src/components/UcumInput.vue'
import { Unit } from '@onto-med/top-api'

export default defineComponent({
  name: 'UcumCard',
  components: {
    UcumInput
  },
  props: {
    modelValue: {
      type: Array as () => Array<Unit>,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const showHelp = ref(false)

    return {
      t, showHelp,
      
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
        newModelValue.push(undefined)
        emit('update:modelValue', newModelValue)
      },
    }
  }
})
</script>
