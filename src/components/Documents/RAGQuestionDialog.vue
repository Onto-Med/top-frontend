<template>
  <q-dialog ref="dialogRef">
    <q-card class="content" style="min-width: 600px; max-width: min-content">
      <q-card-section class="row q-gutter-sm">
        <div>{{ t('documentsForRAG', { numberOfDocs: props.documents?.length }) }}:</div>
      </q-card-section>
      <q-card-section>
        <q-input v-model="ragQuestion" outlined :label="t('question')" />
      </q-card-section>
      <q-card-section>
        <!--        v-if="ragAnswer != undefined && ragAnswer.length > 0"-->
        {{ ragAnswer }}
      </q-card-section>
      <q-card-section v-if="ragAdditionalInfo != undefined && ragAdditionalInfo.length > 1">
        <JsonEditorVue
          v-model="ragAdditionalInfo"
          v-bind="{
            /* local props & attrs */
          }"
        />
        <!--        v-if="ragAdditionalInfo != undefined && ragAdditionalInfo.length > 0"-->
      </q-card-section>
      <q-card-section>
        <q-btn-group>
          <q-btn
            :label="t('startThing', { thing: t('questioning') })"
            :disable="!ragApi"
            icon="play_arrow"
            color="secondary"
            no-caps
            @click="poseQuestion()"
          />
        </q-btn-group>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { useI18n } from 'vue-i18n'
import { inject, ref } from 'vue'
import { RagApiKey } from 'boot/axios'
import useNotify from 'src/mixins/useNotify'
import JsonEditorVue from 'json-editor-vue'
import { RAGFilter } from '@onto-med/top-api'

const ragApi = inject(RagApiKey)
const { t } = useI18n()
const {
  dialogRef,
  // onDialogOK
} = useDialogPluginComponent()

const props = defineProps({
  documents: Array<string>,
  process: String,
})

const { renderError } = useNotify()
const ragQuestion = ref<string>()
const ragAnswer = ref<string>()
const ragAdditionalInfo = ref<string>()

async function poseQuestion() {
  if (!ragApi || !props.process) return
  if (ragQuestion.value === undefined) return
  if (
    props.documents === undefined ||
    (props.documents != undefined && props.documents.length == 0)
  ) {
    await ragApi
      .poseQuestionToRAG(props.process, ragQuestion.value)
      .then((r) => {
        ragAnswer.value = r.data.answer
        console.log(r.data.info)
        ragAdditionalInfo.value = r.data.info != undefined ? r.data.info : ''
        console.log(ragAdditionalInfo.value)
      })
      .catch((e) => renderError(e))
  } else {
    const filter = {
      docIds: props.documents,
    } as RAGFilter
    await ragApi
      .poseQuestionToRAGWithFilter(props.process, ragQuestion.value, filter)
      .then((r) => {
        ragAnswer.value = r.data.answer
        console.log(r.data.info)
        ragAdditionalInfo.value = r.data.info != undefined ? r.data.info : ''
        console.log(ragAdditionalInfo.value)
      })
      .catch((e) => renderError(e))
  }
}
</script>
<style scoped lang="scss"></style>
