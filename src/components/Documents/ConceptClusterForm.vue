<template>
  <q-splitter v-model="splitterModel" :limits="[25, 75]" class="fit">
    <template #before>
      <q-card>
        <q-card-section class="row q-pl-md q-pa-none bg-grey-1">
          <div class="text-subtitle2 q-py-md">
            {{ t('concept', 2) }}
          </div>
          <q-space />
          <q-separator v-if="isAdmin" vertical />
          <q-btn v-if="isAdmin" dense flat no-caps class="q-py-none" @click="confirmRegenerate">
            <q-icon name="update" />
            <div class="q-pl-sm gt-xs">{{ t('conceptCluster.regenerate') }}</div>
          </q-btn>
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
              <div v-if="!concepts.length && !conceptsLoading" class="q-pa-md text-grey">
                <div class="q-gutter-md text-center">
                  <div>{{ t('conceptCluster.noConceptsAvailable') }}</div>
                  <q-btn icon="refresh" dense :label="t('reload')" @click="reloadConcepts" />
                </div>
              </div>
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
              {{ t('document', 2) }}
              <span v-if="selectedConcepts.length">
                ({{ t('resultCount', documents.length) }})
              </span>
            </div>
          </q-card-section>

          <q-separator />

          <q-virtual-scroll
            v-if="selectedConcepts.length"
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

          <div v-else class="row q-pa-md text-grey items-center">
            <q-icon name="arrow_back_ios" size="xl" class="col-auto" />
            <div class="col">{{ t('conceptCluster.selectConceptsDescription') }}</div>
          </div>

          <q-inner-loading :showing="documentsLoading" />
        </div>
      </div>
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentApiKey, ConceptClusterApiKey, ConceptgraphsApiKey } from 'src/boot/axios'
import { Document, ConceptCluster, PipelineResponseStatus } from '@onto-med/top-api'
import useNotify from 'src/mixins/useNotify'
import DocumentDetailsDialog from 'components/Documents/DocumentDetailsDialog.vue'
import { useQuasar } from 'quasar'
import Dialog from 'src/components/Dialog.vue'
import { useEntity } from 'src/pinia/entity'
import { storeToRefs } from 'pinia'

interface ConceptColor {
  'background-color': string,
  color: string
}

const { t } = useI18n()
const $q = useQuasar()
const { renderError, notify } = useNotify()
const documentApi = inject(DocumentApiKey)
const conceptApi = inject(ConceptClusterApiKey)
const conceptGraphsApi = inject(ConceptgraphsApiKey)
const entityStore = useEntity()
const { isAdmin } = storeToRefs(entityStore)
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
const mostImportantNodes = ref(false)
const splitterModel = ref(40)
const processId = 'top-framework'

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

onMounted(async () =>
  await entityStore.loadUser()
    .then(() => reloadConcepts())
)

watch(
  [ mostImportantNodes, conceptMode, selectedConcepts ],
  () => reloadDocuments().catch((e: Error) => renderError(e))
)

async function reloadConcepts() {
  if (!conceptApi || !documentApi || conceptsLoading.value) return
  conceptsLoading.value = true
  await checkPipeline()
    .then(() => conceptApi.getConceptClusters(undefined, false))
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

async function checkPipeline() {
  return await conceptGraphsApi?.getStoredProcesses()
    .then(r =>
      r.data
        .filter((p) => p.name === processId && p.finished_steps?.some((s) => s.name === 'graph'))
        .length > 0
    ).then(r => !r ? Promise.reject() : true)
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

function confirmRegenerate() {
  if (!isAdmin.value) return
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmRegenerate')
    }
  }).onOk(() => {
    conceptGraphsApi?.startConceptGraphPipelineWithoutUpload(processId)
      .then(r => {
        if (r.data.status == PipelineResponseStatus.Successful) {
          concepts.value = []
          selectedColors.value = []
          notify(t('conceptCluster.pipelineStarted'), 'positive')
        } else {
          notify(r.data.response || t('conceptCluster.pipelineFailed'), 'negative')
        }
      })
      .catch((e: Error) => renderError(e))
  })
}
</script>

<style lang="sass">
.document-item
  font-size: 18px
  color: #696969
  font-weight: bold
</style>
