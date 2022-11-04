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

    <div class="row no-wrap justify-between" style="height: calc(85vh)">
      <q-card id="concept-box" class="col-2 q-mr-xs">
        <q-card-section>
          <div class="text-subtitle2">
            {{ t('concept', 2) }}
          </div>
        </q-card-section>
        <q-card-section>
          <div class="q-pa-xs-md">
            <!-- ToDo: is weird (toggle group parts are not visible) when viewport gets too small -->
            <q-btn-toggle
              v-model="conceptMode"
              toggle-color="primary"
              no-caps
              rounded
              size="sm"
              text-color="grey"
              :options="[
                {slot: 'exclusive', value: 'exclusive'},
                {slot: 'union', value: 'union'},
                {slot: 'intersection', value: 'intersection'}
              ]"
              @click="checkConceptSelectionMode()"
            >
              <template v-slot:exclusive>
                <div class="row items-center no-wrap">
                  <div> Exclusive </div>
                  <q-icon right size="xs" name="mdi-circle" />
                </div>
              </template>
              <template v-slot:union>
                <div class="row items-center no-wrap">
                  <div> Union </div>
                  <q-icon right size="sm" name="mdi-set-all" />
                </div>
              </template>
              <template v-slot:intersection>
                <div class="row items-center no-wrap">
                  <div> Intersection </div>
                  <q-icon right size="sm" name="mdi-set-center" />
                </div>
              </template>
            </q-btn-toggle>
          </div>
        </q-card-section>
        <q-card-section>
          <q-chip
            v-for="(concept, index) in concepts"
            :key="concept.id"
            class="cursor-pointer relative-position"
            :style="selectedColors[index]"
            clickable
            @click="chooseConcept(index, false)"
          >
            <div class="ellipsis">
              {{ concept.labels }}
            </div>
            <q-tooltip :delay="500" anchor="center right" self="center left" :offset="[10, 10]">
             {{ concept.labels }}
            </q-tooltip>
          </q-chip>
        </q-card-section>
      </q-card>

      <q-card id="document-box" class="col q-mr-xs">
        <q-card-section>
          <div class="text-subtitle2">
            {{ t('document', 2) }} <a v-if="documentIds.length > 0">(Results: {{ documentIds.length }})</a>
          </div>
        </q-card-section>
        <!--  TODO: need to find a better solution for style height -->
        <q-virtual-scroll
          v-slot="{ item, index }"
          style="height: 94%"
          :items="documentIds"
          separator
        >
          <q-item
            :key="index + item"
            class="cursor-pointer relative-position"
            clickable
            @click="chooseDocument(item)"
          >
            <q-item-section>
              <q-item-label
                :style="{'font-size': '18px', 'color': '#696969', 'font-weight': 'bold'}"
              >
                {{ item }}
              </q-item-label>
              <q-item-label
                caption
                lines="2"
                :style="{'font-size': '14px'}"
              >
                First line of doc or some such thing
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-virtual-scroll>
      </q-card>

      <q-card v-if="document_" id="details-box" class="col">
        <q-card-section>
          <div class="text-subtitle2">
            {{ t('details', 2) }}
          </div>
        </q-card-section>
        <q-scroll-area style="height: 94%">
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
    const conceptMode = ref('exclusive')

    let currentConceptMode = conceptMode.value
    let lastSelectedConcept = -1

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

    const chooseConcept = async (idx: number, changedConceptMode: boolean | undefined) => {
      if (!documentApi) return

      documentIds.value.length = 0
      if (changedConceptMode !== true) {
        if (conceptMode.value === 'exclusive') {
          selectedConcepts.value.length = 0
          selectedConcepts.value.push(idx)
        } else if (selectedConcepts.value.includes(idx)) {
          selectedConcepts.value = selectedConcepts.value.filter(function (item) {
            return item !== idx
          })
        } else {
          selectedConcepts.value.push(idx)
        }
        lastSelectedConcept = idx
      }

      if (selectedConcepts.value.length !== 0) {
        await documentApi.getDocumentsByConceptIds(
          selectedConcepts.value.map(selConcept => {
            return concepts.value[selConcept].id
          }), true, conceptMode.value, undefined
        )
          .then(r => {
            documentIds.value = [...new Set(r.data.map(function (doc) {
              return doc.id
            }))] //ToDo: I'm not sure if I need a set here...
          })
          .catch((e: Error) => alert(e.message))
      } else {document_.value = undefined}
      selectedColors.value.fill({'background-color': '', 'color': ''})
      selectedConcepts.value.forEach( function (_idx) {selectedColors.value[_idx] = conceptColors[_idx]})
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
      conceptMode,
      chooseConcept,
      async chooseDocument (documentId: string) {
        if (!documentApi) return
        await documentApi.getDocumentById(documentId)
          .then(r => {
            document_.value = r.data
          })
          .catch((e: Error) => alert(e.message))
      },
      async checkConceptSelectionMode() {
        if (currentConceptMode === conceptMode.value) return
        currentConceptMode = conceptMode.value
        if (selectedConcepts.value.length <= 1) return

        if (conceptMode.value === 'exclusive') {
          await chooseConcept(lastSelectedConcept, false)
          // selectedConcepts.value.length = 0;
          // documentIds.value.length = 0;
          // document_.value = undefined;
          // selectedColors.value.fill({'background-color': '', 'color': ''});
        } else {
          await chooseConcept(lastSelectedConcept, true)
        }
      },
    }
  }
})
</script>
