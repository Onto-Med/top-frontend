<template>
  <q-select
    v-show="!manualEntry"
    ref="codeInput"
    v-model="selection"
    option-label="code"
    use-input
    clearable
    emit-value
    debounce="200"
    class="col"
    :autofocus="autofocus"
    :placeholder="selection ? '' : t('searchForThing', { thing: t('code') })"
    :options="autoSuggestOptions"
    :loading="loading"
    :virtual-scroll-item-size="70"
    @filter="autoSuggest"
    @virtual-scroll="onScroll"
    @keyup.enter="select(selection)"
    @update:model-value="noBtn ? select($event) : undefined"
  >
    <template #selected>
      <span v-show="selection">
        {{ selection?.codeSystem.shortName || selection?.codeSystem.externalId }}:
        {{ selection?.name }}
        <small v-show="selection?.code">[{{ selection?.code }}]</small>
      </span>
    </template>
    <template #option="scope">
      <q-item
        v-bind="scope.itemProps"
        :disable="disabledCodes.some(code => code.uri == scope.opt.uri)"
      >
        <q-item-section>
          <q-item-label>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="scope.opt.highlightLabel ? scope.opt.highlightLabel : scope.opt.label" />
            <small v-show="scope.opt.code"> [{{ scope.opt.code }}]</small>
          </q-item-label>
          <!-- eslint-disable-next-line vue/no-v-html -->
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
        class="system-input"
      />
    </template>
    <template v-if="!noBtn" #after>
      <q-btn
        color="primary"
        :icon="btnIconName"
        :label="$q.screen.gt.sm ? btnLabel || t('addThing', { thing: t('code') }) : ''"
        :disable="!isValid"
        @click="select(selection)"
      />
    </template>
  </q-select>

  <q-input
    v-show="manualEntry"
    ref="manualCodeInput"
    v-model:model-value="manualCode.code"
    :label="t('code')"
    @keyup.enter="select(manualCode, true)"
  >
    <template #before>
      <q-input
        v-model:model-value="manualCode.codeSystem.uri"
        :label="t('codeSystemUri')"
        @keyup.enter="($refs.manualCodeInput as any).$el.focus()"
      />
    </template>
    <template #after>
      <q-btn
        color="secondary"
        :icon="btnIconName"
        :disabled="!isValidManualCode"
        :label="$q.screen.gt.sm ? btnManualLabel || t('addManually') : ''"
        @click="select(manualCode, true)"
      />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { Code, CodePage, CodeSystem } from '@onto-med/top-api'
import { computed, ref, inject, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeSystemInput from 'src/components/CodeSystemInput.vue'
import { CodeApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { ScrollDetails } from 'src/mixins/ScrollDetails'
import { QInput, QSelect } from 'quasar'

const props = defineProps({
  autofocus: Boolean,
  /** Label of the button that is used to select a code. */
  btnLabel: String,
  /** Label of the button that is used to select a manual code. */
  btnManualLabel: String,
  /** Icon name of both code select buttons. */
  btnIconName: {
    type: String,
    default: 'add'
  },
  /** Array of codes that will be disabled in the select field. */
  disabledCodes: {
    type: Array as () => Code[],
    default: () => []
  },
  /** Whether input fields for manual code entry should be used. */
  manualEntry: {
    type: Boolean,
    default: false
  },
  /**
   * Set to true to hide button next to the select field.
   * Selecting a code will automatically emit 'select'.
   */
  noBtn: Boolean
})

const emit = defineEmits(['select'])

const { t } = useI18n()
const { renderError } = useNotify()
const codeInput = ref<QSelect>()
const manualCodeInput = ref<QInput>()
const codeApi = inject(CodeApiKey)
const codeSystemFilter = ref<CodeSystem>()

const selection = ref<Code>()
const manualCode = ref<Code>({ code: '', codeSystem: { uri: '' } })

const autoSuggestOptions = ref<Code[]>([])
const loading = ref(false)
const prevInput = ref(undefined as string|undefined)
const nextPage = ref(2)
const totalPages = ref(0)

const isValid = computed(() => validateCode(selection.value))
const isValidManualCode = computed(() => validateCode(manualCode.value))

async function loadOptions (input?: string, codeSystems?: CodeSystem[], page = 1): Promise<CodePage> {
  if (!codeApi) return Promise.reject({ message: 'Could not load data from the server.' })
  return codeApi?.getCodeSuggestions(
    undefined,
    input?.toLowerCase(),
    codeSystems?.filter(cs => cs.externalId).map(cs => cs.externalId as string),
    page
  ).then(r => r.data)
}

function validateCode (code?: Code) {
  return !!code
    && code.code
    && code.codeSystem?.uri
    && !props.disabledCodes.some(code =>
      manualCode.value.code == code.code && manualCode.value.codeSystem?.uri == code.codeSystem?.uri
    )
}

function select (entry?: Code, manual = false) {
  if (!validateCode(entry)) return
  emit('select', entry)
  selection.value = undefined
  if (manual) {
    if (entry)
      manualCode.value = { code: entry.code, codeSystem: entry.codeSystem }
    manualCodeInput.value?.select()
  }
  else
    codeInput.value?.focus()
}

function autoSuggest (searchString: string, update: (callBackFn: () => void) => void, abort: () => void) {
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
}

function onScroll ({ to, direction, ref }: ScrollDetails) {
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
}
</script>

<style lang="sass" scoped>
.system-input
  width: 150px
</style>
