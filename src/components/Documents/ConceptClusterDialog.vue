<template>
  <q-dialog ref="dialogRef">
    <q-card class="content">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="col text-h6">
          {{ t('pipelineManagementOfDataSource', { dataSource: dataSource.title || dataSource.id }) }}
        </div>
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-stepper ref="stepper" v-model="step" active-icon="none" animated>
          <q-step :name="1" :title="t('preProcessing')" :done="step > 1" icon="model_training">
            <p>
              <small>{{ t('conceptCluster.preProcessingDescription') }}</small>
            </p>
            <p class="text-subtitle1">
              <b>{{ t('status') }}:</b> {{ graphPipelineStatus }}
              <q-spinner v-if="graphPipelineInterval" size="xs" class="q-ml-sm" />
            </p>
            <q-btn-group>
              <q-btn
                :label="t('startThing', { thing: t('pipeline') })"
                icon="play_arrow"
                color="secondary"
                no-caps
                @click="confirmStartPipeline()"
              />
              <q-btn
                :label="t('deleteThing', { thing: t('pipeline') })"
                :disable="!graphPipeline"
                icon="delete"
                color="red"
                no-caps
                @click="confirmDeletePipeline()"
              />
            </q-btn-group>
          </q-step>
          <q-step :name="2" :title="t('clusterReview')" icon="rule">
            <p>{{ t('conceptCluster.reviewDescription') }}</p>
            <p class="text-subtitle1">
              <b>{{ t('status') }}:</b> {{ clusterPipelineStatus }}
            </p>
            <q-btn
              no-caps
              :label="t('publishThing', { thing: t('concept_cluster', 2) })"
              color="secondary"
              class="q-mb-sm"
              @click="confirmPublishClusters()"
            />
            <q-table
              v-model:selected="selectedGraphs"
              flat
              :rows="conceptGraphs"
              :columns="graphColumns"
              :selected-rows-label="getSelectedRowsString"
              row-key="id"
              selection="multiple"
            />
          </q-step>
          <template #navigation>
            <q-separator />
            <q-stepper-navigation class="q-mt-md">
              <q-btn
                v-if="step === 1"
                :disable="!isGraphPipelineFinished"
                :label="t('continue')"
                color="primary"
                @click="conceptGraphStep"
              />
              <q-btn v-if="step === 2" v-close-popup="1" :label="t('finish')" color="primary" />
              <q-btn
                v-if="step > 1"
                flat
                :label="t('back')"
                color="primary"
                class="q-ml-sm"
                @click="stepper?.previous()"
              />
            </q-stepper-navigation>
          </template>
        </q-stepper>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  ConceptCluster,
  ConceptGraphNodes,
  ConceptGraphPipeline,
  DataSource,
  PipelineResponse,
  PipelineResponseStatus
} from '@onto-med/top-api'
import { QStepper, QTableProps, useDialogPluginComponent, useQuasar } from 'quasar'
import { ConceptClusterApiKey, ConceptPipelineApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from '../Dialog.vue'

const props = defineProps({
  dataSource: {
    type: Object as () => DataSource,
    required: true
  },
  conceptCluster: Array as () => ConceptCluster[]
})

const emit = defineEmits(['clusterReload'])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const { dialogRef } = useDialogPluginComponent()
const { renderError } = useNotify()
const $q = useQuasar()
const conceptPipelineApi = inject(ConceptPipelineApiKey)
const conceptClusterApi = inject(ConceptClusterApiKey)
const stepper = ref<QStepper>()
const step = ref(1)
const graphPipeline = ref<ConceptGraphPipeline>()
const clusterPipeline = ref<PipelineResponse>()
const conceptGraphs = ref<ConceptGraphObject[]>([])
const selectedGraphs = ref<ConceptGraphObject[]>([])
const graphPipelineInterval = ref<number>()

const isGraphPipelineFinished = computed(() => graphPipeline.value?.status === PipelineResponseStatus.Successful)
// const isClusterPipelineFinished = computed(() => clusterPipeline.value?.status === PipelineResponseStatus.Successful)

const graphPipelineStatus = computed(() => {
  if (!graphPipeline.value || !graphPipeline.value.status) return t('unavailable')
  return te(graphPipeline.value.status) ? t(graphPipeline.value.status) : graphPipeline.value.status
})
const clusterPipelineStatus = computed(() => {
  if (!clusterPipeline.value || !clusterPipeline.value.status) return t('unavailable')
  return te(clusterPipeline.value.status) ? t(clusterPipeline.value.status) : clusterPipeline.value.status
})

const graphColumns = computed(
  () =>
    [
      { name: 'id', field: 'id', required: true, label: t('id'), align: 'left', sortable: true },
      { name: 'nodes', field: 'nodes', label: t('node', 2), align: 'left', sortable: true },
      { name: 'edges', field: 'edges', label: t('edge', 2), align: 'left', sortable: true },
      { name: 'phrases', field: 'phrases', label: t('phrase', 2), align: 'left', sortable: false }
    ] as QTableProps['columns']
)

onMounted(() => {
  loadPipeline()
    .then(() => {
      if (!graphPipeline.value) graphPipelineInterval.value = window.setInterval(() => loadPipeline, 5000)
    })
    .catch((e: Error) => renderError(e))
})

onUnmounted(() => window.clearInterval(graphPipelineInterval.value))

async function loadPipeline() {
  return conceptPipelineApi
    ?.getConceptGraphPipelineById(props.dataSource.id)
    .then((r) => {
      graphPipeline.value = r.data
      if (
        graphPipeline.value?.status == PipelineResponseStatus.Successful ||
        graphPipeline.value?.status == PipelineResponseStatus.Failed
      )
        window.clearInterval(graphPipelineInterval.value)
    })
    .then(() => window.clearInterval(graphPipelineInterval.value))
}

function confirmStartPipeline() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmStart')
    }
  }).onOk(() => {
    deletePipeline()
      .then(() => startPipeline())
      .catch((e: Error) => renderError(e))
  })
}

function confirmDeletePipeline() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmDelete')
    }
  }).onOk(() => {
    deletePipeline().catch((e: Error) => renderError(e))
  })
}

function confirmPublishClusters() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmPublish')
    }
  }).onOk(() => {
    conceptClusterApi
      ?.deleteConceptClustersForPipelineId(props.dataSource.id)
      .then(() =>
        conceptClusterApi
          ?.createConceptClustersForPipelineId(
            props.dataSource.id,
            selectedGraphs.value.map((c) => c.id)
          )
          .then((r) => {
            clusterPipeline.value = r.data
            //ToDo: don't really know where the emit needs to be caught; basically I want to 'reloadConcepts()' in 'DocumentSearchForm' when new clusters are published
            emit('clusterReload')
          })
          .catch((e: Error) => renderError(e))
      )
      .catch((e: Error) => renderError(e))
  })
}

async function startPipeline() {
  return conceptPipelineApi
    ?.startConceptGraphPipeline(props.dataSource.id, props.dataSource.id)
    .then(() => (graphPipelineInterval.value = window.setInterval(() => loadPipeline, 5000)))
}

async function deletePipeline() {
  window.clearInterval(graphPipelineInterval.value)
  return conceptPipelineApi?.deleteConceptPipelineById(props.dataSource.id)
}

function getSelectedRowsString() {
  return t('recordSelected', selectedGraphs.value.length)
}

function conceptGraphStep() {
  //ToDo: if there is a way to close the Dialog programmatically, one can do it here and avoid the definition of the two buttons for the stepper navigation
  if (step.value === 1) loadConceptGraphs()
  stepper?.value?.next()
}

function loadConceptGraphs() {
  conceptGraphs.value.length = 0
  conceptPipelineApi
    ?.getConceptGraphStatistics(props.dataSource.id)
    .then(async (r) => {
      for (const id in r.data) {
        let labels = await conceptPipelineApi
          .getConceptGraph(props.dataSource.id, id)
          .then((r) => {
            if (!r.data.nodes) return []
            return r.data.nodes
              .toSorted((a: ConceptGraphNodes, b: ConceptGraphNodes) => {
                if (a.documents === undefined) return 1
                if (b.documents === undefined) return -1
                return b.documents.length - a.documents.length
              })
              .slice(0, 3)
              .map((n) => n.label)
              .filter((l): l is string => !!l)
          })
          .catch((e: Error) => {
            renderError(e)
            return []
          })
        console.log(labels)
        let graph = {
          id: id,
          nodes: r.data[id].nodes,
          edges: r.data[id].edges,
          phrases: labels.join(' | ')
        } as ConceptGraphObject
        conceptGraphs.value.push(graph)
        //ToDo: what I want is, to pre-select the Graphs for which a concept cluster is already published
        // if (selectedGraphs.value.length === 0 && props.conceptCluster?.some((c) => c.id === id)) {
        //   selectedGraphs.value.push(graph)
        // }
      }
    })
    .then(() => {
      conceptClusterApi
        ?.getConceptClusterProcess(props.dataSource?.id)
        .then((r) => {
          clusterPipeline.value = r.data
        })
        .catch((e: Error) => renderError(e))
    })
    .catch((e: Error) => renderError(e))
}

interface ConceptGraphObject {
  id: string
  nodes: number
  edges: number
  phrases: string
}
</script>
