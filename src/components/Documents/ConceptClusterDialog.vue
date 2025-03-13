<template>
  <q-dialog ref="dialogRef">
    <q-card class="content">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="col text-h6">
          {{
            t('pipelineManagementOfDataSource', { dataSource: dataSource.title || dataSource.id })
          }}
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
              <q-icon
                v-else-if="isGraphPipelineFailed"
                :title="graphPipelineStatusDetails"
                size="xs"
                name="help"
                color="red"
              />
              <q-icon v-else-if="isGraphPipelineFinished" name="check" color="positive" />
            </p>
            <q-checkbox
              v-model="skipPresent"
              size="lg"
              :label="t('conceptCluster.skipPresent')"
              checked-icon="task_alt"
              unchecked-icon="highlight_off"
            />
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
                :disable="!language || isGraphPipelineRunning || isGraphPipelineStopping"
                :title="startPipelineButtonTitle"
                icon="play_arrow"
                color="secondary"
                no-caps
                @click="confirmStartPipeline()"
              />
              <q-btn
                v-if="!isGraphPipelineRunning"
                :label="t('deleteThing', { thing: t('pipeline') })"
                :disable="!graphPipeline || isGraphPipelineStopping"
                icon="delete"
                color="red"
                no-caps
                @click="confirmDeletePipeline()"
              />
              <q-btn
                v-if="isGraphPipelineRunning"
                :label="t('stopThing', { thing: t('pipeline') })"
                icon="stop"
                color="red"
                no-caps
                @click="confirmStopPipeline()"
              />
              <q-btn
                :label="t('editThing', { thing: t('pipeline') })"
                :disable="!isAdmin || isGraphPipelineRunning || !language"
                :title="configPipelineButtonTitle"
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
              :disable="!isAdmin || isClusterPipelineRunning"
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
            >
              <template #body="innerProps">
                <q-tr :props="innerProps">
                  <q-td auto-width>
                    <q-checkbox v-model="innerProps.selected"></q-checkbox>
                  </q-td>
                  <q-td key="phrases" :props="innerProps">
                    <q-chip clickable @click="showPhrases(innerProps.row.id)">{{ innerProps.row.phrases }}</q-chip>
                  </q-td>
                  <q-td key="nodes" :props="innerProps">
                    {{ innerProps.row.nodes }}
                  </q-td>
                  <q-td key="edges" :props="innerProps">
                    {{ innerProps.row.edges }}
                  </q-td>
                  <q-td key="id" :props="innerProps">
                    {{ innerProps.row.id }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
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
                <q-btn
                  flat
                  :label="t('back')"
                  color="primary"
                  class="q-ml-sm"
                  @click="stepper?.previous()"
                />
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
  ConceptGraphPipelineStatus,
  ConceptGraphPipelineStatusEnum,
  DataSource,
  PipelineResponse,
  PipelineResponseStatus,
} from '@onto-med/top-api'
import { Notify, QStepper, QTableProps, useDialogPluginComponent, useQuasar } from 'quasar'
import { ConceptClusterApiKey, ConceptPipelineApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { languages } from 'src/config'
import { useI18n } from 'vue-i18n'
import Dialog from '../Dialog.vue'
import { storeToRefs } from 'pinia'
import { useEntityStore } from 'src/stores/entity-store'
import PipelineConfigForm from 'components/Documents/PipelineConfigForm.vue'
import { AxiosResponse } from 'axios'
import PhraseDialog from 'components/Documents/PhraseDialog.vue'

const props = defineProps({
  dataSource: {
    type: Object as () => DataSource,
    required: true,
  },
  conceptCluster: Array as () => ConceptCluster[],
})

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const { dialogRef, onDialogHide } = useDialogPluginComponent()
const { renderError, notify } = useNotify()
const $q = useQuasar()
const entityStore = useEntityStore()
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
const skipPresent = ref<boolean>(true)

const isGraphPipelineFinished = computed(
  () => graphPipeline.value?.status === PipelineResponseStatus.Successful,
)
const isGraphPipelineFailed = computed(
  () => graphPipeline.value?.status === PipelineResponseStatus.Failed,
)
const isGraphPipelineRunning = computed(
  () => graphPipeline.value?.status === PipelineResponseStatus.Running,
)
const isGraphPipelineStopping = computed(
  () => graphPipeline.value?.status === PipelineResponseStatus.Stopped,
)
const isClusterPipelineFinished = computed(
  () => clusterPipeline.value?.status === PipelineResponseStatus.Successful,
)
const isClusterPipelineFailed = computed(
  () => clusterPipeline.value?.status === PipelineResponseStatus.Failed,
)
const isClusterPipelineRunning = computed(
  () => clusterPipeline.value?.status === PipelineResponseStatus.Running,
)

const graphPipelineStatus = computed(() => statusToString(graphPipeline.value?.status))
const clusterPipelineStatus = computed(() => statusToString(clusterPipeline.value?.status))
const graphPipelineStatusDetails = computed(() => statusDetailsToString(graphPipeline.value?.steps))

const graphColumns = computed(
  () =>
    [
      { name: 'phrases', field: 'phrases', label: t('phrase', 2), align: 'left', sortable: false },
      { name: 'nodes', field: 'nodes', label: t('node', 2), align: 'left', sortable: true },
      { name: 'edges', field: 'edges', label: t('edge', 2), align: 'left', sortable: true },
      { name: 'id', field: 'id', required: true, label: t('id'), align: 'left', sortable: true },
    ] as QTableProps['columns'],
)

const configPipelineButtonTitle = computed(() => {
  if (!language.value)
    return t('conceptCluster.tooltips.noLanguage') + ' ' + t('conceptCluster.tooltips.editing')
  else if (!isAdmin.value)
    return t('conceptCluster.tooltips.onlyAdmins') + ' ' + t('conceptCluster.tooltips.editing')
  else if (isGraphPipelineRunning.value)
    return (
      t('conceptCluster.tooltips.running', { optional: t('pipeline') + ' ' }) +
      '. ' +
      t('conceptCluster.tooltips.cantEdit')
    )
  else return ''
})

const startPipelineButtonTitle = computed(() => {
  if (!language.value)
    return t('conceptCluster.tooltips.noLanguage') + ' ' + t('conceptCluster.tooltips.starting')
  else if (!isAdmin.value)
    return t('conceptCluster.tooltips.onlyAdmins') + ' ' + t('conceptCluster.tooltips.starting')
  else if (isGraphPipelineRunning.value || isGraphPipelineStopping.value)
    return (
      t('conceptCluster.tooltips.running', { optional: t('pipeline') + ' ' }) +
      '/' +
      t('conceptCluster.tooltips.stopped', { optional: '' }) +
      '. ' +
      t('conceptCluster.tooltips.cantStart')
    )
  else return ''
})

const pipelineJsonConfig = ref<string>('')

onMounted(() => {
  loadGraphPipeline()
})

onUnmounted(() => {
  window.clearInterval(graphPipelineInterval.value)
  window.clearInterval(clusterPipelineInterval.value)
})

//ToDo: maybe don't erase config on language switch when a manual save was already commited?
watch(language, () => {
  pipelineJsonConfig.value = ''
})

function statusToString(status?: PipelineResponseStatus) {
  return !status ? t('unavailable') : te(status) ? t(status) : status
}

function statusDetailsToString(steps?: ConceptGraphPipelineStatus[]) {
  let returnString = 'Unfinished steps: '
  steps
    ?.filter((step: ConceptGraphPipelineStatus) => {
      return step.status != ConceptGraphPipelineStatusEnum.Finished
    })
    .forEach((step: ConceptGraphPipelineStatus) => {
      returnString += '"' + step.name + '", '
    })
  return returnString.slice(0, returnString.length - 2)
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
      if (
        graphPipeline.value?.status === PipelineResponseStatus.Running ||
        graphPipeline.value?.status === PipelineResponseStatus.Stopped
      )
        graphPipelineInterval.value = window.setTimeout(loadGraphPipeline, 5000)
    })
    .catch((e: Error) => {
      graphPipelineInterval.value = undefined
      graphPipeline.value = {
        pipelineId: props.dataSource?.id,
        status: PipelineResponseStatus.Failed,
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
        status: PipelineResponseStatus.Failed,
      }
      renderError(e)
    })
}

function confirmStartPipeline() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmStart'),
    },
  }).onOk(() => {
    deletePipeline()
      .then(startPipeline)
      .catch((e: Error) => renderError(e))
  })
}

function confirmStopPipeline() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmStop'),
    },
  }).onOk(() => {
    stopPipeline().catch((e: Error) => renderError(e))
  })
}

function confirmDeletePipeline() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmDelete'),
    },
  }).onOk(() => {
    deletePipeline().catch((e: Error) => renderError(e))
  })
}

function confirmPublishClusters() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmPublish'),
    },
  }).onOk(() => {
    conceptClusterApi
      ?.deleteConceptClustersForPipelineId(props.dataSource.id)
      .then(() =>
        conceptClusterApi
          ?.createConceptClustersForPipelineId(
            props.dataSource.id,
            selectedGraphs.value.map((c) => c.id),
          )
          .then(loadClusterPipeline)
          .catch((e: Error) => renderError(e)),
      )
      .catch((e: Error) => renderError(e))
  })
}

async function startPipeline() {
  if (pipelineJsonConfig.value != '') {
    const jsonBody = `{"name": "${props.dataSource?.id}", "language": "${language.value}", "return_statistics": "false",
     "skip_present": "${skipPresent.value}", "config": ${JSON.stringify(pipelineJsonConfig.value)}}`
    return conceptPipelineApi
      ?.startConceptGraphPipelineWithJson(jsonBody)
      .then(pipelineResponseCheck)
      .then(loadGraphPipeline)
  } else {
    return conceptPipelineApi
      ?.startConceptGraphPipeline(
        props.dataSource.id,
        props.dataSource.id,
        undefined,
        undefined,
        language.value,
      )
      .then(pipelineResponseCheck)
      .then(loadGraphPipeline)
  }
}

function pipelineResponseCheck(r: AxiosResponse<PipelineResponse>) {
  if (r.data.status == PipelineResponseStatus.Failed) {
    notify(
      r.data.response != undefined
        ? r.data.response
        : 'No specific response given, but it seems to have failed. Please consult the backend logs.',
      'negative',
    )
  }
}

async function deletePipeline() {
  //ToDo: reload concept clusters in DocumentSearchForm when pipeline is deleted
  window.clearInterval(graphPipelineInterval.value)
  graphPipelineInterval.value = undefined
  return conceptPipelineApi
    ?.deleteConceptPipelineById(props.dataSource.id)
    .then(() => (graphPipeline.value = undefined))
}

async function stopPipeline() {
  return conceptPipelineApi
    ?.stopConceptGraphPipeline(props.dataSource.id)
    .then(() => Notify.create({ message: 'Stopping Pipeline', type: 'warning' }))
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
        const labels = await conceptPipelineApi
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
        const graph = {
          id: id,
          nodes: r.data[id]?.nodes,
          edges: r.data[id]?.edges,
          phrases: labels.join(' | '),
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
  // pipelineId only gets submitted to 'configure dialog' (and therefore a configuration for it is loaded)
  // when the relevant 'graphPipeline' is finished, else a language default configuration is loaded
  let pipelineIdSubmit = undefined
  //ToDo: config of an unfinished pipeline is not loaded with this setup
  if (isGraphPipelineFinished.value) pipelineIdSubmit = graphPipeline.value?.pipelineId
  //ToDo: pipelineJsonConfig is not persisted between closing/opening ConceptClusterDialog
  $q.dialog({
    component: PipelineConfigForm,
    componentProps: {
      pipelineId: pipelineIdSubmit,
      savedConfig: pipelineJsonConfig.value,
      language: language.value,
    },
  })
    .onOk((jsonConfig: string) => {
      pipelineJsonConfig.value = jsonConfig
    })
    .onCancel(() => {
      //ToDo: need something here to be done on Cancel?
    })
}

async function showPhrases(id: string) {
  await conceptPipelineApi
    ?.getConceptGraph(props.dataSource.id, id)
    .then((r) => {
      $q.dialog({
        component: PhraseDialog,
        componentProps: {
          phrases: r.data.nodes
        }
      })
    })
}

interface ConceptGraphObject {
  id: string
  nodes: number
  edges: number
  phrases: string
}
</script>
