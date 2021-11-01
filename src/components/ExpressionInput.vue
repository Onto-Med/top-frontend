<template>
  <q-card>
    <q-card-section v-if="label">
      <q-toolbar>
        <q-toolbar-title>{{ label }}</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          :icon="inline ? 'height' : 'format_align_left'"
          :title="inline ? t('expand') : t('alignLeft')"
          @click="inline = !inline"
        />
        <q-btn
          flat
          round
          dense
          icon="clear_all"
          :title="t('clearAll')"
          @click="$emit('update:modelValue', { type: ExpressionType.Union })"
        />
      </q-toolbar>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <expression-operand-input
        :class="{ monospace: monospace }"
        :model-value="modelValue"
        :inline="inline"
      />
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IExpression, ExpressionType } from 'src/components/models'
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
    const inline = ref(true)

    return { t, hover, inline, ExpressionType }
  }
})
</script>

<style lang="sass" scoped>
.monospace
  font-family: monospace, monospace
</style>