<template>
  <q-dialog ref="dialogRef">
    <q-card class="content">
      <q-card-section class="row items-center">
        <q-btn-group push spread>
          <q-btn
            icon="keyboard_arrow_left"
            :disable="docIdx === 0"
            no-caps
            @click="displayDocument(-1)"
          />
          <q-btn
            icon="keyboard_arrow_right"
            :disable="docIdx >= availableDocuments.length - 1"
            no-caps
            @click="displayDocument(1)"
          />
        </q-btn-group>
        <q-space />
        <div class="text-h6">
          <q-icon name="article" />
          {{ slide }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />
      <q-card-section>
        <div class="scroll q-pa-none">
          <q-scroll-area class="highlighted-text">
            <pre id="document-scrolled-area" class="q-pa-sm q-ma-none" v-html="documentRef?.highlightedText" />
          </q-scroll-area>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ConceptCluster, DataSource, Document } from '@onto-med/top-api'
import { useDialogPluginComponent, scroll } from 'quasar'
import { inject, onMounted, ref } from 'vue'
import { DocumentApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'

const { renderError } = useNotify()
const { getScrollTarget } = scroll
const documentApi = inject(DocumentApiKey)

interface ConceptColor {
  'background-color'?: string
  color?: string
}

const props = defineProps<{
  document: Document
  availableDocuments: Array<string>
  documentQueryOffsets?: { [key: string]: string[] } | undefined
  dataSource: DataSource
  selectedConcepts: number[]
  conceptColors: ConceptColor[]
  concepts: ConceptCluster[]
}>()

const { dialogRef } = useDialogPluginComponent()

const slide = ref(props.document.name)
const docIdx = ref(0)
const documentRef = ref(props.document)

onMounted(() => {
  if (props.document.name != undefined && props.document.id != undefined) {
    slide.value = props.document.name
    docIdx.value = props.availableDocuments.findIndex((idx) => props.document.id === idx)
  }
  displayDocument(0).catch((e) => renderError(e))
})

async function displayDocument(dir: number) {
  let documentId: string | undefined
  let newIdx: number = docIdx.value

  if (dir == 0) {
    documentId = props.document.id
    if (documentId === undefined) {
      if (props.availableDocuments.length == 0) return Promise.reject()
      documentId = props.availableDocuments[0]
    }
  } else {
    newIdx = docIdx.value + dir
    if (newIdx < 0) newIdx = 0
    if (newIdx >= props.availableDocuments.length) newIdx = props.availableDocuments.length - 1
    documentId = props.availableDocuments[newIdx]
  }

  if (!props.dataSource) return Promise.reject()
  const conceptIds = new Array<string>()
  for (const c of props.selectedConcepts) {
    if (c != undefined)
      conceptIds.push(
        '$color::' +
          props.conceptColors[c]?.['background-color'] +
          '|' +
          props.conceptColors[c]?.['color'] +
          '::color$' +
          props.concepts[c]?.id,
      )
  }

  if (documentId === undefined) return Promise.reject()

  await documentApi
    ?.getSingleDocumentById(
      documentId,
      props.dataSource.id,
      conceptIds,
      props.documentQueryOffsets === undefined || documentId == null
        ? undefined
        : props.documentQueryOffsets[documentId],
    )
    .then((r) => {
      documentRef.value = r.data
      slide.value = documentRef.value.name
      docIdx.value = newIdx
      const scrollArea = document.getElementById('document-scrolled-area')
      if (scrollArea) getScrollTarget(scrollArea).scrollTo(0,0)
    })
    .catch((e: Error) => renderError(e))
}
</script>

<style scoped lang="scss">
.content {
  width: 750px;
  max-width: 80vw;
  overflow: hidden;
}
.highlighted-text {
  height: 85vh;
  width: 100%;
  pre {
    font-family: inherit;
    text-wrap: wrap;
    word-wrap: break-word;
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -pre-wrap;
    white-space: -o-pre-wrap;
  }
}
</style>
<style lang="scss">
.highlighted-text .q-scrollarea__content {
  width: 100% !important;
}
</style>
