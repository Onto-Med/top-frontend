<template>
  <q-dialog ref="dialogRef">
    <q-card class="content" style="min-width: 600px; max-width: min-content">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-h6">
          <q-icon name="smart_toy" />
          {{ t('documentsForRAG', { numberOfDocs: props.documents?.length }) }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input
          v-model="ragQuestion"
          outlined
          autofocus
          :label="t('question')"
          @keyup.enter="poseQuestion()"
        >
          <template #after>
            <q-btn
              v-if="!startedQuestioning"
              round
              dense
              flat
              icon="send"
              color="primary"
              :disable="!ragApi || startedQuestioning"
              :title="t('startThing', { thing: t('questioning') })"
              @click="poseQuestion()"
            />
            <q-spinner v-if="startedQuestioning" size="xs" class="q-ml-sm" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section>
        {{ ragAnswer }}
      </q-card-section>

      <q-card-section v-if="ragAdditionalInfo != undefined && ragAdditionalInfo.length > 1">
        <JsonEditorVue v-model="ragAdditionalInfo" />
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
import { AxiosResponse } from 'axios'

const ragApi = inject(RagApiKey)
const { t } = useI18n()
const { dialogRef } = useDialogPluginComponent()

const props = defineProps({
  documents: Array<string>,
  process: String,
})

const { renderError } = useNotify()
const ragQuestion = ref<string>()
const ragAnswer = ref<string>()
const ragAdditionalInfo = ref<string>()
const startedQuestioning = ref<boolean>(false)

async function poseQuestion() {
  if (startedQuestioning.value) return
  startedQuestioning.value = true

  if (!ragApi || !props.process) return
  if (ragQuestion.value === undefined) return
  if (
    props.documents === undefined ||
    (props.documents != undefined && props.documents.length == 0)
  ) {
    await ragApi
      .poseQuestionToRAG(props.process, ragQuestion.value)
      .then((r) => assignResponseToRagAnswer(r))
      .catch((e) => renderError(e))
      .finally(() => wrapUpQuestioning())
  } else {
    const filter = {
      docIds: props.documents,
    } as RAGFilter
    await ragApi
      .poseQuestionToRAGWithFilter(props.process, ragQuestion.value, filter)
      .then((r) => assignResponseToRagAnswer(r))
      .catch((e) => renderError(e))
      .finally(() => wrapUpQuestioning())
  }
}

function assignResponseToRagAnswer(r: AxiosResponse) {
  ragAnswer.value = r.data.answer
  console.log(JSON.parse(r.data.info))
  ragAdditionalInfo.value = r.data.info != undefined ? r.data.info : ''
}

function wrapUpQuestioning() {
  startedQuestioning.value = false
}
</script>
<style scoped lang="scss"></style>
