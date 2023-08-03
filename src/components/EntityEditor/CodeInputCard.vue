<!-- eslint-disable vue/no-v-html -->
<template>
  <expandable-card :help-text="t('entityEditor.codesHelp')" :expanded="expanded" :show-help="showHelp">
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
      </q-toolbar-title>
    </template>

    <template #default>
      <code-input
        v-if="!readonly"
        :disabled-codes="modelValue"
        :manual-entry="showManualForm"
        @select="addEntry"
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
import { Code } from '@onto-med/top-api'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import CodeInput from '../CodeInput.vue'

const props = defineProps({
  modelValue: {
    type: Array as () => Code[],
    default: () => []
  },
  expanded: Boolean,
  showHelp: Boolean,
  readonly: Boolean
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const showManualForm = ref(false)

function addEntry (entry?: Code) {
  const newModelValue = props.modelValue.slice()
  newModelValue.push(entry as Code)
  emit('update:modelValue', newModelValue)
}

function removeEntryByIndex (index: number) {
  let newModelValue = props.modelValue.slice()
  newModelValue.splice(index, 1)
  emit('update:modelValue', newModelValue)
}
</script>

<style lang="sass" scoped>
.code-link
  text-decoration: none
  color: inherit
</style>
