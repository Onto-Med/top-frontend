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
import { useDialogPluginComponent } from 'quasar'

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { renderError } = useNotify()
const conceptPipelineApi = inject(ConceptPipelineApiKey)
const { t } = useI18n()
const jsonConfig = ref<string>('{ }')
const props = defineProps({
  pipelineId: {
    type: String,
    default: undefined
  }
})
const pipelineConfigError = ref(false)

onMounted(() => {
  loadConfig()
})

function loadConfig() {
  //ToDo: as i18n
  let errStr = 'Couldn\'t find configuration.\n' +
    'Please refer to the `concept-graphs-api` documentation on how to write your own.\n' +
    'Else default values will be used.'
  pipelineConfigError.value = true
  conceptPipelineApi?.getConceptGraphPipelineConfiguration(props.pipelineId)
    .then((r) => {
      if (!r.data || r.data.trim() === '' || r.data.trim() === '{}') {
        jsonConfig.value = errStr
      } else {
        jsonConfig.value = r.data
        pipelineConfigError.value = false
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
</script>

<style scoped lang="sass">

</style>
