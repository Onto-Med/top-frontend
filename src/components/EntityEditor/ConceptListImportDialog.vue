<template v-slot="append">
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="content" style="min-width: 600px; max-width: min-content">
        <q-stepper ref="stepper" v-model="step" active-icon="none" animated>
          <q-step
            :name="1"
            :title="t('entityImport.title') + ' ' + t('entityImport.concept.titleAdd')"
            :done="step > 1"
            icon="upload_file"
          >
            <p>
              <small>{{ importDescription }}</small>
            </p>
            <div class="q-gutter-md">
              <q-file
                v-model="files"
                :label="t('importThing', { thing: t('single_concept', 2) })"
                :error="!files || files.length <= 0"
                outlined
                use-chips
                multiple
                clearable
                stack-label
              >
                <template #after>
                  <q-select
                    v-model="conceptLanguage"
                    :options="languages"
                    :label="t('language')"
                    :error="!conceptLanguage && !advancedImport"
                    emit-value
                    map-options
                    hide-bottom-space
                    stack-label
                    class="lang-input"
                  />
                </template>
              </q-file>
            </div>
            <q-toggle v-model="advancedImport" :label="t('entityImport.concept.advancedImport')" />
          </q-step>
          <q-step
            :name="2"
            :title="t('entityImport.concept.advancedImport')"
            :done="step > 2"
            caption="optional"
            icon="settings"
          >
            <AdvancedConceptListImport
              :files="files != undefined? (files as File[]): undefined"
              :languages="conceptLanguage"
            />
          </q-step>
          <template #navigation>
            <q-separator />
            <q-stepper-navigation class="q-mt-md">
              <q-btn
                flat
                :label="step === 1? t('cancel'): t('back')"
                color="primary"
                @click="onCancelClick"
              />
              <q-btn
                flat
                :disable="loading || (!conceptLanguage && !advancedImport) || hasNoFiles"
                :label="advancedImport && step === 1? t('continue'): t('import')"
                color="primary"
                @click="onOkClick"
              />
            </q-stepper-navigation>
          </template>
        </q-stepper>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QStepper, useDialogPluginComponent } from 'quasar'
import { Entity, EntityType, LocalisableText, RepositoryType } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import useNotify from 'src/mixins/useNotify'
import { useEntityStore } from 'stores/entity-store'
import { languages } from 'src/config'
import { v4 as uuidv4 } from 'uuid'
import AdvancedConceptListImport from 'components/EntityEditor/AdvancedConceptListImport.vue'

const props = defineProps({
  repositoryType: {
    type: String as () => RepositoryType,
    default: RepositoryType.ConceptRepository,
  },
  superEntity: Object as () => Entity,
})

defineEmits(['hide', 'ok'])

const { t, locale } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { notify, renderError } = useNotify()
const entityStore = useEntityStore()
const stepper = ref<QStepper>()
const step = ref(1)

const loading = ref(false)
const files = ref<null | []>(null)
const conceptLanguage = ref<string | undefined>()
const advancedImport = ref(false)

const hasNoFiles = computed(() => {
  return files.value == null || files.value.length <= 0
})
const importDescription = computed(() => {
  const localeTitles = props.superEntity?.titles?.filter((title) => title.lang == locale.value)
  let superTitle = localeTitles?.at(0)?.text
  if (localeTitles?.length == 0) {
    superTitle = props.superEntity?.titles?.at(0)?.text
  }

  let importDesc = t('entityImport.concept.description')
  if (props.superEntity != null) {
    importDesc +=
      ' ' +
      t('entityImport.concept.descriptionAdd', {
        superConcept: superTitle,
      })
  }
  return importDesc
})

async function populateConcept(entity: Entity, array: Array<string>, language: string) {
  entity.titles = [
    {
      lang: language,
      text: array[0],
    } as LocalisableText,
  ]
  entity.synonyms = array.slice(1).map((con: string) => {
    return {
      lang: language,
      text: con,
    } as LocalisableText
  })
  await entityStore.saveEntity(entity)
}

async function parseFile(f: File) {
  const entities: Array<string> = []
  await f.text().then((r) =>
    r.split(new RegExp(/\r*\n/)).forEach((line: string) => {
      if (line.trim().length != 0) entities.push(line)
    }),
  )
  return entities
}

async function createEntities() {
  if (files.value != null) {
    let count = 0
    const filesPromises = files.value.map(async (file: File) => parseFile(file))
    await Promise.all(filesPromises)
      .then(async (conceptArrs) => {
        for (const concepts of conceptArrs.filter((arr) => arr.length > 0)) {
          count += 1
          let entity: Entity
          if (props.superEntity != null && props.superEntity.id != null) {
            entity = entityStore.addEntity(EntityType.SingleConcept, props.superEntity.id)
          } else {
            entity = { id: (uuidv4 as () => string)(), entityType: EntityType.SingleConcept }
          }
          await populateConcept(entity, concepts, conceptLanguage.value!)
        }
      })
      .then(() => {
        notify(t('entityImported', { count: count }), 'positive')
        onDialogOK()
      })
  }
}

function onOkClick() {
  if (step.value === 1 && advancedImport.value) {
      step.value += 1
  } else {
    createEntities().catch((e: Error) => renderError(e))
  }
}

function onCancelClick() {
  if (step.value === 1) {
    onDialogCancel()
  } else {
    step.value -= 1
  }
}

</script>

<style lang="scss" scoped>
.lang-input {
  width: 140px;
}
</style>
