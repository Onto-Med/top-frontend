<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="full-width">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="article" />
          {{ document.name }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section style="max-height: 70vh" class="scroll">
        <q-scroll-area class="highlighted-text">
          {{ document.highlightedText }}
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
const { dialogRef, onDialogHide } = useDialogPluginComponent()
</script>

<style scoped lang="sass">
.highlighted-text
  height: 60vh
  width: 100%
</style>
