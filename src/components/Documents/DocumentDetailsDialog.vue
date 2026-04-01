<template>
  <q-dialog ref="dialogRef">
    <q-card class="content">
      <q-card-section class="row items-center">
        <div class="text-h6">
          <q-icon name="article" />
          {{ document.name }}
        </div>
        <q-space />
        <q-btn-group push spread>
          <q-btn icon="keyboard_arrow_left" no-caps @click="displayDocument" />
          <q-btn icon="keyboard_arrow_right" no-caps />
        </q-btn-group>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />
      <q-carousel
        v-model="slide"
        transition-prev="slide-right"
        transition-next="slide-left"
        control-color="black"
        infinite
        arrows
        keep-alive
        navigation
      >
        <q-carousel-slide v-for="id in availableDocuments" name="slide" :key="id" :index="id">
          <q-card-section class="scroll q-pa-none">
            <q-scroll-area class="highlighted-text">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <pre class="q-pa-sm q-ma-none" v-html="document.highlightedText" />
            </q-scroll-area>
          </q-card-section>
        </q-carousel-slide>
      </q-carousel>
      <!--      <q-card-section class="scroll q-pa-none">-->
      <!--        <q-scroll-area class="highlighted-text">-->
      <!--          &lt;!&ndash; eslint-disable-next-line vue/no-v-html &ndash;&gt;-->
      <!--          <pre class="q-pa-sm q-ma-none" v-html="document.highlightedText" />-->
      <!--        </q-scroll-area>-->
      <!--      </q-card-section>-->
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ConceptCluster, DataSource, Document } from '@onto-med/top-api'
import { useDialogPluginComponent } from 'quasar'
import { inject, ref } from 'vue'
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

const slide = ref('style')

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
      console.log(r)
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
