<template>
  <q-dialog ref="dialogRef">
    <q-card class="content" style="min-width: 600px; max-width: min-content">
      <q-card-section class="row q-gutter-sm">
        <div>{{ t('documentsForRAG', { numberOfDocs: props.documents?.length }) }}:</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="ragQuestion"
          outlined
          :label="t('question')"
        />
      </q-card-section>
      <q-card-section>
        <!--        v-if="ragAnswer != undefined && ragAnswer.length > 0"-->
        {{ ragAnswer }}
      </q-card-section>
      <q-card-section>
        <!--        v-if="ragAdditionalInfo != undefined && ragAdditionalInfo.length > 0"-->
        {{ ragAdditionalInfo }}
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
  await ragApi
    .poseQuestionToRAG(props.process, ragQuestion.value)
    .then((r) => {
      ragAnswer.value = r.data.answer
      ragAdditionalInfo.value = JSON.stringify(r.data.info != undefined ? r.data.info : "", undefined, 4)
    })
    .catch((e) => renderError(e))
}
</script>
<style scoped lang="scss"></style>
