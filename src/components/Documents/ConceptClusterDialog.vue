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
              <q-icon v-else-if="isGraphPipelineFailed" name="bolt" color="red" />
              <q-icon v-else-if="isGraphPipelineFinished" name="check" color="positive" />
            </p>
            <q-select
              v-model="language"
              :options="languages"
              :label="t('language')"
              :error="!language"
              emit-value
              map-options
            />
            <q-btn-group>
              <q-btn
                :label="t('startThing', { thing: t('pipeline') })"
                :disable="!language"
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
              <q-btn
                :label="t('editThing', { thing: t('pipeline') })"
                :disable="!isAdmin"
                icon="settings"
                color="orange"
                no-caps
                @click="configurePipeline()"
              />
            </q-btn-group>
          </q-step>
          <q-step :name="2" :title="t('clusterReview')" icon="rule">
            <p>{{ t('conceptCluster.reviewDescription') }}</p>
            <p class="text-subtitle1">
              <b>{{ t('status') }}:</b> {{ clusterPipelineStatus }}
              <q-spinner v-if="clusterPipelineInterval" size="xs" class="q-ml-sm" />
              <q-icon v-else-if="isClusterPipelineFailed" name="bolt" color="red" />
              <q-icon v-else-if="isClusterPipelineFinished" name="check" color="positive" />
            </p>
            <q-btn
              no-caps
              :label="t('publishThing', { thing: t('concept_cluster', 2) })"
              color="secondary"
              class="q-mb-sm"
              @click="confirmPublishClusters"
            />
            <q-table
              v-model:selected="selectedGraphs"
              flat
              :rows="conceptGraphs"
              :columns="graphColumns"
              :selected-rows-label="getSelectedRowsString"
              wrap-cells
              row-key="id"
              selection="multiple"
            />
          </q-step>
          <template #navigation>
            <q-separator />
            <q-stepper-navigation class="q-mt-md">
              <q-btn
                v-if="step == 1"
                :disable="!isGraphPipelineFinished"
                :label="t('continue')"
                color="primary"
                @click="conceptGraphStep"
              />
              <div v-else>
                <q-btn
                  :disable="!isClusterPipelineFinished"
                  :label="t('finish')"
                  color="primary"
                  @click="conceptGraphStep"
                />
                <q-btn flat :label="t('back')" color="primary" class="q-ml-sm" @click="stepper?.previous()" />
              </div>
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
import { languages } from 'src/config'
import { useI18n } from 'vue-i18n'
import Dialog from '../Dialog.vue'
import { storeToRefs } from 'pinia'
import { useEntity } from 'src/pinia/entity'
import PipelineConfigForm from 'components/Documents/PipelineConfigForm.vue'

const props = defineProps({
  dataSource: {
    type: Object as () => DataSource,
    required: true
  },
  conceptCluster: Array as () => ConceptCluster[]
})

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const { dialogRef, onDialogHide } = useDialogPluginComponent()
const { renderError } = useNotify()
const $q = useQuasar()
const entityStore = useEntity()
const { isAdmin } = storeToRefs(entityStore)
const conceptPipelineApi = inject(ConceptPipelineApiKey)
const conceptClusterApi = inject(ConceptClusterApiKey)
const language = ref<string | undefined>()
const stepper = ref<QStepper>()
const step = ref(1)
const graphPipeline = ref<ConceptGraphPipeline>()
const clusterPipeline = ref<PipelineResponse>()
const conceptGraphs = ref<ConceptGraphObject[]>([])
const selectedGraphs = ref<ConceptGraphObject[]>([])
const graphPipelineInterval = ref<number>()
const clusterPipelineInterval = ref<number>()

const isGraphPipelineFinished = computed(() => graphPipeline.value?.status === PipelineResponseStatus.Successful)
const isGraphPipelineFailed = computed(() => graphPipeline.value?.status === PipelineResponseStatus.Failed)
const isClusterPipelineFinished = computed(() => clusterPipeline.value?.status === PipelineResponseStatus.Successful)
const isClusterPipelineFailed = computed(() => clusterPipeline.value?.status === PipelineResponseStatus.Failed)

const graphPipelineStatus = computed(() => statusToString(graphPipeline.value?.status))
const clusterPipelineStatus = computed(() => statusToString(clusterPipeline.value?.status))

const graphColumns = computed(
  () =>
    [
      { name: 'phrases', field: 'phrases', label: t('phrase', 2), align: 'left', sortable: false },
      { name: 'nodes', field: 'nodes', label: t('node', 2), align: 'left', sortable: true },
      { name: 'edges', field: 'edges', label: t('edge', 2), align: 'left', sortable: true },
      { name: 'id', field: 'id', required: true, label: t('id'), align: 'left', sortable: true }
    ] as QTableProps['columns']
)

onMounted(() => {
  loadGraphPipeline()
})

onUnmounted(() => {
  window.clearInterval(graphPipelineInterval.value)
  window.clearInterval(clusterPipelineInterval.value)
})

function statusToString(status?: PipelineResponseStatus) {
  return !status ? t('unavailable') : te(status) ? t(status) : status
}

function loadGraphPipeline() {
  conceptPipelineApi
    ?.getConceptGraphPipelineById(props.dataSource.id)
    .then((r) => {
      if (
        !r.data.pipelineId ||
        r.data.status == PipelineResponseStatus.Successful ||
        r.data.status == PipelineResponseStatus.Failed
      ) {
        window.clearInterval(graphPipelineInterval.value)
        graphPipelineInterval.value = undefined
        if (!r.data.pipelineId) return
      }
      graphPipeline.value = r.data
    })
    .then(() => {
      if (graphPipeline.value?.status === PipelineResponseStatus.Running)
        graphPipelineInterval.value = window.setTimeout(loadGraphPipeline, 5000)
    })
    .catch((e: Error) => {
      graphPipelineInterval.value = undefined
      graphPipeline.value = {
        pipelineId: props.dataSource?.id,
        status: PipelineResponseStatus.Failed
      }
      renderError(e)
    })
}

function loadClusterPipeline() {
  conceptClusterApi
    ?.getConceptClusterProcess(props.dataSource?.id)
    .then((r) => {
      if (
        !r.data.pipelineId ||
        r.data.status == PipelineResponseStatus.Successful ||
        r.data.status == PipelineResponseStatus.Failed
      ) {
        window.clearInterval(clusterPipelineInterval.value)
        clusterPipelineInterval.value = undefined
        if (!r.data.pipelineId) return
      }
      clusterPipeline.value = r.data
    })
    .then(() => {
      if (clusterPipeline.value?.status === PipelineResponseStatus.Running)
        clusterPipelineInterval.value = window.setTimeout(loadClusterPipeline, 5000)
    })
    .catch((e: Error) => {
      clusterPipelineInterval.value = undefined
      clusterPipeline.value = {
        pipelineId: props.dataSource?.id,
        status: PipelineResponseStatus.Failed
      }
      renderError(e)
    })
}

function confirmStartPipeline() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmStart')
    }
  }).onOk(() => {
    deletePipeline()
      .then(startPipeline)
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
          .then(loadClusterPipeline)
          .catch((e: Error) => renderError(e))
      )
      .catch((e: Error) => renderError(e))
  })
}

async function startPipeline() {
  return conceptPipelineApi
    ?.startConceptGraphPipeline(props.dataSource.id, props.dataSource.id, undefined, undefined, language.value)
    .then(loadGraphPipeline)
}

async function deletePipeline() {
  window.clearInterval(graphPipelineInterval.value)
  graphPipelineInterval.value = undefined
  return conceptPipelineApi
    ?.deleteConceptPipelineById(props.dataSource.id)
    .then(() => (graphPipeline.value = undefined))
}

function getSelectedRowsString() {
  return t('recordSelected', selectedGraphs.value.length)
}

function conceptGraphStep() {
  if (step.value === 1) {
    loadConceptGraphs()
    stepper?.value?.next()
  } else {
    onDialogHide()
  }
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
        let graph = {
          id: id,
          nodes: r.data[id].nodes,
          edges: r.data[id].edges,
          phrases: labels.join(' | ')
        } as ConceptGraphObject
        conceptGraphs.value.push(graph)
        if (props.conceptCluster?.some((c) => c.id === id)) {
          selectedGraphs.value.push(graph)
        }
      }
    })
    .then(loadClusterPipeline)
    .catch((e: Error) => renderError(e))
}

function configurePipeline() {
  $q.dialog({
    component: PipelineConfigForm,
    componentProps: {
    }
  }).onOk(() => {
    console.log('Ok config')
  })
}

interface ConceptGraphObject {
  id: string
  nodes: number
  edges: number
  phrases: string
}
</script>
