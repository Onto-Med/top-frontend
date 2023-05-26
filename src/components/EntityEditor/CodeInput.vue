<!-- eslint-disable vue/no-v-html -->
<template>
  <expandable-card :title="t('code', 2)" :help-text="t('entityEditor.codesHelp')" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <q-select
        v-if="!readonly"
        v-model="selection"
        option-label="code"
        use-input
        clearable
        emit-value
        debounce="200"
        class="col"
        :placeholder="selection ? '' : t('selectThing', { thing: t('code') })"
        :options="autoSuggestOptions"
        :loading="loading"
        :virtual-scroll-item-size="70"
        @filter="autoSuggest"
        @virtual-scroll="onScroll"
        @keyup.enter="addEntry"
      >
        <template #selected>
          <span v-show="selection">
            {{ selection?.codeSystem.shortName || selection?.codeSystem.externalId }}:
            {{ selection?.name }}
            <small v-show="selection?.code">[{{ selection?.code }}]</small>
          </span>
        </template>
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>
                <span v-html="scope.opt.highlightLabel ? scope.opt.highlightLabel : scope.opt.label" />
                <small v-show="scope.opt.code"> [{{ scope.opt.code }}]</small>
              </q-item-label>
              <q-item-label caption v-html="scope.opt.highlightSynonym ? scope.opt.highlightSynonym : scope.opt.name" />
            </q-item-section>
            <q-item-section avatar>
              <q-badge v-if="scope.opt.codeSystem" color="teal">
                {{ scope.opt.codeSystem.shortName || scope.opt.codeSystem.externalId }}
              </q-badge>
            </q-item-section>
            <q-tooltip v-if="scope.opt.synonyms?.length" anchor="bottom middle" self="bottom start">
              <b>{{ t('synonym', 2) }}:</b>
              <ul class="q-pl-md q-my-none">
                <li v-for="synonym in scope.opt.synonyms" :key="synonym">
                  {{ synonym }}
                </li>
              </ul>
            </q-tooltip>
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
            v-model="codeSystemFilter"
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
              <a :href="entry.uri" target="_blank" class="code-link" :title="t('showThing', { thing: t('code') })">
                {{ entry.codeSystem?.shortName || entry.codeSystem?.externalId || t('unknownCodeSystem') }}:
                {{ entry.name }}
                <small v-show="entry.code">[{{ entry.code }}]</small>
              </a>
            </q-item-section>
            <q-item-section avatar>
              <q-btn
                dense
                color="red"
                icon="remove"
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
import { Code, CodePage, CodeSystem } from '@onto-med/top-api'
import { computed, defineComponent, ref, inject, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeSystemInput from 'src/components/CodeSystemInput.vue'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import { CodeApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import ScrollDetails from 'src/mixins/ScrollDetails'

export default defineComponent({
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
    const { t } = useI18n()
    const { renderError } = useNotify()

    const codeApi     = inject(CodeApiKey)
    const codeSystemFilter = ref<CodeSystem>()

    const selection = ref<Code>()

    const isValid = computed(() =>
      !!selection.value && selection.value.code && selection.value.codeSystem?.uri
    )

    const autoSuggestOptions = ref<Code[]>([])
    const loading = ref(false)
    const prevInput  = ref(undefined as string|undefined)
    const nextPage   = ref(2)
    const totalPages = ref(0)

    const loadOptions = async (input?: string, codeSystems?: CodeSystem[], page = 1): Promise<CodePage> => {
      if (!codeApi) return Promise.reject({ message: 'Could not load data from the server.' })
      return codeApi?.getCodeSuggestions(
        undefined,
        input?.toLowerCase(),
        codeSystems?.filter(cs => cs.externalId).map(cs => cs.externalId as string),
        page
      ).then(r => r.data)
    }

    return {
      t,
      selection,
      isValid,
      autoSuggestOptions,
      loading,
      codeSystemFilter,

      addEntry () {
        if (!isValid.value) return
        const newModelValue = props.modelValue.slice()
        newModelValue.push(selection.value as Code)
        emit('update:modelValue', newModelValue)
        selection.value = undefined
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
        prevInput.value = searchString
        loading.value = true
        nextPage.value = 2
        totalPages.value = 0
        loadOptions(searchString, codeSystemFilter.value ? [codeSystemFilter.value] : undefined)
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
        loadOptions(prevInput.value, codeSystemFilter.value ? [codeSystemFilter.value] : undefined, nextPage.value)
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
