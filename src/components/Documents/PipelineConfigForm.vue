<template>
  <q-dialog ref="dialogRef">
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
            </q-toolbar>
          </q-page-sticky>
          <q-page-sticky position="bottom">
            <q-btn-group style="padding: 2px" >
              <q-btn
                label="Save"
                color="secondary"
                @click="saveConfig"
              />
            </q-btn-group>
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

const { renderError } = useNotify()
const conceptPipelineApi = inject(ConceptPipelineApiKey)
const { t } = useI18n()
const jsonConfig = ref<string>('{ }')
const props = defineProps({
  config: {
    type: String,
    default: ''
  }
})

onMounted(() => {
  loadConfig()
})

function loadConfig() {
  if (props.config === '') {
    let errStr = 'Couldn\'t find configuration. Please refer to the documentation on how to write your own.'
    conceptPipelineApi?.getConceptGraphPipelineConfiguration()
      .then((r) => {
        if (!r.data || r.data === '' || r.data === '{}') {
          jsonConfig.value = errStr
        } else {
          jsonConfig.value = r.data
        }
      })
      .catch((e: Error) => {
        jsonConfig.value = errStr
        renderError(e)
      })
  }
}

function saveConfig() {
}
</script>

<style scoped lang="sass">

</style>
