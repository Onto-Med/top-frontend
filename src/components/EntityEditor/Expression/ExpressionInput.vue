<template>
  <expandable-card
    v-model:show-help="showHelp"
    :error="!modelValue || !modelValue.functionId"
    :help-text="helpText"
    :expanded="expanded"
    @update:expanded="$emit('update:expanded', $event)"
  >
    <template #title>
      <q-toolbar-title class="row items-center">
        {{ label }}
        <span class="text-subtitle1 q-ml-md">
          <q-toggle
            v-show="!readonly && canBeSwitch"
            :model-value="scores"
            :label="scores ? t('score', 2) : t('expression')"
            color="primary"
            size="sm"
            @update:model-value="toggleExpressionType($event)"
          />
        </span>
      </q-toolbar-title>
    </template>

    <template #default>
      <switch-input
        v-if="scores"
        :model-value="modelValue"
        :readonly="readonly"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <expression-argument-input
        v-else
        class="text-subtitle1"
        :readonly="readonly"
        :class="{ monospace: monospace }"
        :model-value="modelValue"
        :expand="expandExpression"
        :indent="indent || 2"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="entityTypes"
        :include-function-types="includeFunctionTypes"
        :exclude-function-types="excludeFunctionTypes"
        :exclude-functions="excludeFunctions"
        :simple-constants="simpleConstants"
        root
        @update:model-value="$emit('update:modelValue', $event)"
        @entity-clicked="$emit('entityClicked', $event)"
      />
    </template>

    <template #toolbar>
      <q-btn
        flat
        round
        dense
        icon="clear"
        :disable="readonly"
        :title="t('clearAll')"
        @click.stop="showClearDialog"
      />
      <q-btn flat round dense icon="settings" :title="t('setting', 2)" @click.stop>
        <q-menu class="q-pa-sm">
          <div class="text-h6 q-mb-sm">
            {{ t('setting', 2) }}
          </div>
          <q-toggle v-model="expandExpression" :label="t('expand')" />
          <q-input v-model.number="indent" type="number" :label="t('indentWithSpaces')" />
        </q-menu>
      </q-btn>
    </template>
  </expandable-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import ExpressionArgumentInput from 'src/components/EntityEditor/Expression/ExpressionArgumentInput.vue'
import SwitchInput from 'src/components/EntityEditor/Expression/SwitchInput.vue'
import Dialog from 'src/components/Dialog.vue'
import { EntityType, Expression } from '@onto-med/top-api'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: {
    type: Object as () => Expression,
    default: () => {
      return {}
    },
  },
  label: String,
  monospace: {
    type: Boolean,
    default: true,
  },
  expanded: Boolean,
  helpText: String,
  organisationId: String,
  repositoryId: String,
  readonly: Boolean,
  entityTypes: {
    type: Array as () => EntityType[],
    default: () => [],
  },
  canBeSwitch: Boolean,
  simpleConstants: Boolean,
  includeFunctionTypes: Array as () => string[],
  excludeFunctionTypes: Array as () => string[],
  excludeFunctions: Array as () => string[],
})

const emit = defineEmits(['update:modelValue', 'entityClicked', 'update:expanded'])

const { t } = useI18n()
const $q = useQuasar()
const expandExpression = ref<boolean>($q.localStorage.getItem('expandExpression') || false)
const indent = ref<number>($q.localStorage.getItem('expressionIndentSize') || 2)
const showHelp = ref(false)

const scores = computed(
  () => props.canBeSwitch && props.modelValue && props.modelValue.functionId === 'switch',
)

watch(expandExpression, (newVal) => $q.localStorage.set('expandExpression', newVal))

watch(indent, (newVal) => $q.localStorage.set('expressionIndentSize', newVal))

function showClearDialog() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('confirmClearExpression'),
    },
  }).onOk(() => emit('update:modelValue', {}))
}

function toggleExpressionType(state: boolean) {
  if (
    (props.modelValue.functionId && props.modelValue.functionId !== 'switch') ||
    props.modelValue.arguments ||
    props.modelValue.constantId ||
    props.modelValue.entityId
  ) {
    $q.dialog({
      component: Dialog,
      componentProps: {
        message: t('confirmChangeExpressionType'),
      },
    }).onOk(() => emit('update:modelValue', { functionId: state ? 'switch' : undefined }))
  } else {
    emit('update:modelValue', { functionId: state ? 'switch' : undefined })
  }
}
</script>

<style lang="scss" scoped>
.monospace {
  font-family: monospace, monospace;
}
</style>
