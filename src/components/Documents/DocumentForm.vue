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

<script setup lang="ts">
import { Document } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'

defineProps<{
  modelValue: Document,
  show: boolean
}>()

defineEmits(['update:show'])

const { t } = useI18n()
</script>

<style scoped lang="sass">

</style>
