<template>
  <q-page class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('document', 2) }}
        </div>
      </q-card-section>
      <q-card-section>
        {{ t('documentPage.description') }}
      </q-card-section>
    </q-card>

    <div class="row no-wrap justify-between">
      <q-card class="col-2 q-mr-xs">
        <q-card-section>
          <div class="text-subtitle2">
            {{ t('concept', 2) }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-chip
            v-for="(concept, index) in concepts"
            :key="concept.id"
            class="cursor-pointer relative-position"
            :style="selectedColors[index]"
            clickable
            @click="chooseConcept(concept, index)"
          >
            <div class="ellipsis">
              {{ concept.labels }}
            </div>
          </q-chip>
        </q-card-section>
      </q-card>

      <q-card class="col q-mr-xs">
        <q-card-section>
          <div class="text-subtitle2">
            {{ t('document', 2) }}
          </div>
        </q-card-section>
        <q-scroll-area style="height: 92%">
          <q-card-section class="col fit">
            <q-chip
              v-for="(documentId, index) in documentIds"
              :key="'doc-'+index"
              class="cursor-pointer relative-position"
              clickable
              @click="chooseDocument(documentId)"
            >
              {{ documentId }}
            </q-chip>
          </q-card-section>
        </q-scroll-area>
      </q-card>

      <q-card v-if="document_" class="col">
        <q-card-section>
          <div class="text-subtitle2">
            {{ t('details', 2) }}
          </div>
        </q-card-section>
        <q-scroll-area style="height: 92%">
          <q-card-section>
            <div class="text-h6">
              {{ document_.id }}
            </div>
          </q-card-section>
          <q-card-section>
            <div>
              {{ document_.text }}
            </div>
          </q-card-section>
        </q-scroll-area>
      </q-card>
    </div>
  </q-page>
</template>

<script lang="ts">
import {computed, defineComponent, inject, onMounted, ref} from 'vue'
import {Notify, QChip} from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { DocumentApiKey, PhraseApiKey, ConceptApiKey } from 'src/boot/axios'
import {Document, Phrase, Concept} from '@onto-med/top-api';
import TableWithActions from 'components/TableWithActions.vue';

export default defineComponent({
  name: 'DocumentSearch',
  components: {
    // TableWithActions,
  },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const documentApi = inject(DocumentApiKey)
    const phraseApi = inject(PhraseApiKey)
    const conceptApi = inject(ConceptApiKey)
    const documentIds = ref<string[]>([])
    const document_ = ref<Document>()
    const concepts = ref<Concept[]>([])
    const loading = ref(false)
    const selectedConcepts = ref<number[]>([])
    const distinctColors = [
      '#556b2f', '#228b22',
      '#7f0000', '#483d8b', '#008b8b', '#cd853f',
      '#4682b4', '#000080', '#8fbc8f', '#800080',
      '#b03060', '#ff0000', '#ffa500', '#00ff00',
      '#dc143c', '#00ffff', '#0000ff', '#f08080',
      '#adff2f', '#ff00ff', '#1e90ff', '#f0e68c',
      '#ffff54', '#dda0dd', '#90ee90', '#7b68ee',
      '#00ff7f', '#ff1493', '#696969', '#d3d3d3']
    const distinctColorsFont = [
      '#ffffff', '#ffffff',
      '#ffffff', '#ffffff', '#000000', '#000000',
      '#000000', '#ffffff', '#000000', '#ffffff',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000', '#ffffff', '#000000',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000', '#ffffff', '#000000']
    const conceptColors: object[] = []; //ToDo: const? or ref?
    const selectedColors = ref<object[]>([])

    const reload = async () => {
      if (!conceptApi || !documentApi) return
      loading.value = true
      await conceptApi.getConcepts()
        .then(r => {
          concepts.value = r.data
          concepts.value.forEach(function (concept, index) {
            conceptColors.push({'background-color': distinctColors[index], 'color': distinctColorsFont[index]})
          });
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          selectedColors.value = new Array(concepts.value.length).fill({'background-color': '', 'color': ''})
        })
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      document_,
      documentIds,
      concepts,
      loading,
      reload,
      alert,
      selectedColors,
      async chooseConcept (concept: Concept, idx: number) {
        if (!documentApi) return
        await documentApi.getDocumentByConceptId(concept.id, true)
          .then(r => {
            selectedConcepts.value.length = 0 //Todo: some toggle when multiple selected concepts are desirable
            documentIds.value.length = 0

            selectedConcepts.value.push(idx)
            documentIds.value = r.data.map(function (doc) {
              return doc.id
            })

            selectedColors.value.fill({'background-color': '', 'color': ''})
            selectedConcepts.value.forEach( function (_idx) {selectedColors.value[_idx] = conceptColors[_idx]})
          })
          .catch((e: Error) => alert(e.message))
      },
      async chooseDocument (documentId: string) {
        if (!documentApi) return
        await documentApi.getDocumentById(documentId)
          .then(r => {
            document_.value = r.data
          })
          .catch((e: Error) => alert(e.message))
      },
    }
  }
})
</script>
