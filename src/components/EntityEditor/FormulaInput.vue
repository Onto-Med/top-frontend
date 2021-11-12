<template>
  <q-card>
    <q-card-section class="q-pa-sm">
      <q-toolbar>
        <q-toolbar-title v-if="label">
          {{ label }}
        </q-toolbar-title>
        <q-btn
          v-if="helpText"
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
        <q-input :model-value="modelValue" debounce="200" type="textarea" @update:model-value="$emit('update:modelValue', $event)" />
      </div>

      <q-separator vertical />

      <div v-show="showHelp" class="col-6 q-pa-md">
        <div class="text-subtitle1">
          {{ t('help') }}:
        </div>
        {{ helpText }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'ExpressionInput',
  props: {
    modelValue: String,
    label: String,
    helpText: String
  },
  emits: ['update:modelValue'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const showHelp = ref(false)

    return { t, showHelp }
  }
})
</script>
