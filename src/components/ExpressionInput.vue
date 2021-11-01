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
          icon="clear"
          :title="t('clearAll')"
          @click="showClearDialog = true"
        />
        <q-btn
          flat
          round
          dense
          icon="settings"
          :title="t('settings')"
          @click="showSettingsDialog = true"
        />
      </q-toolbar>
    </q-card-section>

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
            @click="$emit('update:modelValue', { type: ExpressionType.Union })"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showSettingsDialog">
      <q-card>
        <q-card-section>
          <div v-t="'settings'" class="text-h6" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-input v-model.number="indent" type="number" :label="t('indentWithSpaces')" />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('ok')" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-separator />

    <q-card-section>
      <expression-operand-input
        :class="{ monospace: monospace }"
        :model-value="modelValue"
        :inline="inline"
        :indent="indent"
        @update:model-value="$emit('update:modelValue', $event)"
        @entity-clicked="$emit('entityClicked', $event)"
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
    const showSettingsDialog = ref(false)
    const indent = ref(2)
    const showClearDialog = ref(false)

    return { t, hover, inline, showSettingsDialog, showClearDialog, indent, ExpressionType }
  }
})
</script>

<style lang="sass" scoped>
.monospace
  font-family: monospace, monospace
</style>