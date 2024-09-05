<template>
  <q-dialog ref="dialogRef" no-esc-dismiss no-backdrop-dismiss>
      <q-layout view="lhh LpR lff" container style="height: 90%">
        <q-page-container>
          <q-page style="padding-top: 50px">
            <JsonEditorVue
              v-model="jsonConfig"
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
                <q-btn flat round dense icon="done" @click="saveConfig" />
                <q-btn flat round dense icon="close" @click="closeConfig"/>
              </div>
            </q-toolbar>
          </q-page-sticky>
        </q-page-container>
      </q-layout>
  </q-dialog>
</template>

<script setup lang="ts">
import JsonEditorVue from 'json-editor-vue'
import { inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConceptPipelineApiKey } from 'boot/axios'
import useNotify from 'src/mixins/useNotify'
import { Notify, useDialogPluginComponent } from 'quasar'

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { renderError } = useNotify()
const conceptPipelineApi = inject(ConceptPipelineApiKey)
const { t } = useI18n()
const jsonConfig = ref<object|string>('')
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
const pipelineConfigError = ref(false)

onMounted(() => {
  loadConfig()
})

function loadConfig() {
  let errStr = t('conceptCluster.configurationGetError')
  let defaultConfig = props.pipelineId === undefined
  pipelineConfigError.value = true
  conceptPipelineApi?.getConceptGraphPipelineConfiguration(props.pipelineId, props.language)
    .then((r) => {
      //ToDo: should be ResponseEntity<String> but is parsed (automatically?) as Object/JSON?
      if (!r.data || r.data.length === 0) {
        jsonConfig.value = errStr
      } else {
        if (defaultConfig && !(props.savedConfig != '')) Notify.create(
          { 'message': t('conceptCluster.configurationGetDefaultWarning',
          { lang: t(props.language) }) , 'type': 'warning' }
        )
        jsonConfig.value = r.data
        pipelineConfigError.value = false
      }
      if (props.savedConfig != '') {
        Notify.create({ 'message': t('conceptCluster.configurationGetSavedWarning'), 'type': 'warning' })
        jsonConfig.value = props.savedConfig
      }
    })
    .catch((e: Error) => {
      jsonConfig.value = errStr
      renderError(e)
    })
}

function saveConfig() {
  //ToDo: some sanity check?
  if (pipelineConfigError.value) jsonConfig.value = ''
  onDialogOK(jsonConfig.value)
}

function closeConfig() {
  //ToDo: warning pop up if changes were detected?
  onDialogCancel()
}

function downloadConfig() {
  //ToDo!
  Notify.create({ 'message': 'Not yet implemented.', 'type': 'negative' })
}
</script>

<style scoped lang="sass">

</style>
