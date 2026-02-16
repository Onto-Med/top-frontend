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
          no-caps
          class="text-caption"
          icon="upload_file"
          :label="t('import')"
          :title="t('codeInput.importCsvDescription')"
          @click.stop="showImportDialog"
        />
      </q-toolbar-title>
    </template>

    <template v-if="!readonly" #default>
      <code-input
        :disabled-codes="disabledCodes"
        :manual-entry="showManualForm"
        @select="addEntries([$event as CodeWithScope])"
      />
      <q-inner-loading :showing="loading" />
    </template>

    <template #append>
      <q-card-section>
        <q-list dense separator>
          <q-item v-for="(entry, index) in modelValue" :key="index">
            <q-item-section>
              <q-tree dense :nodes="[entry]" node-key="uri" children-key="children">
                <template #default-header="{ node }">
                  {{
                    node.codeSystem?.shortName ||
                    node.codeSystem?.externalId ||
                    node.codeSystem?.uri ||
                    t('unknownCodeSystem')
                  }}:&nbsp;
                  <span v-if="node.name">
                    {{ node.name }}
                    <small v-show="node.code">[{{ node.code }}]</small>
                  </span>
                  <span v-else>
                    {{ node.code }}
                  </span>
                  <q-space />
                  <q-btn-group>
                    <q-btn
                      v-show="node.uri"
                      dense
                      icon="search"
                      size="sm"
                      :href="node.uri"
                      target="_blank"
                      :title="node.uri ? t('showThing', { thing: t('code') }) : ''"
                      @click.stop
                    />
                    <q-btn
                      dense
                      color="red"
                      icon="remove"
                      :disable="readonly"
                      :title="t('remove')"
                      size="sm"
                      @click="removeEntry(node)"
                    />
                  </q-btn-group>
                </template>
              </q-tree>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </template>
  </expandable-card>
</template>

<script setup lang="ts">
import { Code, CodeScope } from '@onto-med/top-api'
import { CodeApiKey } from 'src/boot/axios'
import { computed, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import CodeInput from './CodeInput.vue'
import { useQuasar } from 'quasar'
import useNotify from 'src/mixins/useNotify'
import CodeImportDialog from './CodeImportDialog.vue'

interface CodeWithScope {
  code: Code
  scope: CodeScope
}

const props = defineProps({
  modelValue: {
    type: Array as () => Code[],
    default: () => [],
  },
  expanded: Boolean,
  readonly: Boolean,
  /** Display a warning if modelValue Array is empty. */
  warningIfEmpty: Boolean,
})

const emit = defineEmits(['update:modelValue', 'update:expanded'])

const { t } = useI18n()
const $q = useQuasar()
const { notify } = useNotify()
const showManualForm = ref(false)
const showHelp = ref(false)
const codeApi = inject(CodeApiKey)
const loading = ref(false)

const disabledCodes = computed(() => {
  return props.modelValue.filter((c1, i1) =>
    props.modelValue.some((c2, i2) => codeEquals(c1, c2) && i1 != i2),
  )
})

function codeEquals(code1?: Code, code2?: Code) {
  if (!code1 || !code2) return false
  return code1.codeSystem.uri == code2.codeSystem.uri && code1.code == code2.code
}

async function addEntries(entries?: CodeWithScope[]) {
  if (!entries) return Promise.resolve([false])
  if (!codeApi) return Promise.reject({ message: t('errorLoadingData', { type: 'Code' }) })

  loading.value = true
  const newModelValue = props.modelValue.slice()
  return Promise.all(
    entries.map(async ({ code: code, scope: scope }) => {
      if (newModelValue.some((c) => codeEquals(c, code))) return false
      if (scope == CodeScope.Self) {
        newModelValue.push(code)
      } else {
        await codeApi
          ?.getCode(encodeURIComponent(code.uri!), code?.codeSystem?.externalId || '', scope)
          .then((r) => newModelValue.push(r.data))
      }
      return true
    }),
  )
    .then((r) => {
      emit('update:modelValue', newModelValue)
      return r
    })
    .finally(() => (loading.value = false))
}

function removeEntry(codeToRemove: Code) {
  const newModelValue = props.modelValue.slice()
  if (newModelValue.includes(codeToRemove)) {
    newModelValue.splice(newModelValue.indexOf(codeToRemove), 1)
  } else {
    for (const code of newModelValue) {
      removeNestedSubNode(code, codeToRemove)
    }
  }
  emit('update:modelValue', newModelValue)
}

function removeNestedSubNode(code: Code, codeToRemove: Code) {
  if (code.children && code.children.includes(codeToRemove)) {
    code.children.splice(code.children.indexOf(codeToRemove), 1)
  }
  for (const childCode of code.children || []) {
    removeNestedSubNode(childCode, codeToRemove)
  }
}

function showImportDialog() {
  $q.dialog({
    component: CodeImportDialog,
  }).onOk((codes: Code[]) => {
    addEntries(
      codes.map((code) => {
        return { code: code, scope: CodeScope.Self }
      }),
    )
      .then((r) => {
        const accepted = r.filter((e) => !!e).length
        notify(t('codeImport.imported', accepted), 'positive')
        emit('update:expanded', true)
      })
      .catch((e: Error) => {
        notify(t('codeImport.failed') + ` (${e.message})`)
      })
  })
}
</script>
