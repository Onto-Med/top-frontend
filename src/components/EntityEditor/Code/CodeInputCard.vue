<template>
  <expandable-card
    v-model:show-help="showHelp"
    :help-text="t('entityEditor.codesHelp')"
    :expanded="expanded"
    @update:expanded="$emit('update:expanded', $event)"
  >
    <template #title>
      <q-toolbar-title class="row items-center">
        {{ t('code', 2) }}
        <span v-if="!readonly" class="text-subtitle1 q-ml-md">
          <q-toggle
            v-model:model-value="showManualForm"
            :label="showManualForm ? t('manualEntry') : t('codeSearch')"
            color="primary"
            size="sm"
          />
        </span>
        <span
          v-show="warningIfEmpty && !modelValue.length"
          class="text-subtitle2 q-ml-md text-warning"
          :title="t('codeMissingDescription')"
        >
          <q-icon name="warning" />
          {{ t('codeMissing') }}
        </span>
        <q-space />
        <q-btn
          dense
          flat
          class="text-caption q-item__label--caption"
          icon="upload_file"
          :label="t('import')"
          :title="t('codeInput.importCsvDescription')"
          @click.stop="showImportDialog"
        />
      </q-toolbar-title>
    </template>

    <template #default>
      <code-input
        v-if="!readonly"
        :disabled-codes="disabledCodes"
        :manual-entry="showManualForm"
        @select="addEntries([$event])"
      />
    </template>

    <template #append>
      <q-card-section>
        <q-list dense separator>
          <q-item v-for="(entry, index) in modelValue" :key="index">
            <q-item-section>
              <a :href="entry.uri" target="_blank" class="code-link" :title="entry.uri ? t('showThing', { thing: t('code') }) : ''">
                {{ entry.codeSystem?.shortName || entry.codeSystem?.externalId || entry.codeSystem?.uri || t('unknownCodeSystem') }}:
                <span v-if="entry.name">
                  {{ entry.name }}
                  <small v-show="entry.code">[{{ entry.code }}]</small>
                </span>
                <span v-else>
                  {{ entry.code }}
                </span>
              </a>
              <q-space />
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>
                {{ te('codeScopes.' + entry.scope) ? t('codeScopes.' + entry.scope) : entry.scope }}
                <q-popup-edit
                  v-slot="scope"
                  :model-value="entry.scope"
                  buttons
                  :label-cancel="t('cancel')"
                  :label-set="t('set')"
                  @update:model-value="updateScopeByIndex(index, $event)"
                >
                  <enum-select
                    v-model:selected="scope.value"
                    i18n-prefix="codeScope"
                    :enum="CodeScope"
                    dense
                    autofocus
                    required
                  />
                </q-popup-edit>
              </q-item-label>
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

<script setup lang="ts">
import { Code, CodeScope } from '@onto-med/top-api'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import CodeInput from './CodeInput.vue'
import { useQuasar } from 'quasar'
import useNotify from 'src/mixins/useNotify'
import CodeImportDialog from './CodeImportDialog.vue'
import EnumSelect from 'src/components/EnumSelect.vue'

const props = defineProps({
  modelValue: {
    type: Array as () => Code[],
    default: () => []
  },
  expanded: Boolean,
  readonly: Boolean,
  /** Display a warning if modelValue Array is empty. */
  warningIfEmpty: Boolean
})

const emit = defineEmits(['update:modelValue', 'update:expanded'])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const $q = useQuasar()
const { notify } = useNotify()
const showManualForm = ref(false)
const showHelp = ref(false)

const disabledCodes = computed(() => {
  // It is allowed to have the same codes twice, one with scope 'self' and one with 'leaves'.
  // For simplicity, we just check if a code is already duplicated.
  return props.modelValue.filter((c1, i1) => props.modelValue.some((c2, i2) => codeEquals(c1, c2) && i1 != i2))
})

function codeEquals(code1?: Code, code2?: Code, includeScope = false) {
  if (!code1 || !code2) return false
  return code1.codeSystem.uri == code2.codeSystem.uri
    && code1.code == code2.code
    && (!includeScope || code1.scope == code2.scope)
}

function addEntries(entries?: Code[]) {
  if (!entries) return [false]
  const newModelValue = props.modelValue.slice()
  const results = entries.map(e => {
    if (newModelValue.some(c => codeEquals(c, e, true)))
      return false
    newModelValue.push(e)
    return true
  })
  emit('update:modelValue', newModelValue)
  return results
}

function updateScopeByIndex(index: number, scope: CodeScope) {
  let newModelValue = props.modelValue.slice()
  newModelValue[index].scope = scope
  emit('update:modelValue', newModelValue)
}

function removeEntryByIndex(index: number) {
  let newModelValue = props.modelValue.slice()
  newModelValue.splice(index, 1)
  emit('update:modelValue', newModelValue)
}

function showImportDialog() {
  $q.dialog({
    component: CodeImportDialog
  }).onOk(
    (codes: Code[]) => {
      const accepted = addEntries(codes).filter(e => !!e).length
      notify(t('codeImport.imported', accepted), 'positive')
      emit('update:expanded', true)
    }
  )
}
</script>

<style lang="sass" scoped>
.code-link
  text-decoration: none
  color: inherit
</style>
