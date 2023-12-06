<template>
  <q-dialog :model-value="show" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ modelValue.name }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="q-pa-lg">
          {{ modelValue.highlightedText }}
        </div>
      </q-card-section>
      <q-btn
        class="q-ma-sm"
        @click="$emit('update:show', $event)"
      >
        {{ t('close') }}
      </q-btn>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import {Document} from '@onto-med/top-api';
import {useI18n} from 'vue-i18n';

export default defineComponent({
  props: {
    modelValue: {
      type: Object as () => Document,
      required: true
    },
    show: Boolean
  },
  emits: ['update:show'],
  setup() {
    const { t } = useI18n()
    return {
      t,
    }
  }
})
</script>

<style scoped lang="sass">

</style>
