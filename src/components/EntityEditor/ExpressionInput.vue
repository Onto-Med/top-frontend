<template>
  <q-card>
    <q-card-section v-if="label" class="q-pa-sm">
      <q-toolbar>
        <q-toolbar-title>{{ label }}</q-toolbar-title>
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
          :title="t('setting', 2)"
        >
          <q-menu class="q-pa-sm">
            <div class="text-h6 q-mb-sm">
              {{ t('setting', 2) }}
            </div>
            <q-toggle v-model="expand" :label="t('expand')" />
            <q-input v-model.number="indent" type="number" :label="t('indentWithSpaces')" />
          </q-menu>
        </q-btn>
        <q-btn
          flat
          round
          dense
          icon="info"
          :title="t('showThing', { thing: t('help') })"
          @click="showHelp = !showHelp"
        />
      </q-toolbar>
    </q-card-section>

    <q-separator />

    <q-card-section class="row q-pa-none">
      <div class="col q-pa-md">
        <expression-operand-input
          class="text-subtitle1"
          :class="{ monospace: monospace }"
          :model-value="modelValue"
          :expand="expand"
          :indent="indent || 2"
          @update:model-value="$emit('update:modelValue', $event)"
          @entity-clicked="$emit('entityClicked', $event)"
        />
      </div>

      <q-separator v-show="showHelp" vertical />

      <div v-show="showHelp" class="col-4 q-pa-md">
        <div class="text-subtitle1">
          {{ t('help') }}:
        </div>
        {{ t('entityEditor.expressionHelp') }}
      </div>
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
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IExpression, ExpressionType } from 'src/components/models'
import ExpressionOperandInput from 'src/components/EntityEditor/ExpressionOperandInput.vue'

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
    const expand = ref(false)
    const indent = ref(2)
    const showClearDialog = ref(false)
    const showHelp = ref(false)

    return { t, hover, expand, showClearDialog, indent, showHelp, ExpressionType }
  }
})
</script>

<style lang="sass" scoped>
.monospace
  font-family: monospace, monospace
</style>