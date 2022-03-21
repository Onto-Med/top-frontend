<template>
  <expandable-card
    :title="label"
    :error="modelValue === undefined || modelValue.operator === undefined"
    :help-text="t('entityEditor.expressionHelp')"
    :expanded="expanded"
    :show-help="showHelp"
  >
    <template #default>
      <expression-operand-input
        class="text-subtitle1"
        :operators="operators"
        :readonly="readonly"
        :class="{ monospace: monospace }"
        :model-value="modelValue"
        :expand="expandExpression"
        :indent="indent || 2"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="entityTypes"
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
              :disable="readonly"
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
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpressionOperandInput from 'src/components/EntityEditor/Expression/ExpressionOperandInput.vue'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import { Expression, ExpressionMultaryOperator, ExpressionOperator, RepresentationEnum, TypeEnum } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

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
    repositoryId: String,
    readonly: Boolean
  },
  emits: ['update:modelValue', 'entityClicked', 'removeClicked'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const { restrictionEntityTypes } = useEntityFormatter()

    return {
      t,
      expandExpression: ref(false),
      indent: ref(2),
      showClearDialog: ref(false),
      entityTypes: computed(() => restrictionEntityTypes()),
      operators: [
        {
          id: 'union',
          title: 'or',
          representation: RepresentationEnum.Prefix,
          type: TypeEnum.Multary,
          required: 2
        } as ExpressionMultaryOperator,
        {
          id: 'intersection',
          title: 'and',
          representation: RepresentationEnum.Prefix,
          type: TypeEnum.Multary,
          required: 2
        } as ExpressionMultaryOperator,
        {
          id: 'complement',
          title: 'not',
          representation: RepresentationEnum.Prefix,
          type: TypeEnum.Unary
        } as ExpressionOperator,
        {
          id: 'entity',
          title: 'entity',
          representation: RepresentationEnum.Prefix,
          type: TypeEnum.Unary
        } as ExpressionOperator
      ]
    }
  }
})
</script>

<style lang="sass" scoped>
.monospace
  font-family: monospace, monospace
</style>