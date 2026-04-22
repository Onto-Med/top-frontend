<template v-slot="append">
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="content" style="min-width: 600px; max-width: min-content">
      <q-stepper ref="stepper" v-model="step" active-icon="none" active-color="primary" animated>
        <q-step
          :name="1"
          :title="t('entityImport.title') + ' ' + t('entityImport.concept.titleAdd')"
          :done="step > 1"
          icon="upload_file"
        >
          <div class="q-mb-lg">
            <small>{{ importDescription }}</small>
            <br/>
            <div id="center-chips">
              <q-chip
                v-for="(ftype, i) in ['txt', 'csv']"
                :key="i"
                size="sm"
                color="primary"
                text-color="white"
                dense
                clickable
                @click="openFileTypeDescription(ftype)"
              >
                {{ ftype }}
              </q-chip>
            </div>
          </div>
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
              accept=".txt,.csv"
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
            ref="advancedImportRef"
            :files="files != undefined ? (files as File[]) : undefined"
            :language="conceptLanguage"
          />
        </q-step>
        <template #navigation>
          <q-separator />
          <q-stepper-navigation class="q-mt-md">
            <q-btn
              flat
              :disable="loading"
              :label="step === 1 ? t('cancel') : t('back')"
              color="primary"
              @click="onCancelClick"
            />
            <q-btn
              flat
              :disable="loading || (!conceptLanguage && !advancedImport) || hasNoFiles"
              :label="advancedImport && step === 1 ? t('continue') : t('import')"
              color="primary"
              @click="onOkClick"
            />
          </q-stepper-navigation>
        </template>
      </q-stepper>
      <q-inner-loading :showing="loading" :label="t('pleaseWait') + '...'" />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QStepper, useDialogPluginComponent, useQuasar } from 'quasar'
import { Entity, EntityType, LocalisableText, RepositoryType } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import useNotify from 'src/mixins/useNotify'
import { useEntityStore } from 'stores/entity-store'
import { languages } from 'src/config'
import { v4 as uuidv4 } from 'uuid'
import AdvancedConceptListImport, {
  FileDescription,
} from 'components/EntityEditor/AdvancedConceptListImport.vue'

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
const $q = useQuasar()
const stepper = ref<QStepper>()
const step = ref(1)

const loading = ref(false)
const files = ref<null | []>(null)
const conceptLanguage = ref<string | undefined>()
const advancedImport = ref(false)
const advancedImportRef = ref<InstanceType<typeof AdvancedConceptListImport> | null>(null)

let fileDescriptions: FileDescription[] = []
const hierarchyEntityMap = new Map<string, Entity | undefined>()

const hasNoFiles = computed(() => {
  return files.value == null || files.value.length <= 0
})
const importDescription = computed(() => {
  const localeTitles = props.superEntity?.titles?.filter((title) => title.lang == locale.value)
  let superTitle = localeTitles?.at(0)?.text
  if (localeTitles?.length == 0) {
    superTitle = props.superEntity?.titles?.at(0)?.text
  }

  let importDesc = t('entityImport.concept.description.base')
  if (props.superEntity != null) {
    importDesc +=
      ' ' +
      t('entityImport.concept.description.addition', {
        superConcept: superTitle,
      })
  }
  importDesc += '\n' + t('entityImport.concept.description.typeExplanation')
  return importDesc
})

async function populateConcept(
  entity: Entity,
  array: Array<string>,
  language: string,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  fileDesc: undefined | FileDescription,
) {
  const nameAsTitle = fileDesc != undefined && fileDesc.nameAsTitle
  const finalLang = fileDesc != undefined ? fileDesc.language : language

  entity.titles = [
    {
      lang: finalLang,
      text: nameAsTitle ? fileDesc.name.split('.').slice(0, -1).join('') : array[0],
    } as LocalisableText,
  ]
  entity.synonyms = array.slice(nameAsTitle ? 0 : 1).map((con: string) => {
    return {
      lang: finalLang,
      text: con,
    } as LocalisableText
  })
  return await entityStore.saveEntity(entity)
}

async function parseFile(f: File): Promise<Array<string[]>> {
  const entities: Array<string[]> = []
  const tempEntities: Array<string> = []
  const isCSV = f.name.endsWith('.csv')
  let sep = ','

  let lineCount = 0
  await f.text().then((r) =>
    r.split(new RegExp(/\r*\n/)).forEach((line: string) => {
      if (line.trim().length != 0) {
        if (isCSV && lineCount == 0 && line.startsWith('sep=')) {
          const tempSep = line.split('=')[1]
          sep = tempSep != undefined && tempSep[0] != undefined ? tempSep[0] : ','
          return
        }

        if (!isCSV) {
          tempEntities.push(line)
        } else {
          entities.push(line.split(sep).map((item: string) => item.trim()))
        }

        lineCount++
      }
    }),
  )
  if (!isCSV) entities.push(tempEntities)
  return entities
}

function createSuperEntity(parent: Entity | undefined) {
  let entity: Entity
  if (parent != null && parent.id != null) {
    entity = entityStore.addEntity(EntityType.SingleConcept, parent.id)
  } else {
    entity = { id: (uuidv4 as () => string)(), entityType: EntityType.SingleConcept }
  }
  return entity
}

async function createEntities() {
  if (files.value != null) {
    loading.value = true
    if (advancedImportRef.value != null) {
      fileDescriptions = advancedImportRef.value.rows
      for (const [hIdx, hSet] of advancedImportRef.value.hierarchyTags.entries()) {
        for (const tag of hSet) hierarchyEntityMap.set(hIdx + '-' + tag, undefined)
      }
    }

    let fileCount = 0
    let entityCount = 0
    const filesPromises = files.value.map(async (file: File) => parseFile(file))
    await Promise.all(filesPromises)
      .then(async (filesArray) => {
        for (const innerConceptArray of filesArray) {
          for (const innerConcept of innerConceptArray.filter((arr) => arr.length > 0)) {
            let entity: Entity | undefined = props.superEntity

            if (fileDescriptions != undefined) {
              const fileDesc = fileDescriptions[fileCount]
              if (fileDesc != undefined) {
                const path = []
                for (const [hIdx, tag] of fileDesc.hierarchy.entries()) {
                  if (tag === undefined || tag.length === 0) continue
                  const hLvl = hIdx + 1
                  path.push(hLvl + '-' + tag)
                  const finalKey = path.join('_')

                  if (hierarchyEntityMap.get(finalKey) === undefined) {
                    hierarchyEntityMap.set(
                      finalKey,
                      await populateConcept(
                        createSuperEntity(entity),
                        [tag],
                        fileDesc.language,
                        undefined,
                      ),
                    )
                  }
                  entity = hierarchyEntityMap.get(finalKey)
                }
              }
            }
            entity = createSuperEntity(entity)

            await populateConcept(
              entity,
              innerConcept,
              conceptLanguage.value!,
              fileDescriptions != undefined ? fileDescriptions[fileCount] : undefined,
            )
            entityCount += 1
          }
          fileCount += 1
        }
      })
      .then(() => {
        notify(t('entityImported', { count: entityCount }), 'positive')
        onDialogOK()
      })
      .finally(() => (loading.value = false))
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

function openFileTypeDescription(ftype: string) {
  const typeDescMap = new Map([
    ['txt', t('entityImport.concept.description.txt')],
    ['csv', t('entityImport.concept.description.csv')],
  ])
  $q.dialog({
    title: ftype.toUpperCase(),
    message: typeDescMap.get(ftype),
    class: "dialog-lb"
  })
}
</script>

<style lang="scss" scoped>
.lang-input {
  width: 140px;
}
.dialog-lb {
  white-space: pre-line;
}
#center-chips {
  text-align: center;
}
</style>
