<template>
  <q-dialog ref="dialogRef">
    <q-card class="content">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('pipelineManagementOfDataSource', { dataSource: dataSource.title || dataSource.id }) }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-stepper ref="stepper" v-model="step" active-icon="none" animated>
          <q-step :name="1" :title="t('preProcessing')" :done="step > 1" icon="model_training">
            <p>
              <small>{{ t('conceptCluster.preProcessingDescription') }}</small>
            </p>
            <p>
              <b>{{ t('status') }}:</b> {{ pipelineStatus }}
            </p>
            <q-btn-group>
              <q-btn
                :label="t('startThing', { thing: t('pipeline') })"
                icon="play_arrow"
                color="secondary"
                no-caps
                @click="startPipeline()"
              />
              <q-btn
                :label="t('deleteThing', { thing: t('pipeline') })"
                icon="delete"
                color="red"
                no-caps
                @click="deletePipeline()"
              />
            </q-btn-group>
          </q-step>

          <q-step :name="2" :title="t('clusterReview')" icon="rule">
            <p>{{ t('conceptCluster.reviewDescription') }}</p>
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
import { DataSource, PipelineResponse, PipelineResponseStatus } from '@onto-med/top-api'
import { QStepper, useDialogPluginComponent, useQuasar } from 'quasar'
import { ConceptgraphsApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { computed, inject, onMounted, ref } from 'vue'
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
const conceptgraphsApi = inject(ConceptgraphsApiKey)
const stepper = ref<QStepper>()
const step = ref(1)
const pipeline = ref<PipelineResponse>()

const isPipelineFinished = computed(() => pipeline.value?.status === PipelineResponseStatus.Successful)

const pipelineStatus = computed(() => {
  if (!pipeline.value || !pipeline.value.status) return t('unavailable')
  return te(pipeline.value.status) ? t(pipeline.value.status) : pipeline.value.status
})

onMounted(() => loadPipeline())

// TODO: setup timeout that reloads the pipeline if it has not finished yet
// TODO: onUnmount: delete timeout

function loadPipeline() {
  conceptgraphsApi?.getConceptGraphStatistics(undefined, props.dataSource.id).catch((e: Error) => renderError(e))
}

function startPipeline() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmStart')
    }
  }).onOk(() => {
    throw Error('not implemented')
  })
}

function deletePipeline() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('conceptCluster.confirmDelete')
    }
  }).onOk(() => {
    throw Error('not implemented')
  })
}
</script>
