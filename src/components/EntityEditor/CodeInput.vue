<template>
  <expandable-card :title="t('code', 2)" :help-text="t('entityEditor.codesHelp')" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <div v-for="(entry, index) in modelValue" :key="index" class="row">
        <q-input
          :model-value="modelValue[index].code"
          :readonly="readonly"
          type="text"
          debounce="200"
          class="col"
          @update:model-value="updateEntryByIndex(index, $event, modelValue[index].codeSystem)"
        >
          <template #before>
            <code-system-input
              :model-value="getCodeSystem(modelValue[index].codeSystem.uri)"
              :options="codeSystems"
              :readonly="readonly"
              class="system-input"
              @selection-changed="updateEntryByIndex(index, modelValue[index].code, $event)"
            />
          </template>
          <template #after>
            <q-btn
              icon="search"
              type="a"
              target="_blank"
              :title="t('showThing', { thing: t('code') })"
              :href="codeUrl(modelValue[index])"
              @click.stop
            />
            <q-btn
              color="red"
              icon="remove"
              class="remove-localized-text-btn"
              :disable="readonly"
              :title="t('remove')"
              @click="removeEntryByIndex(index)"
            />
          </template>
        </q-input>
      </div>
    </template>

    <template #append>
      <q-card-actions class="q-pa-md">
        <q-btn
          color="primary"
          icon="add"
          class="add-localized-text-btn"
          :disable="readonly"
          :label="t('addThing', { thing: t('code') })"
          @click="addEntry()"
        />
      </q-card-actions>
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { Code, CodeSystem } from '@onto-med/top-api'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeSystemInput from 'src/components/CodeSystemInput.vue'
import ExpandableCard from 'src/components/ExpandableCard.vue'

export default defineComponent({
  name: 'CodeInput',
  components: {
    CodeSystemInput,
    ExpandableCard
  },
  props: {
    modelValue: {
      type: Array as () => Code[],
      default: () => []
    },
    expanded: Boolean,
    showHelp: Boolean,
    readonly: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const codeSystems = [
      { uri: 'http://snomed.info/id', name: 'SNOMED CT' },
      { uri: 'http://loinc.org', name: 'LOINC' },
      { uri: 'http://fhir.de/CodeSystem/bfarm/icd-10-gm', name: 'ICD-10-GM' },
      { uri: 'http://fhir.de/CodeSystem/bfarm/ops', name: 'OPS' },
      { uri: 'http://fhir.de/CodeSystem/bfarm/atc', name: 'ATC' }
    ] as CodeSystem[]

    return {
      t, codeSystems,

      codeUrl (code: Code) {
        if (!code || !code.codeSystem) return null
        return code.codeSystem.uri + '/' + code.code
      },
      getCodeSystem (uri: string) {
        return codeSystems.find(c => c.uri === uri)
      },
      removeEntryByIndex (index: number) {
        let newModelValue = props.modelValue.slice()
        newModelValue.splice(index, 1)
        emit('update:modelValue', newModelValue)
      },
      updateEntryByIndex (index: number, code: string, system: CodeSystem) {
        let newModelValue = props.modelValue.slice()
        newModelValue[index].code = code
        newModelValue[index].codeSystem = system
        emit('update:modelValue', newModelValue)
      },
      addEntry () {
        const newModelValue = props.modelValue.slice()
        let codeSystem = codeSystems[0]
        if (props.modelValue.length > 0 && props.modelValue[props.modelValue.length - 1].codeSystem)
          codeSystem = props.modelValue[props.modelValue.length - 1].codeSystem
        newModelValue.push({ codeSystem: codeSystem, code: '' })
        emit('update:modelValue', newModelValue)
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.system-input
  width: 150px
</style>