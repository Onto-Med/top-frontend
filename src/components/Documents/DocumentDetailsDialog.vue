<template>
  <q-dialog ref="dialogRef">
    <q-card class="full-width">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="article" />
          {{ document.name }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll q-pa-none">
        <q-scroll-area class="highlighted-text">
          <pre class="q-pa-sm q-ma-none">{{ document.highlightedText }}</pre>
        </q-scroll-area>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          flat
          :label="t('close')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Document } from '@onto-med/top-api'
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n'

defineProps<{
  document: Document
}>()

const { t } = useI18n()
const { dialogRef } = useDialogPluginComponent()
</script>

<style scoped lang="sass">
.highlighted-text
  height: 60vh
  width: 100%
  pre
    font-family: inherit
    text-wrap: wrap
</style>
