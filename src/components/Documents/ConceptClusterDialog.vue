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
            <q-table
              v-model="selectedClusters"
              flat
              :rows="clusters"
              :columns="clusterColumns"
              :selected-rows-label="getSelectedRowsString"
              row-key="id"
              selection="multiple"
            />
          </q-step>

          <template #navigation>
            <q-separator />
            <q-stepper-navigation class="q-mt-md">
              <q-btn
                :disable="!isPipelineFinished"
                :label="step === 2 ? t('finish') : t('continue')"
                color="primary"
                @click="stepper?.next()"
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
import { ConceptCluster, DataSource, PipelineResponse, PipelineResponseStatus } from '@onto-med/top-api'
import { QStepper, QTableProps, useDialogPluginComponent, useQuasar } from 'quasar'
import { ConceptPipelineApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from '../Dialog.vue'

const props = defineProps<{
  dataSource: DataSource
}>()

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const { dialogRef } = useDialogPluginComponent()
const { renderError } = useNotify()
const $q = useQuasar()
const conceptPipelineApi = inject(ConceptPipelineApiKey)
const stepper = ref<QStepper>()
const step = ref(1)
const pipeline = ref<PipelineResponse>()
const clusters = ref<ConceptCluster[]>()
const selectedClusters = ref<ConceptCluster[]>([])
const interval = ref<number>()

const isPipelineFinished = computed(() => pipeline.value?.status === PipelineResponseStatus.Successful)

const pipelineStatus = computed(() => {
  if (!pipeline.value || !pipeline.value.status) return t('unavailable')
  return te(pipeline.value.status) ? t(pipeline.value.status) : pipeline.value.status
})

const clusterColumns = computed(
  () =>
    [
      { name: 'id', required: true, label: t('id'), align: 'left', sortable: true },
      { name: 'labels', label: t('label', 2), align: 'left', sortable: true }
    ] as QTableProps['columns']
)

onMounted(() => {
  loadPipeline()
    .then(() => {
      if (!pipeline.value) interval.value = window.setInterval(() => loadPipeline, 5000)
    })
    .catch((e: Error) => renderError(e))
})

onUnmounted(() => window.clearInterval(interval.value))

async function loadPipeline() {
  return conceptPipelineApi
    ?.getConceptPipelineById(props.dataSource.id)
    .then((r) => {
      pipeline.value = r.data
      if (
        pipeline.value?.status == PipelineResponseStatus.Successful ||
        pipeline.value?.status == PipelineResponseStatus.Failed
      )
        window.clearInterval(interval.value)
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
  return t('recordSelected', selectedClusters.value.length)
}
</script>
