<template>
  <q-splitter v-model="splitterModel" :limits="[25, 75]" class="fit">
    <template #before>
      <q-card>
        <q-card-section class="bg-grey-1">
          <div class="text-subtitle2">
            {{ t('concept', 2) }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-select
            :model-value="conceptMode"
            :options="conceptModeOptions"
            :label="t('selectionMode')"
            :readonly="loading"
            dense
            emit-value
            map-options
            @update:model-value="setConceptMode($event)"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon :name="scope.opt.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ scope.opt.label }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ scope.opt.description }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-select
            v-model="mostImportantNodes"
            :options="mostImportantNodesOptions"
            :label="t('importantNodesOnly')"
            :readonly="loading"
            dense
            emit-value
            map-options
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <q-scroll-area style="height: 60vh">
            <div class="column">
              <q-checkbox
                v-for="(concept, index) in concepts"
                :key="concept.id"
                v-model="selectedConcepts"
                :style="selectedColors[index]"
                :val="index"
                :label="concept.labels"
                :title="concept.labels"
                :disable="loading"
                class="ellipsis"
                dense
                @update:model-value="prepareSelectedConcepts()"
              />
            </div>
          </q-scroll-area>
        </q-card-section>
        <q-inner-loading :showing="conceptsLoading" />
      </q-card>
    </template>

    <template #after>
      <div class="row">
        <div class="col">
          <q-card-section class="bg-grey-1">
            <div class="text-subtitle2">
              {{ t('document', 2) }} <a v-if="documents.length > 0">
                ({{ t('resultCount', documents.length) }})
              </a>
            </div>
          </q-card-section>

          <q-separator />

          <q-virtual-scroll
            v-slot="{ item }"
            style="height: 72vh"
            :items="documents"
            separator
          >
            <q-item
              :key="item.id"
              class="cursor-pointer relative-position"
              clickable
              @click="chooseDocument(item.id)"
            >
              <q-item-section>
                <q-item-label class="document-item">
                  {{ item.name || item.id }}
                </q-item-label>
                <q-item-label caption lines="2">
                  {{ item.text }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-virtual-scroll>
          <q-inner-loading :showing="documentsLoading" />
        </div>
      </div>
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentApiKey, ConceptClusterApiKey } from 'src/boot/axios'
import { Document, ConceptCluster } from '@onto-med/top-api'
import useNotify from 'src/mixins/useNotify'
import DocumentDetailsDialog from 'components/Documents/DocumentDetailsDialog.vue'
import { useQuasar } from 'quasar'

interface ConceptColor {
  'background-color': string,
  color: string
}

const { t } = useI18n()
const $q = useQuasar()
const { renderError } = useNotify()
const documentApi = inject(DocumentApiKey)
const conceptApi = inject(ConceptClusterApiKey)
const documents = ref<Document[]>([])
const document_ = ref<Document>()
const concepts = ref<ConceptCluster[]>([])
const conceptsLoading = ref(false)
const documentsLoading = ref(false)
const selectedConcepts = ref<number[]>([])
const distinctColors = [
  '#556b2f', '#228b22',
  '#7f0000', '#483d8b', '#008b8b', '#cd853f',
  '#4682b4', '#000080', '#8fbc8f', '#800080',
  '#b03060', '#ff0000', '#ffa500', '#00ff00',
  '#dc143c', '#00ffff', '#0000ff', '#f08080',
  '#adff2f', '#ff00ff', '#1e90ff', '#f0e68c',
  '#ffff54', '#dda0dd', '#90ee90', '#7b68ee',
  '#00ff7f', '#ff1493', '#696969', '#d3d3d3'
]
const distinctColorsFont = [
  '#ffffff', '#ffffff',
  '#ffffff', '#ffffff', '#000000', '#000000',
  '#000000', '#ffffff', '#000000', '#ffffff',
  '#000000', '#000000', '#000000', '#000000',
  '#000000', '#000000', '#ffffff', '#000000',
  '#000000', '#000000', '#000000', '#000000',
  '#000000', '#000000', '#000000', '#000000',
  '#000000', '#000000', '#ffffff', '#000000'
]
const conceptColors: ConceptColor[] = []
const selectedColors = ref<ConceptColor[]>([])
const conceptMode = ref('exclusive')
const mostImportantNodes = ref(true)
const splitterModel = ref(40)

const conceptModeOptions = computed(() => [
  {
    label: t('exclusive'),
    value: 'exclusive',
    icon: 'mdi-circle'
  },
  {
    label: t('union'),
    value: 'union',
    icon: 'mdi-set-all'
  },
  {
    label: t('intersection'),
    value: 'intersection',
    icon: 'mdi-set-center'
  }
])

const mostImportantNodesOptions = computed(() => [
  { label: t('yes'), value: true },
  { label: t('no'), value: false }
])

const loading = computed(() => conceptsLoading.value || documentsLoading.value)

onMounted(async () => await reloadConcepts())

watch(
  [ mostImportantNodes, conceptMode, selectedConcepts ],
  () => reloadDocuments().catch((e: Error) => renderError(e))
)

async function reloadConcepts() {
  if (!conceptApi || !documentApi || conceptsLoading.value) return
  conceptsLoading.value = true
  await conceptApi.getConceptClusters()
    .then(r => {
      concepts.value = r.data
      concepts.value.forEach((_, index) => {
        conceptColors.push({
          'background-color': distinctColors[index],
          'color': distinctColorsFont[index]
        })
      })
      selectedColors.value = new Array(concepts.value.length)
        .fill({ 'background-color': '', 'color': '' }) as ConceptColor[]
    })
    .catch((e: Error) => renderError(e))
    .finally(() => conceptsLoading.value = false)
}

async function reloadDocuments() {
  if (!documentApi || documentsLoading.value) return
  documents.value = []
  document_.value = undefined
  const conceptClusterIds = selectedConcepts.value.map(c => concepts.value[c]?.id).filter(id => !!id)
  if (conceptClusterIds.length > 0) {
    documentsLoading.value = true
    await documentApi.getDocumentIdsByConceptClusterIds(
      conceptClusterIds,
      conceptMode.value,
      undefined,
      mostImportantNodes.value
    )
      .then(r => documents.value = r.data)
      .catch((e: Error) => renderError(e))
      .finally(() => documentsLoading.value = false)
  }
}

function setConceptMode(newMode = 'exclusive') {
  if (newMode === conceptMode.value) return
  conceptMode.value = newMode
  if (selectedConcepts.value.length > 1 && newMode === 'exclusive')
    prepareSelectedConcepts()
}

function prepareSelectedConcepts() {
  if (conceptMode.value === 'exclusive') {
    selectedConcepts.value = [selectedConcepts.value.at(-1) as number]
  }
  selectedColors.value.fill({
    'background-color': '',
    'color': ''
  })
  selectedConcepts.value.forEach(idx => selectedColors.value[idx] = conceptColors[idx])
}

async function chooseDocument(documentId: string) {
  await documentApi?.getDocumentById(
    documentId,
    selectedConcepts.value.map(idx => concepts.value[idx].id)
  )
    .then(r => {
      $q.dialog({
        component: DocumentDetailsDialog,
        componentProps: {
          document: r.data
        }
      })
    })
    .catch((e: Error) => renderError(e))
}
</script>

<style lang="sass">
.document-item
  font-size: 18px
  color: #696969
  font-weight: bold
</style>