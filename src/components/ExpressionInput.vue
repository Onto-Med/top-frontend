<template>
  <q-card>
    <q-card-section v-if="label">
      <div class="text-h6">
        {{ label }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <expression-operand-input
        :class="{ monospace: monospace }"
        :model-value="modelValue"
      />
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IExpression } from 'src/components/models'
import ExpressionOperandInput from 'src/components/ExpressionOperandInput.vue'

export default defineComponent({
  name: 'ExpressionInput',
  components: {
    ExpressionOperandInput
  },
  props: {
    modelValue: {
      type: Object as () => IExpression,
      required: true
    },
    label: String,
    monospace: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'entityClicked', 'removeClicked'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const hover = ref(false)

    return { t, hover }
  }
})
</script>

<style lang="sass" scoped>
.monospace
  font-family: monospace, monospace
</style>