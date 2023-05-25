<!-- eslint-disable vue/no-v-html -->
<template>
  <expandable-card :title="t('code', 2)" :help-text="t('entityEditor.codesHelp')" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <q-select
        v-if="!readonly"
        ref="codeInput"
        v-model="local"
        option-label="code"
        use-input
        clearable
        debounce="200"
        class="col"
        :options="autoSuggestOptions"
        @filter="autoSuggest"
        @keyup.enter="addEntry"
        @clear="clearAutoSuggestion"
      >
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label v-html="scope.opt.highlightLabel ? scope.opt.highlightLabel : scope.opt.code" />
              <q-item-label caption v-html="scope.opt.highlightSynonym ? scope.opt.highlightSynonym : scope.opt.name" />
            </q-item-section>
            <q-item-section avatar>
              <q-badge color="teal">
                {{ scope.opt.codeSystemShortName }}
              </q-badge>
            </q-item-section>
            <q-tooltip anchor="bottom middle" self="bottom start">
              <q-list dense>
                <q-item v-for="synonym in scope.opt.synonyms" :key="synonym">
                  {{ synonym }}
                </q-item>
              </q-list>
            </q-tooltip>
          </q-item>
        </template>
        <template #before>
          <code-system-input
            v-model="local.codeSystem"
            :options="codeSystems"
            :readonly="readonly"
            class="system-input"
            @update:model-value="(value) => codeSystemSelected(value)"
          />
        </template>
        <template #after>
          <q-btn color="primary" icon="add" :label="t('addThing', { thing: t('code') })" :disable="!isValid" @click="addEntry" />
        </template>
      </q-select>
    </template>

    <template #append>
      <q-card-section>
        <q-list dense separator>
          <q-item v-for="(entry, index) in modelValue" :key="index">
            <q-item-section>
              <a :href="codeUrl(modelValue[index])" target="_blank" class="code-link" :title="t('showThing', { thing: t('code') })">
                {{ getCodeSystem(entry.codeSystem?.uri)?.shortName }}: {{ entry.code }}
              </a>
            </q-item-section>
            <q-item-section avatar>
              <q-btn
                dense
                color="red"
                icon="remove"
                class="remove-localized-text-btn"
                :disable="readonly"
                :title="t('remove')"
                @click="removeEntryByIndex(index)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { Code, CodeSystem } from '@onto-med/top-api'
import { computed, defineComponent, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeSystemInput from 'src/components/CodeSystemInput.vue'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import { QSelect } from 'quasar'
import { useEntity } from 'src/pinia/entity'
import { CodeApiKey } from 'src/boot/axios'

const codeOptions: Code[] = []

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
  async setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const codeInput = ref(null as unknown as QSelect)

    const entityStore = useEntity()

    const codeApi     = inject(CodeApiKey)

    const codeSystemAll = {
      base: {} as CodeSystem,
        uri: '',
        name: '',
        shortName: '- ' + t('codeInput.allCodeSystems') + ' -'
    }

    const codeSystems = await entityStore.getCodeSystems() || []
    codeSystems.unshift(codeSystemAll)

    const emptyCode = {
      code: '',
      codeSystem: codeSystems[0]
    } as Code

    const local = ref(emptyCode)

    const isValid = computed(() => !!local.value && local.value.code && local.value.codeSystem?.uri)

    const autoSuggestOptions = ref(codeOptions)

    return {
      t, local, codeSystems, isValid, codeInput, autoSuggestOptions, emptyCode,

      codeUrl (code: Code) {
        if (!code || !code.codeSystem) return undefined
        return code.codeSystem.uri + '/' + code.code
      },

      getCodeSystem (uri: string) {
        return codeSystems === undefined ? undefined : codeSystems.find(c => c.uri === uri)
      },

      addEntry () {
        if (!isValid.value) return
        const newModelValue = props.modelValue.slice()
        newModelValue.push({
          code: local.value.code,
          name: local.value.name,
          uri: local.value.uri,
          codeSystem: {
            uri: local.value.codeSystem.uri,
            name: local.value.codeSystem.name,
            externalId: local.value.codeSystem.externalId
          }
        })
        emit('update:modelValue', newModelValue)
        codeInput.value.$data
      },

      removeEntryByIndex (index: number) {
        let newModelValue = props.modelValue.slice()
        newModelValue.splice(index, 1)
        emit('update:modelValue', newModelValue)
      },

      autoSuggest (searchString: string, update: (callBackFn: () => void) => void, abort: () => void) {
        if (searchString.length < 2) {
          abort()
          return
        }
        update(() => {
          codeApi?.getCodeSuggestions(undefined, searchString.toLowerCase(), [ local.value.codeSystem.externalId || '' ])
          .then(
            (result) => {
              autoSuggestOptions.value = result.data.content
              autoSuggestOptions.value.forEach(code => code.codeSystem = codeSystems.find(c => c.shortName === code.codeSystemShortName) || codeSystemAll)
          },
          (error) => {
            console.log(error)
          })
        })
      },

      abortAutoSuggest () {
        // do nothing for now
      },

      clearAutoSuggestion() {
        emptyCode.codeSystem = codeSystemAll
        local.value = emptyCode
      },

      codeSystemSelected (selectedCodeSystem: CodeSystem) {
        if (local.value !== undefined) {
          local.value = {
            code: '',
            codeSystem: selectedCodeSystem
          }
        }
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.system-input
  width: 150px
.code-link
  text-decoration: none
  color: inherit
</style>
