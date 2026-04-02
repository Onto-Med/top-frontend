<template>
  <q-dialog ref="dialogRef">
    <q-card class="content">
      <q-card-section class="row items-center">
        <div class="text-h6">
          <q-icon name="article" />
          {{ slide }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />
      <q-card-section>
        <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          control-color="black"
          infinite
          arrows
          keep-alive
        >
          <q-carousel-slide
            :name="slide"
          >
            <div class="scroll q-pa-none">
              <q-scroll-area class="highlighted-text">
                <pre class="q-pa-sm q-ma-none" v-html="documentRef?.highlightedText" />
              </q-scroll-area>
            </div>
          </q-carousel-slide>
          <!--          <q-carousel-slide-->
          <!--            v-for="id in availableDocuments"-->
          <!--            name="slide"-->
          <!--            class="column no-wrap flex-center"-->
          <!--            :key="id"-->
          <!--            :index="id"-->
          <!--          >-->
          <!--            {{ "text" }}-->
          <!--          </q-carousel-slide>-->
        </q-carousel>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ConceptCluster, DataSource, Document } from '@onto-med/top-api'
import { useDialogPluginComponent } from 'quasar'
import { inject, onMounted, ref } from 'vue'
import { DocumentApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'

const { renderError } = useNotify()
const documentApi = inject(DocumentApiKey)

interface ConceptColor {
  'background-color'?: string
  color?: string
}

const props = defineProps<{
  document: Document
  availableDocuments: Array<string>
  documentQueryOffsets?: string[] | undefined
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
  displayDocument().catch((e) => renderError(e))
})

async function displayDocument() {
  let documentId = props.document.id
  if (documentId === undefined) {
    if (props.availableDocuments.length == 0) return Promise.reject()
    documentId = props.availableDocuments[0]
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
  await documentApi
    ?.getSingleDocumentById(
      documentId!,
      props.dataSource.id,
      conceptIds,
      props.documentQueryOffsets,
    )
    .then((r) => {
      documentRef.value = r.data
    })
    .catch((e: Error) => renderError(e))
}
</script>

<style scoped lang="scss">
.content {
  width: 750px;
  max-width: 80vw;
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
