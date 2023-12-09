<template>
  <q-dialog ref="dialogRef" full-height>
    <q-card style="width: 750px; max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="article" />
          {{ document.name }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="scroll q-pa-none">
        <q-scroll-area class="highlighted-text">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <pre class="q-pa-sm q-ma-none" v-html="document.highlightedText" />
        </q-scroll-area>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Document } from '@onto-med/top-api'
import { useDialogPluginComponent } from 'quasar';

defineProps<{
  document: Document
}>()

const { dialogRef } = useDialogPluginComponent()
</script>

<style scoped lang="sass">
.highlighted-text
  height: 85vh
  width: 100%
  pre
    font-family: inherit
    text-wrap: wrap
    overflow-x: auto
    white-space: pre-wrap
    white-space: -moz-pre-wrap
    white-space: -pre-wrap
    white-space: -o-pre-wrap
    word-wrap: break-word
</style>
