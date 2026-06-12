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

      <q-card-section v-if="currentRagReference" class="q-pb-none">
        <q-banner rounded class="rag-reference-banner">
          <template #avatar>
            <q-icon name="manage_search" color="primary" />
          </template>
          <div class="text-subtitle2">RAG source {{ currentRagReference.ref }}</div>
          <div class="q-mt-xs row q-gutter-xs">
            <q-chip
              v-if="formatRange(currentRagReference.documentHighlightStart, currentRagReference.documentHighlightEnd)"
              dense
              color="orange-2"
              text-color="dark"
            >
              Highlight:
              {{ formatRange(currentRagReference.documentHighlightStart, currentRagReference.documentHighlightEnd) }}
            </q-chip>
            <q-chip
              v-if="formatRange(currentRagReference.chunkStart, currentRagReference.chunkEnd)"
              dense
              color="blue-1"
              text-color="dark"
            >
              Chunk: {{ formatRange(currentRagReference.chunkStart, currentRagReference.chunkEnd) }}
            </q-chip>
          </div>
          <div
            v-if="currentRagReference.retrievedSnippet"
            class="rag-snippet q-mt-sm"
            :style="{ maxHeight: `${ragSnippetHeight}px` }"
          >
            {{ currentRagReference.retrievedSnippet }}
          </div>
          <div
            v-if="currentRagReference.retrievedSnippet"
            class="rag-banner-resize-handle q-mt-xs"
            title="Drag to resize"
            @pointerdown.prevent="startResizeRagBanner"
          >
            <q-icon name="drag_handle" size="sm" />
          </div>
        </q-banner>
      </q-card-section>

      <q-card-section class="document-section">
        <div class="document-scroll-container q-pa-none">
          <q-scroll-area class="highlighted-text">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <pre
              id="document-scrolled-area"
              class="q-pa-sm q-ma-none"
              v-html="documentRef?.highlightedText"
            />
          </q-scroll-area>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ConceptCluster, DataSource, Document } from '@onto-med/top-api'
import { useDialogPluginComponent, scroll } from 'quasar'
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { DocumentApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'

const { renderError } = useNotify()
const { getScrollTarget } = scroll
const documentApi = inject(DocumentApiKey)

interface ConceptColor {
  'background-color'?: string
  color?: string
}

interface RagReference {
  ref: string
  chunkStart?: number | null
  chunkEnd?: number | null
  documentHighlightStart?: number | null
  documentHighlightEnd?: number | null
  retrievedSnippet?: string
  highlight?: string
}

const props = defineProps<{
  document: Document
  availableDocuments: Array<string>
  documentQueryOffsets?: { [key: string]: string[] } | undefined
  dataSource: DataSource
  selectedConcepts: number[]
  conceptColors: ConceptColor[]
  concepts: ConceptCluster[]
  ragReference?: RagReference
  ragReferences?: Record<string, RagReference>
}>()

const { dialogRef } = useDialogPluginComponent()

const slide = ref(props.document.name)
const docIdx = ref(0)
const documentRef = ref(props.document)
const ragSnippetHeight = ref(88)
const resizeStartY = ref<number>()
const resizeStartHeight = ref<number>()
const currentRagReference = computed(() => {
  const documentId = documentRef.value.id
  if (documentId != undefined && props.ragReferences?.[documentId] != undefined) {
    return props.ragReferences[documentId]
  }
  return props.ragReference
})

onMounted(() => {
  if (props.document.name != undefined && props.document.id != undefined) {
    slide.value = props.document.name
    docIdx.value = props.availableDocuments.findIndex((idx) => props.document.id === idx)
  }
  displayDocument(0).catch((e) => renderError(e))
})

onBeforeUnmount(() => stopResizeRagBanner())

function formatRange(start?: number | null, end?: number | null): string {
  return start != undefined && end != undefined ? `${start}-${end}` : ''
}

function startResizeRagBanner(event: PointerEvent) {
  resizeStartY.value = event.clientY
  resizeStartHeight.value = ragSnippetHeight.value
  window.addEventListener('pointermove', resizeRagBanner)
  window.addEventListener('pointerup', stopResizeRagBanner)
}

function resizeRagBanner(event: PointerEvent) {
  if (resizeStartY.value == undefined || resizeStartHeight.value == undefined) return
  const delta = event.clientY - resizeStartY.value
  ragSnippetHeight.value = Math.min(Math.max(resizeStartHeight.value + delta, 48), 320)
}

function stopResizeRagBanner() {
  resizeStartY.value = undefined
  resizeStartHeight.value = undefined
  window.removeEventListener('pointermove', resizeRagBanner)
  window.removeEventListener('pointerup', stopResizeRagBanner)
}

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
      if (scrollArea) getScrollTarget(scrollArea).scrollTo(0, 0)
    })
    .catch((e: Error) => renderError(e))
}
</script>

<style scoped lang="scss">
.content {
  display: flex;
  flex-direction: column;
  width: 750px;
  max-width: 80vw;
  height: 90vh;
  overflow: hidden;
}
.rag-reference-banner {
  background: #fff8e1;
  border-left: 4px solid var(--q-primary);
}

.rag-snippet {
  overflow: auto;
  white-space: pre-wrap;
}

.rag-banner-resize-handle {
  align-items: center;
  color: $grey-7;
  cursor: ns-resize;
  display: flex;
  justify-content: center;
  line-height: 1;
  user-select: none;
}

.rag-banner-resize-handle:hover {
  color: var(--q-primary);
}

.document-section {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.document-scroll-container {
  height: 100%;
  min-height: 0;
}

.highlighted-text {
  height: 100%;
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
