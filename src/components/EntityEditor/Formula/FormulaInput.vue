<template>
  <expandable-card
    :title="label"
    :error="modelValue === undefined || modelValue.type === undefined"
    :help-text="t('entityEditor.formulaHelp')"
    :expanded="expanded"
    :show-help="showHelp"
  >
    <template #default>
      <formula-operand-input
        class="text-subtitle1"
        :readonly="readonly"
        :class="{ monospace: monospace }"
        :model-value="modelValue"
        :expand="expand"
        :indent="indent || 2"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        root
        @update:model-value="$emit('update:modelValue', $event)"
        @entity-clicked="$emit('entityClicked', $event)"
      />
    </template>

    <template #toolbar>
      TOOLBAR
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import FormulaOperandInput from 'src/components/EntityEditor/Formula/FormulaOperandInput.vue'
import { Formula } from '@onto-med/top-api'

export default defineComponent({
  name: 'FormulaInput',
  components: {
    FormulaOperandInput,
    ExpandableCard
  },
  props: {
    modelValue: {
      type: Object as () => Formula,
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
  emits: ['update:modelValue', 'entityClicked'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const expand = ref(false)
    const indent = ref(2)

    return { t, expand, indent }
  }
})
</script>

<style lang="sass" scoped>
.monospace
  font-family: monospace, monospace
</style>