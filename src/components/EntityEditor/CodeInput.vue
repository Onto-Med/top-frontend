<template>
  <expandable-card :title="t('code', 2)" :help-text="t('entityEditor.codesHelp')" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <q-select
        v-if="!readonly"
        ref="codeInput"
        v-model="local.code"
        use-input
        emit-value
        debounce="200"
        class="col"
        :options="autoSuggestOptions"
        :loading="loading"
        @filter="autoSuggest"
        @virtual-scroll="onScroll"
        @keyup.enter="addEntry"
      >
        <template #selected>
          <span v-if="local.code">
            {{ local.code }}
          </span>
        </template>
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label v-if="scope.opt.codeSystem" overline>
                {{ scope.opt.codeSystem.name }}
              </q-item-label>
              <q-item-label>{{ scope.opt.name ||scope.opt.code }}</q-item-label>
              <template v-if="showDetails">
                <q-item-label v-for="(synonym, index) in scope.opt.synonyms" :key="index" caption class="ellipsis">
                  {{ synonym }}
                </q-item-label>
              </template>
            </q-item-section>
          </q-item>
        </template>
        <template #no-option>
          <q-item>
            <q-item-section>
              {{ t('entitySearchInput.emptyResult', { types: t('code', 2) }) }}
            </q-item-section>
          </q-item>
        </template>
        <template #before>
          <code-system-input
            v-model="local.codeSystem"
            :options="codeSystems"
            :readonly="readonly"
            class="system-input"
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
                {{ getCodeSystem(entry.codeSystem?.uri)?.name }}: {{ entry.code }}
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
import { Code, CodePage } from '@onto-med/top-api'
import { computed, defineComponent, ref, inject, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeSystemInput from 'src/components/CodeSystemInput.vue'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import { QSelect } from 'quasar'
import { useEntity } from 'src/pinia/entity'
import { CodeApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import ScrollDetails from 'src/mixins/ScrollDetails'

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
    readonly: Boolean,
    showDetails: Boolean
  },
  emits: ['update:modelValue'],
  async setup (props, { emit }) {
    const { t } = useI18n()
    const codeInput = ref(null as unknown as QSelect)
    const { renderError } = useNotify()
    const entityStore = useEntity()

    const codeApi     = inject(CodeApiKey)
    const codeSystems = await entityStore.getCodeSystems() || []
    const local = ref({ codeSystem : codeSystems[0] } as Code)
    const isValid = computed(() => !!local.value && local.value.code && local.value.codeSystem?.uri)

    const autoSuggestOptions = ref<Code[]>([])
    const loading = ref(false)
    const prevInput  = ref(undefined as string|undefined)
    const nextPage   = ref(2)
    const totalPages = ref(0)

    const loadOptions = async (input: string|undefined, page = 1): Promise<CodePage> => {
      if (!codeApi) return Promise.reject({ message: 'Could not load data from the server.' })
      return codeApi?.getCodeSuggestions(undefined, input?.toLowerCase(), [], page)
        .then(r => r.data)
    }

    return {
      t,
      local,
      codeSystems,
      isValid,
      codeInput,
      autoSuggestOptions,
      loading,

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
          codeSystem: {
            external_id: local.value.codeSystem.external_id,
            uri: local.value.codeSystem.uri,
            name: local.value.codeSystem.name
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

      autoSuggest (searchString: string, update: (arg0: () => void) => void, abort: () => void) {
        if (searchString.length < 2) {
          abort()
          return
        }
        prevInput.value = searchString
        loading.value = true
        nextPage.value = 2
        totalPages.value = 0
        loadOptions(searchString)
          .then(page => {
            totalPages.value = page.totalPages
            update(() => autoSuggestOptions.value = page.content)
          })
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      },

      onScroll ({ to, direction, ref }: ScrollDetails) {
        const lastIndex = autoSuggestOptions.value.length - 1
        if (loading.value || !prevInput.value || nextPage.value > totalPages.value || to !== lastIndex || direction === 'decrease')
          return
        loading.value = true
        loadOptions(prevInput.value, nextPage.value)
          .then(page => {
            totalPages.value = page.totalPages
            if (page.content.length > 0) {
              nextPage.value++
              autoSuggestOptions.value = autoSuggestOptions.value.concat(page.content)
              void nextTick(() => {
                ref.refresh()
                loading.value = false
              })
            }
          })
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      },

      abortAutoSuggest () {
        // do nothing for now
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
