<template>
  <expandable-card :title="label" :help-text="t('entityEditor.expressionHelp')" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <expression-operand-input
        class="text-subtitle1"
        :class="{ monospace: monospace }"
        :model-value="modelValue"
        :expand="expandExpression"
        :indent="indent || 2"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
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
        :title="t('clearAll')"
        @click.stop="showClearDialog = true"
      />
      <q-btn
        flat
        round
        dense
        icon="settings"
        :title="t('setting', 2)"
        @click.stop
      >
        <q-menu class="q-pa-sm">
          <div class="text-h6 q-mb-sm">
            {{ t('setting', 2) }}
          </div>
          <q-toggle v-model="expandExpression" :label="t('expand')" />
          <q-input v-model.number="indent" type="number" :label="t('indentWithSpaces')" />
        </q-menu>
      </q-btn>
    </template>

    <template #append>
      <q-dialog v-model="showClearDialog">
        <q-card>
          <q-card-section class="row items-center">
            <q-avatar icon="warning_amber" color="warning" text-color="white" />
            <span v-t="'confirmClearExpression'" class="q-ml-sm" />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
            <q-btn
              v-close-popup
              flat
              :label="t('ok')"
              color="primary"
              @click="$emit('update:modelValue', {})"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpressionOperandInput from 'src/components/EntityEditor/ExpressionOperandInput.vue'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import { Expression, ExpressionType } from '@onto-med/top-api'

export default defineComponent({
  name: 'ExpressionInput',
  components: {
    ExpressionOperandInput,
    ExpandableCard
  },
  props: {
    modelValue: {
      type: Object as () => Expression,
      default: () => { return {} }
    },
    label: String,
    monospace: {
      type: Boolean,
      default: true
    },
    expanded: Boolean,
    showHelp: Boolean,
    organisationId: String,
    repositoryId: String
  },
  emits: ['update:modelValue', 'entityClicked', 'removeClicked'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const hover = ref(false)
    const expandExpression = ref(false)
    const indent = ref(2)
    const showClearDialog = ref(false)

    return { t, hover, expandExpression, showClearDialog, indent, ExpressionType }
  }
})
</script>

<style lang="sass" scoped>
.monospace
  font-family: monospace, monospace
</style>