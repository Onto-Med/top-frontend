<template>
  <q-dialog ref="dialogRef">
    <q-card class="content" style="min-width: 600px; max-width: min-content">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6">
          <q-icon name="smart_toy" />
          {{ t('documentsForRAG', { numberOfDocs: props.documents?.length }) }}
        </div>
        <q-space />
        <q-btn icon="close" v-close-popup flat round dense @click="dismissedRag=true" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input
          v-model="ragQuestion"
          outlined
          autofocus
          :label="t('question')"
          @keyup.enter="poseQuestion()"
        >
          <template #after>
            <q-btn
              v-if="!startedQuestioning"
              round
              dense
              flat
              icon="send"
              color="primary"
              :disable="!ragApi || startedQuestioning"
              :title="t('startThing', { thing: t('questioning') })"
              @click="poseQuestion()"
            />
            <q-spinner v-if="startedQuestioning" size="xs" class="q-ml-sm" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section>
        {{ ragAnswer }}
      </q-card-section>

      <q-card-section v-if="ragAdditionalInfoArr != undefined && ragAdditionalInfoArr.length > 0">
        <q-table
          :columns="[
            { name: 'ref', label: '#', field: 'ref', align: 'left' },
            { name: 'name', label: documentNameStr, field: 'name', align: 'left' },
            { name: 'id', label: documentIdStr, field: 'id', align: 'left' },
          ]"
          :rows="ragAdditionalInfoArr"
          @row-click="showDocument"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { computed, inject, onBeforeUnmount, onMounted, PropType, ref } from 'vue'
import { RagApiKey, DocumentApiKey } from 'boot/axios'
import useNotify from 'src/mixins/useNotify'
import { ConceptCluster, DataSource, RAGAnswer, RAGFilter } from '@onto-med/top-api'
import DocumentDetailsDialog from 'components/Documents/DocumentDetailsDialog.vue'

const ragApi = inject(RagApiKey)
const documentApi = inject(DocumentApiKey)
const { t } = useI18n()
const $q = useQuasar()
const { dialogRef, onDialogOK } = useDialogPluginComponent()

const props = defineProps({
  documents: Array<string>,
  process: String,
  previousResult: Object as PropType<RAGAnswer>,
  previousQuestion: String
})

const { renderError } = useNotify()
const dismissedRag = ref<boolean>(false)
const ragQuestion = ref<string>()
const ragAnswer = ref<string>()
const ragAdditionalInfo = ref<string>()
const ragAdditionalInfoArr = ref<DocumentReference[]>()
const startedQuestioning = ref<boolean>(false)
const documentNameStr = computed(() => t('document') + " " + t('name'))
const documentIdStr = computed(() => t('document') + " Id")

onMounted(() => {
  ragQuestion.value = props.previousQuestion
  if (props.previousResult === undefined) return
  parseRagAnswer(props.previousResult)
})

onBeforeUnmount(() => {
  if (!dismissedRag.value) {
    onDialogOK({
      answer: { answer: ragAnswer.value, info: ragAdditionalInfo.value } as RAGAnswer,
      question: ragQuestion.value
    })
  } else { onDialogOK(undefined) }
})

async function poseQuestion() {
  if (startedQuestioning.value) return
  startedQuestioning.value = true

  if (!ragApi || !props.process) return
  if (ragQuestion.value === undefined) return
  if (
    props.documents === undefined ||
    (props.documents != undefined && props.documents.length == 0)
  ) {
    await ragApi
      .poseQuestionToRAG(props.process, ragQuestion.value)
      .then((r) => parseRagAnswer(r.data))
      .catch((e) => renderError(e))
      .finally(() => wrapUpQuestioning())
  } else {
    const filter = {
      docIds: props.documents,
    } as RAGFilter
    await ragApi
      .poseQuestionToRAGWithFilter(props.process, ragQuestion.value, filter)
      .then((r) => parseRagAnswer(r.data))
      .catch((e) => renderError(e))
      .finally(() => wrapUpQuestioning())
  }
}

async function showDocument(evt: Event, row: DocumentReference) {
  if (props.process === undefined) return
  await documentApi
    ?.getSingleDocumentById(row.id, props.process, [], [])
    .then((r) => {
      $q.dialog({
        component: DocumentDetailsDialog,
        componentProps: {
          document: r.data,
          availableDocuments: ragResultDocumentIds(row),
          documentQueryOffsets: undefined,
          dataSource: { id: props.process } as DataSource,
          selectedConcepts: [],
          conceptColors: [],
          concepts: [] as ConceptCluster[],
          ragReference: toRagReference(row),
          ragReferences: ragReferencesByDocument(row),
        },
      })
    })
    .catch((e: Error) => renderError(e))
}

function parseRagAnswer(r: RAGAnswer) {
  ragAnswer.value = r.answer
  ragAdditionalInfo.value = r.info
  const arr: DocumentReference[] = []
  if (r.info != undefined) {
    Object.entries(JSON.parse(r.info)).forEach((entry) => {
      const result = entry[1] as DocumentResult
      arr.push({
        name: result.doc_name,
        id: result.doc_id,
        ref: entry[0],
        chunkStart: result.chunk_start,
        chunkEnd: result.chunk_end,
        documentHighlightStart: result.document_highlight_start,
        documentHighlightEnd: result.document_highlight_end,
        retrievedSnippet: result.retrieved_snippet,
        highlight: result.highlight,
      })
    })
  }
  ragAdditionalInfoArr.value = arr
}

function toRagReference(row: DocumentReference): RagReference {
  return {
    ref: row.ref,
    chunkStart: row.chunkStart,
    chunkEnd: row.chunkEnd,
    documentHighlightStart: row.documentHighlightStart,
    documentHighlightEnd: row.documentHighlightEnd,
    retrievedSnippet: row.retrievedSnippet,
    highlight: row.highlight,
  }
}

function ragReferencesByDocument(preferredRow: DocumentReference): Record<string, RagReference> {
  const references: Record<string, RagReference> = {
    [preferredRow.id]: toRagReference(preferredRow),
  }
  selectableRagReferences(preferredRow).forEach((reference) => {
    if (references[reference.id] === undefined) references[reference.id] = toRagReference(reference)
  })
  return references
}

function ragResultDocumentIds(preferredRow: DocumentReference): string[] {
  const ids = selectableRagReferences(preferredRow).map((reference) => reference.id)
  return [...new Set(ids)]
}

function selectableRagReferences(preferredRow: DocumentReference): DocumentReference[] {
  const references = ragAdditionalInfoArr.value ?? []
  const citedRefs = citedRagRefs()
  let selectedReferences = citedRefs.size > 0
    ? references.filter((reference) => citedRefs.has(reference.ref))
    : references.filter((reference) => hasRagHighlight(reference))

  if (selectedReferences.length === 0) selectedReferences = references
  if (!selectedReferences.some((reference) => reference.id === preferredRow.id)) {
    selectedReferences = [preferredRow, ...selectedReferences]
  }
  return selectedReferences
}

function citedRagRefs(): Set<string> {
  const matches = ragAnswer.value?.matchAll(/\[(\d+)]/g) ?? []
  return new Set([...matches].map((match) => `[${match[1]}]`))
}

function hasRagHighlight(reference: DocumentReference): boolean {
  return Boolean(
    reference.highlight ||
      (reference.documentHighlightStart != undefined && reference.documentHighlightEnd != undefined),
  )
}

function wrapUpQuestioning() {
  startedQuestioning.value = false
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

interface DocumentReference {
  name: string
  id: string
  ref: string
  chunkStart?: number | null
  chunkEnd?: number | null
  documentHighlightStart?: number | null
  documentHighlightEnd?: number | null
  retrievedSnippet?: string
  highlight?: string
}

interface DocumentResult {
  doc_id: string
  doc_name: string
  chunk_start?: number | null
  chunk_end?: number | null
  document_highlight_start?: number | null
  document_highlight_end?: number | null
  retrieved_snippet?: string
  highlight?: string
}
</script>
<style scoped lang="scss"></style>
