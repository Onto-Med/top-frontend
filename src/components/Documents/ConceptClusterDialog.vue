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
              <b>{{ t('status') }}:</b> {{ pipelineStatus }}
              <q-spinner v-if="interval" size="xs" class="q-ml-sm" />
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
                :disable="!pipeline"
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
              <b>{{ t('status') }}:</b> {{ (clusterPipelineStatus === undefined || clusterPipelineStatus === PipelineResponseStatus.Failed)? t('unavailable') : t(clusterPipelineStatus) }}
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
                :disable="!isPipelineFinished"
                :label="t('continue')"
                color="primary"
                @click="conceptGraphStep"
              />
              <q-btn
                v-if="step === 2"
                v-close-popup="1"
                :label="t('finish')"
                color="primary"
              />
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
  ConceptGraphPipeline,
  DataSource,
  PipelineResponse,
  PipelineResponseStatus
} from '@onto-med/top-api'
import {QStepper, QTableProps, useDialogPluginComponent, useQuasar} from 'quasar'
import {ConceptClusterApiKey, ConceptPipelineApiKey} from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import {computed, inject, onMounted, onUnmounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import Dialog from '../Dialog.vue'

const props = defineProps({
  dataSource: {
    type: Object as () => DataSource,
    required: true
  },
  conceptCluster: Array as () => ConceptCluster[]
})

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const { dialogRef } = useDialogPluginComponent()
const { renderError } = useNotify()
const $q = useQuasar()
const conceptPipelineApi = inject(ConceptPipelineApiKey)
const conceptClusterApi = inject(ConceptClusterApiKey)
const stepper = ref<QStepper>()
const step = ref(1)
const pipeline = ref<ConceptGraphPipeline>()
const conceptGraphs = ref<ConceptGraphObject[]>([])
const selectedGraphs = ref<ConceptGraphObject[]>([])
const interval = ref<number>()
const clusterPipeline = ref<PipelineResponse>()
const clusterPipelineStatus = ref<PipelineResponseStatus>()

const isPipelineFinished = computed(() => pipeline.value?.status === PipelineResponseStatus.Successful)

const pipelineStatus = computed(() => {
  if (!runningPipeline.value || !runningPipeline.value.status) return t('unavailable')
  return te(runningPipeline.value.status) ? t(runningPipeline.value.status) : runningPipeline.value.status
})

const graphColumns = computed(
  () =>
    [
      { name: 'id', field: 'id', required: true, label: t('id'), align: 'left', sortable: true },
      { name: 'nodes', field: 'nodes', label: t('node', 2), align: 'left', sortable: true },
      { name: 'edges', field: 'edges', label: t('edge', 2), align: 'left', sortable: true }
    ] as QTableProps['columns']
)

onMounted(() => {
  loadPipeline()
    .then(() => {
      if (!runningPipeline.value) interval.value = window.setInterval(() => loadPipeline, 5000)
    })
    .catch((e: Error) => renderError(e))
})

onUnmounted(() => window.clearInterval(interval.value))

watch( [clusterPipeline], () => clusterPipelineStatus.value = clusterPipeline.value?.status )

async function loadPipeline() {
  return conceptPipelineApi
    ?.getConceptGraphPipelineById(props.dataSource.id)
    .then((r) => {
      pipeline.value = r.data
      if (
        pipeline.value?.status == PipelineResponseStatus.Successful ||
        pipeline.value?.status == PipelineResponseStatus.Failed
      )
        window.clearInterval(interval.value)
      }
    })
    .then(() => window.clearInterval(interval.value))
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
      ?.createConceptClustersForPipelineId(
        props.dataSource.id,
        selectedGraphs.value.map((c) => c.id)
      )
      .then((r) => clusterPipeline.value = r.data)
      .catch((e: Error) => renderError(e))
  })
}

async function startPipeline() {
  return conceptPipelineApi
    ?.startConceptGraphPipeline(props.dataSource.id, props.dataSource.id)
    .then(() => (interval.value = window.setInterval(() => loadPipeline, 5000)))
}

async function deletePipeline() {
  window.clearInterval(interval.value)
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
  conceptPipelineApi?.getConceptGraphStatistics(props.dataSource.id)
    .then((r) => {
      for(const id in r.data) {
        let graph = {id: id, nodes: r.data[id].nodes, edges: r.data[id].edges} as ConceptGraphObject
        conceptGraphs.value.push(graph)
        //ToDO: doesn't work -> I get a 'props.conceptCluster.some is not a function'
        // if (selectedGraphs.value.length === 0 && props.conceptCluster.some((c) => c.id === id)) selectedGraphs.value.push(graph)
      }
    })
    .catch((e: Error) => renderError(e))
}

interface ConceptGraphObject {
  id: string;
  nodes: number;
  edges: number;
}
</script>
