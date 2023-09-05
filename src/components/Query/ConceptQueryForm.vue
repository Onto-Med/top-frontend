<template>
  <q-card-section class="row q-pa-none">
    <div class="col-12 col-sm-6 col-md-7 q-pa-md">
      <q-input v-model="name" :label="t('queryName')" type="text" />
      <q-select
        v-model="language"
        :options="languageOptions"
        :label="t('language')"
        :error="!language"
        emit-value
        map-options
        hide-bottom-space
      />
      <q-select
        v-model="dataSource"
        :options="dataSources"
        :label="t('dataSource', 2)"
        :error-message="t('dataSourceDescription')"
        :error="!dataSource"
        option-value="id"
        option-label="title"
        emit-value
        map-options
      />
    </div>

    <q-separator vertical class="gt-xs" />

    <div class="col-12 col-sm q-pa-md">
      <p v-t="'queryImportDescription'" />
      <q-file
        v-model="importFile"
        :label="t('queryImportFile')"
        accept=".json"
      >
        <template #prepend>
          <q-icon name="attach_file" />
        </template>
        <template #after>
          <q-btn
            color="primary"
            icon="file_upload"
            :disabled="!importFile"
            :label="$q.screen.gt.sm ? t('import') : ''"
            @click="importQuery"
          />
        </template>
      </q-file>
    </div>
  </q-card-section>

  <q-separator />

  <q-splitter v-model="splitterModel" style="height: 50vh" :limits="[15, 60]">
    <template #before>
      <div class="column fit">
        <entity-tree
          v-model:selected="entity"
          :nodes="entities"
          :loading="treeLoading"
          show-context-menu
          :createable="false"
          :deletable="false"
          :duplicatable="false"
          class="col column full-width"
          @refresh-clicked="reloadEntities"
        />
      </div>
    </template>

    <template #after>
      <div class="row q-gutter-md q-pt-md q-pl-md fit">
        <q-card class="col-12 col-md column">
          <q-item class="col-auto">
            <q-item-section>
              <q-item-label class="text-h6">
                {{ t('conceptEntity') }}
                <q-icon v-show="!entity" name="error" color="negative" class="float-right" :title="t('incomplete')" />
              </q-item-label>
              <q-item-label caption class="gt-sm">
                {{ t('conceptEntitySelection') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-card-section class="col fit q-pa-none">
            <q-scroll-area class="fit">
              <entity-display
                v-if="entity"
                :entity="entity"
                show-descriptions
                show-entity-type
                show-expression
                show-repository
                show-synonyms
                class="q-pt-sm"
                @entity-clicked="entity = entityStore.getEntity($event)"
              />
              <div v-else class="q-pa-sm">
                {{ t('nothingSelectedYet') }}
              </div>
            </q-scroll-area>
          </q-card-section>
        </q-card>
      </div>
    </template>
  </q-splitter>
  <q-separator />

  <q-card-actions>
    <q-btn
      icon="play_arrow"
      color="secondary"
      :label="t('execute')"
      :title="t('queryExecuteDescription')"
      :disable="!configurationComplete"
      @click="onExecute"
    />
    <q-btn
      icon="save"
      color="primary"
      :label="t('export')"
      :title="t('queryExportDescription')"
      @click="exportQuery"
    />
  </q-card-actions>
</template>

<script setup lang="ts">
import { CompositeConcept, ConceptQuery, DataSource, QueryType, SingleConcept } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import { useEntity } from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import { computed, onMounted, ref, watch} from 'vue'
import { useI18n } from 'vue-i18n'
import { v4 as uuidv4 } from 'uuid'
import { exportFile, useQuasar } from 'quasar'
import EntityDisplay from '../EntityEditor/EntityDisplay.vue'
import { languages } from 'src/config'

const emit = defineEmits(['execute'])
const { t } = useI18n()
const $q = useQuasar()
const entityStore = useEntity()
const { renderError } = useNotify()
const { entities, repository, organisation } = storeToRefs(entityStore)

const name = ref<string>()
const dataSource = ref<string>()
const entity = ref<SingleConcept|CompositeConcept>()
const allString = 'all'
const language = ref<string|undefined>(allString)

const languageOptions = computed(
  () => languages.concat({ value: allString, label: t('allLanguages', 2) })
)

const treeLoading = ref(false)
const importFile = ref(undefined as File|undefined)
const fileReader = new FileReader()

const splitterModel = ref<number>($q.localStorage.getItem('conceptQuerySplitterWidth') || 35)

function prefillQuery (query: ConceptQuery) {
  entity.value = entityStore.getEntity(query.entityId)
  language.value = query.language
}

fileReader.onload = (e) => prefillQuery(JSON.parse(e.target?.result as string) as ConceptQuery)

async function reloadEntities () {
  treeLoading.value = true
  await entityStore.reloadEntities()
    .then(() => {
      if (entities.value.findIndex(e => e.id === entity.value?.id) === -1)
        entity.value = undefined
    })
    .catch((e: Error) => renderError(e))
    .finally(() => treeLoading.value = false)
}

const dataSources = ref([] as DataSource[])
entityStore.getDataSources(QueryType.Concept)
  .then(r => dataSources.value = r)
  .catch((e: Error) => renderError(e))

onMounted(() => {
  if (!organisation.value || !repository.value) return
  reloadEntities().catch((e: Error) => renderError(e))
})

watch(
  splitterModel,
  (newVal) => $q.localStorage.set('conceptQuerySplitterWidth', newVal)
)

const configurationComplete = computed(() =>
  dataSource.value
    && language.value
    && entity.value
)

const query = computed(() => {
  return {
    id: (uuidv4 as () => string)(),
    name: name.value,
    dataSource: dataSource.value,
    entityId: entity.value?.id,
    language: language.value,
    type: QueryType.Concept
  } as ConceptQuery
})

function exportQuery () {
  exportFile(
    new Date().toISOString() + '_documentQuery_' + (name.value || 'top_query') + '.json',
    JSON.stringify(query.value))
}

function importQuery () {
  if (!importFile.value) return
  fileReader.readAsText(importFile.value)
  importFile.value = undefined
}

function onExecute () {
  emit('execute', JSON.parse(
    JSON.stringify(
      query.value,
      (key, value: string) => (key === 'language' && value === allString) ? undefined : value)
  ) as ConceptQuery)
}

function reset () {
  name.value = undefined
  dataSource.value = undefined
  entity.value = undefined
  language.value = allString
  reloadEntities().catch((e: Error) => renderError(e))
}

defineExpose({
  prefillQuery,
  reset
})
</script>
