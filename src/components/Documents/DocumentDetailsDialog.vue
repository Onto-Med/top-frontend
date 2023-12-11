<template>
  <q-dialog ref="dialogRef">
    <q-card class="content">
      <q-card-section class="row items-center">
        <div class="text-h6">
          <q-icon name="article" />
          {{ document.name }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
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
import { useDialogPluginComponent } from 'quasar'

defineProps<{
  document: Document
}>()

const { dialogRef } = useDialogPluginComponent()
</script>

<style scoped lang="sass">
.content
  width: 750px
  max-width: 80vw
.highlighted-text
  height: 85vh
  width: 100%
  pre
    font-family: inherit
    text-wrap: wrap
    word-wrap: break-word
</style>
<style lang="sass">
.highlighted-text .q-scrollarea__content
  width: 100% !important
</style>
