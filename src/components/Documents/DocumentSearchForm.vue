<template>
  <q-splitter v-model="splitterModel" :limits="[25, 75]">
    <template #before>
      <q-card>
        <q-card-section class="row q-pl-md q-pa-none bg-grey-1">
          <div class="text-subtitle2 q-py-md">
            {{ t('concept', 2) }}
          </div>
          <q-space />
          <q-separator v-if="isAdmin" vertical />
          <q-btn v-if="isAdmin" :disable="!dataSource" flat no-caps class="q-py-none" @click="showRegenerateDialog">
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
                  <q-btn
                    icon="refresh"
                    dense
                    :disable="!dataSource"
                    :label="t('reload')"
                    @click="reloadConcepts().catch((e: Error) => renderError(e))"
                  />
                </div>
              </div>
            </div>
          </q-scroll-area>
        </q-card-section>
        <q-inner-loading :showing="conceptsLoading" />
      </q-card>
    </template>

    <template #after>
      <q-card-section class="bg-grey-1">
        <div class="text-subtitle2">
          {{ t('document', 2) }}
        </div>
      </q-card-section>

      <q-separator />

      <table-with-actions
        flat
        wrap-cells
        :disable="!dataSource"
        :grid="$q.screen.xs"
        :name="t('document')"
        :page="documents"
        :loading="documentsLoading"
        :columns="cols"
        :create="false"
        :filterable="!query"
        @request="reloadDocuments($event).catch((e: Error) => renderError(e))"
        @row-clicked="chooseDocument($event)"
      >
        <template v-if="query" #title>
          <div v-show="$q.screen.gt.xs" class="text-h6">{{ t('documentsOfQuery') }}: {{ query.name }}</div>
        </template>
        <template v-if="query" #action-buttons>
          <q-btn
            icon="clear"
            :label="t('clear')"
            :title="t('clearDocumentQueryResult')"
            @click="$emit('update:query', undefined)"
          />
        </template>
        <template #row-cells="rowCellProps">
          <q-td :title="rowCellProps.row.id">
            {{ rowCellProps.row.name }}
          </q-td>
          <q-td>
            {{ rowCellProps.row.text }}
          </q-td>
        </template>
      </table-with-actions>

      <q-inner-loading :showing="documentsLoading" />
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentApiKey, ConceptClusterApiKey, ConceptgraphsApiKey } from 'src/boot/axios'
import {
  Document,
  ConceptCluster,
  PipelineResponseStatus,
  DocumentGatheringMode,
  DataSource,
  Query,
  DocumentPage
} from '@onto-med/top-api'
import useNotify from 'src/mixins/useNotify'
import TableWithActions from 'components/TableWithActions.vue'
import DocumentDetailsDialog from 'components/Documents/DocumentDetailsDialog.vue'
import { QTableProps, useQuasar } from 'quasar'
import { useEntity } from 'src/pinia/entity'
import { storeToRefs } from 'pinia'
import ConceptClusterDialog from './ConceptClusterDialog.vue'

interface ConceptColor {
  'background-color': string
  color: string
}

const props = defineProps<{
  dataSource?: DataSource
  query?: Query
}>()

defineEmits(['update:query'])

const { t } = useI18n()
const $q = useQuasar()
const { renderError, notify } = useNotify()
const documentApi = inject(DocumentApiKey)
const conceptApi = inject(ConceptClusterApiKey)
const conceptGraphsApi = inject(ConceptgraphsApiKey)
const entityStore = useEntity()
const { isAdmin } = storeToRefs(entityStore)
const documents = ref<DocumentPage>()
const document_ = ref<Document>()
const concepts = ref<ConceptCluster[]>([])
const conceptsLoading = ref(false)
const documentsLoading = ref(false)
const selectedConcepts = ref<number[]>([])
const distinctColors = [
  '#556b2f',
  '#228b22',
  '#7f0000',
  '#483d8b',
  '#008b8b',
  '#cd853f',
  '#4682b4',
  '#000080',
  '#8fbc8f',
  '#800080',
  '#b03060',
  '#ff0000',
  '#ffa500',
  '#00ff00',
  '#dc143c',
  '#00ffff',
  '#0000ff',
  '#f08080',
  '#adff2f',
  '#ff00ff',
  '#1e90ff',
  '#f0e68c',
  '#ffff54',
  '#dda0dd',
  '#90ee90',
  '#7b68ee',
  '#00ff7f',
  '#ff1493',
  '#696969',
  '#d3d3d3'
]
const distinctColorsFont = [
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#000000',
  '#000000',
  '#000000',
  '#ffffff',
  '#000000',
  '#ffffff',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#ffffff',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#000000',
  '#ffffff',
  '#000000'
]
const conceptColors: ConceptColor[] = []
const selectedColors = ref<ConceptColor[]>([])
const conceptMode = ref(DocumentGatheringMode.Exclusive)
const mostImportantNodes = ref(false)
const splitterModel = ref(40)
const processId = 'top-framework'

const cols = computed(
  () =>
    [
      { name: 'actions' },
      { name: 'name', field: 'name', label: t('name'), align: 'left' },
      { name: 'text', field: 'text', label: t('content'), align: 'left' }
    ] as QTableProps['columns']
)

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

onMounted(() =>
  entityStore
    .loadUser()
    .then(() => reloadConcepts())
    .then(() => reloadDocuments())
    .catch((e: Error) => renderError(e))
)

watch([mostImportantNodes, conceptMode, selectedConcepts], () => reloadDocuments().catch((e: Error) => renderError(e)))
watch(
  () => props.dataSource,
  () =>
    reloadConcepts()
      .then(() => reloadDocuments())
      .catch((e: Error) => renderError(e))
)

async function reloadConcepts() {
  if (!props.dataSource) concepts.value = []
  if (!props.dataSource || !conceptApi || !documentApi || conceptsLoading.value) return Promise.reject()
  conceptsLoading.value = true
  return await checkPipeline()
    .then(() => conceptApi.getConceptClusters(undefined, undefined, false))
    .then((r) => {
      concepts.value = r.data.content
      concepts.value.forEach((_, index) => {
        conceptColors.push({
          'background-color': distinctColors[index],
          color: distinctColorsFont[index]
        })
      })
      selectedColors.value = new Array(concepts.value.length).fill({
        'background-color': '',
        color: ''
      }) as ConceptColor[]
    })
    .finally(() => (conceptsLoading.value = false))
}

async function reloadDocuments(name?: string, page?: number) {
  if (!props.dataSource) documents.value = undefined
  if (!props.dataSource || !documentApi || documentsLoading.value || !props.dataSource) return Promise.reject()
  documents.value = undefined
  document_.value = undefined
  const conceptClusterIds = selectedConcepts.value.map((c) => concepts.value[c]?.id).filter((id) => !!id)
  documentsLoading.value = true
  return await documentApi
    .getDocuments(
      props.dataSource.id,
      name,
      undefined,
      undefined,
      conceptClusterIds,
      undefined,
      conceptMode.value,
      mostImportantNodes.value,
      page
    )
    .then((r) => (documents.value = r.data))
    .finally(() => (documentsLoading.value = false))
}

function setConceptMode(newMode = DocumentGatheringMode.Exclusive) {
  if (newMode === conceptMode.value) return
  conceptMode.value = newMode
  if (selectedConcepts.value.length > 1 && newMode === DocumentGatheringMode.Exclusive) prepareSelectedConcepts()
}

function prepareSelectedConcepts() {
  if (conceptMode.value === DocumentGatheringMode.Exclusive) {
    selectedConcepts.value = [selectedConcepts.value.at(-1) as number]
  }
  selectedColors.value.fill({
    'background-color': '',
    color: ''
  })
  selectedConcepts.value.forEach((idx) => (selectedColors.value[idx] = conceptColors[idx]))
}

async function checkPipeline() {
  if (!props.dataSource) return Promise.reject()
  return await conceptGraphsApi
    ?.getStoredProcesses()
    .then(
      (r) => r.data.filter((p) => p.name === processId && p.finished_steps?.some((s) => s.name === 'graph')).length > 0
    )
    .then((r) => (!r ? Promise.reject() : true))
}

async function chooseDocument(documentId: string) {
  if (!props.dataSource) return Promise.reject()
  await documentApi
    ?.getSingleDocumentById(documentId, props.dataSource.id)
    .then((r) => {
      $q.dialog({
        component: DocumentDetailsDialog,
        componentProps: {
          document: r.data
        }
      })
    })
    .catch((e: Error) => renderError(e))
}

function showRegenerateDialog() {
  if (!isAdmin.value || !props.dataSource) return
  $q.dialog({
    component: ConceptClusterDialog,
    componentProps: {
      dataSource: props.dataSource
    }
  }).onOk(() => {
    conceptGraphsApi
      ?.startConceptGraphPipelineWithoutUpload(processId)
      .then((r) => {
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