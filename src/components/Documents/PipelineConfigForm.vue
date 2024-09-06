<template>
  <q-dialog ref="dialogRef" no-esc-dismiss no-backdrop-dismiss>
      <q-layout view="lhh LpR lff" container style="height: 90%">
        <q-page-container>
          <q-page style="padding-top: 50px">
            <JsonEditorVue
              v-model="jsonConfig.jsonString"
              v-bind="{/* local props & attrs */}"
            />
          </q-page>
          <q-page-sticky expand position="top">
            <q-toolbar class="bg-secondary text-white">
              <q-toolbar-title>
                {{ t('configurationOfPipeline') }}
                <q-btn flat round dense icon="download" :title="t('downloadConfig')" @click="downloadConfig" />
              </q-toolbar-title>
              <div class="q-gutter-sm">
                <q-btn :title="t('save')" flat round dense icon="done" @click="saveConfig" />
                <q-btn v-if="mayResetConfig && !reset" :title="t('reset')" flat round dense icon="refresh" @click="resetConfig" />
                <q-btn :title="t('close')" flat round dense icon="close" @click="closeConfig"/>
              </div>
            </q-toolbar>
          </q-page-sticky>
        </q-page-container>
      </q-layout>
  </q-dialog>
</template>

<script setup lang="ts">
import JsonEditorVue from 'json-editor-vue'
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConceptPipelineApiKey } from 'boot/axios'
import useNotify from 'src/mixins/useNotify'
import { Notify, useDialogPluginComponent } from 'quasar'

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { renderError } = useNotify()
const conceptPipelineApi = inject(ConceptPipelineApiKey)
const { t } = useI18n()
const jsonConfig = ref<JsonConfigObject>( {
  jsonString: '',
  jsonError: { 'error': t('conceptCluster.configurationGetError') },
  successful: false
})
const props = defineProps({
  pipelineId: {
    type: String,
    default: undefined
  },
  savedConfig: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'en'
  }
})
const reset = ref(false)
const mayResetConfig = computed(() => {
  return ((props.pipelineId != undefined) && props.savedConfig)
})

onMounted(() => {
  loadConfig(false)
})

function loadConfig(reset: boolean) {
  let defaultConfig = props.pipelineId === undefined
  conceptPipelineApi?.getConceptGraphPipelineConfiguration(props.pipelineId, props.language)
    .then((r) => {
      if (!r.data || r.data.length === 0) {
        jsonConfig.value.jsonString = jsonConfig.value.jsonError
        jsonConfig.value.successful = false
      } else {
        if (defaultConfig && !(props.savedConfig != '')) {
          Notify.create({
              'message': t('conceptCluster.configurationGetDefaultWarning', { lang: t(props.language) }),
              'type': 'warning'
            })
        } else if (!defaultConfig && (props.savedConfig == '' || reset)) {
          Notify.create({
            'message': t('conceptCluster.configurationGetCurrentPipelineWarning'),
            'type': 'warning'
          })
        }
        jsonConfig.value.jsonString = r.data
        jsonConfig.value.successful = true
      }
      if (props.savedConfig != '' && !reset) {
        Notify.create({ 'message': t('conceptCluster.configurationGetSavedWarning'), 'type': 'warning' })
        jsonConfig.value.jsonString = props.savedConfig
        jsonConfig.value.successful = true
      }
    })
    .catch((e: Error) => {
      jsonConfig.value.jsonString = jsonConfig.value.jsonError
      jsonConfig.value.successful = false
      renderError(e)
    })
}

function saveConfig() {
  //ToDo: some sanity check?
  if (!jsonConfig.value.successful) {
    jsonConfig.value.jsonString = ''
  }
  onDialogOK(jsonConfig.value.jsonString)
}

function closeConfig() {
  //ToDo: warning pop up if changes were detected?
  onDialogCancel()
}

function downloadConfig() {
  //ToDo!
  Notify.create({ 'message': 'Not yet implemented.', 'type': 'negative' })
}

function resetConfig() {
  reset.value = true
  loadConfig(true)
}

interface JsonConfigObject {
  jsonString: string|object,
  jsonError: object,
  successful: boolean
}
</script>

<style scoped lang="sass">

</style>
