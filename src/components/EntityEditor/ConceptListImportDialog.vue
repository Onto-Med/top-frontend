<template v-slot="append">
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="dialog-content">
      <q-card-section>
        <div class="text-h6">
          {{ t('entityImport.title') + ' ' + t('entityImport.concept.titleAdd') }}
        </div>
      </q-card-section>
      <q-card-section class="q-pa-none">
        <div class="text-italic q-pa-md">
          {{ t('entityImport.concept.description') }}
          {{
            (props.superEntity != null)? t('entityImport.concept.descriptionAdd',
              {
                superConcept: superConceptLabel?.text
              }): ''
          }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="q-gutter-md">
          <q-file
            v-model="files"
            :label="t('importThing', { thing: t('single_concept', 2) })"
            outlined
            use-chips
            multiple
            style="max-width: 300px"
          />
          <q-select
            v-model="conceptLanguage"
            :options="languages"
            :label="t('language')"
            :error="!conceptLanguage"
            emit-value
            map-options
            style="max-width: 250px"
          />
        </div>
      </q-card-section>
      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('cancel')" color="primary" @click="onCancelClick" />
        <q-btn
          flat
          :disable="loading || !conceptLanguage || hasNoFiles"
          :label="t('import')"
          color="primary"
          @click="onOkClick"
        />
      </q-card-actions>

      <q-inner-loading :showing="loading" />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { Entity, EntityType, LocalisableText, RepositoryType } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import useNotify from 'src/mixins/useNotify'
import { useEntityStore } from 'stores/entity-store'
import { languages } from 'src/config'
import { v4 as uuidv4 } from 'uuid'

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
const { notify } = useNotify()
const entityStore = useEntityStore()
const onCancelClick = onDialogCancel

const loading = ref(false)
const files = ref<null | []>(null)
const conceptLanguage = ref<string | undefined>()

const hasNoFiles = computed(() => {
  return files.value == null || files.value.length <= 0
})
const superConceptLabel = computed(() => {
  const localeTitles = props.superEntity?.titles?.filter((title) => title.lang == locale.value)
  if (localeTitles?.length == 0) {
    return props.superEntity?.titles?.at(0)
  }
  return localeTitles?.at(0)
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
    r.split(new RegExp(/\r+\n/)).forEach((line: string) => {
      if (line.trim().length != 0) entities.push(line)
    }),
  )
  return entities
}

async function onOkClick() {
  if (files.value != null) {
    let count = 0
    const filesPromises = files.value.map(async (file: File) => parseFile(file))
    await Promise.all(filesPromises).then(async (conceptArrs) => {
      for (const concepts of conceptArrs.filter((arr) => arr.length > 0)) {
        count += 1
        let entity: Entity
        if (props.superEntity != null && props.superEntity.id != null) {
          entity = entityStore.addEntity(
            EntityType.SingleConcept,
            props.superEntity.id,
          )
        } else {
          entity = { id: (uuidv4 as () => string)(), entityType: EntityType.SingleConcept }
        }
        await populateConcept(entity, concepts, conceptLanguage.value!)
      }
    }).then(() => {
      notify(t('entityImported', { count: count }), 'positive')
      onDialogOK()
    })
  }
}
</script>

<style scoped lang="scss"></style>
