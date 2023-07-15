<template>
  <q-page v-if="organisation && repository" class="q-pa-md q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6 row">
          <b>{{ t('buildQueryFor') }}:</b>
          <q-breadcrumbs class="q-ml-sm">
            <q-breadcrumbs-el :label="organisation.name" :to="{ name: 'showOrganisation', params: { organisationId: organisation.id } }" />
            <q-breadcrumbs-el class="text-primary" :label="repository.name" :to="{ name: 'editor', params: { organisationId: organisation.id, repositoryId: repository.id } }" />
          </q-breadcrumbs>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="row q-pa-none">
        <div class="col-12 col-sm-6 col-md-7 q-pa-md">
          <q-input v-model="query.name" :label="t('queryName')" type="text" />
          <q-select
            v-model="query.dataSources"
            :options="dataSources"
            :label="t('dataSource', 2)"
            :error-message="t('dataSourceDescription')"
            :error="query.dataSources?.length == 0"
            option-value="id"
            option-label="title"
            multiple
            counter
            use-chips
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

      <q-splitter v-model="splitterModel" style="height: 50vh" :limits="[15, 50]">
        <template #before>
          <div class="column fit">
            <entity-tree
              :nodes="entities"
              :loading="treeLoading"
              class="col column full-width"
              @refresh-clicked="reloadEntities"
              @update:selected="addSelection($event)"
            >
              <template #entity-context-menu="props">
                <q-menu context-menu>
                  <q-list dense>
                    <q-item v-close-popup clickable @click="addSelection(props.entity)">
                      <q-item-section>{{ t('addAsThing', { thing: t('projectionEntry') }) }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </template>
            </entity-tree>
          </div>
        </template>

        <template #after>
          <div class="row q-gutter-md q-pt-md q-pl-md fit">
            <q-card class="col-12 col-md column">
              <q-item class="col-auto">
                <q-item-section>
                  <q-item-label class="text-h6">
                    {{ t('projection') }}
                    <q-icon v-show="!querySubjectPresent" name="error" color="negative" class="float-right" :title="t('incomplete')" />
                  </q-item-label>
                  <q-item-label caption class="gt-sm">
                    {{ t('projectionSelection') }}
                  </q-item-label>
                  <q-item-label caption class="gt-sm">
                    {{ t('emptyProjectionBehaviour') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-card-section class="col fit q-pa-none">
                <q-scroll-area class="fit q-px-sm">
                  <q-list v-if="query.entityId && query.entityId.length" dense separator>
                    <query-subject
                      :key="query.entityId"
                      v-model:date-time-restriction="query.dateTimeRestriction"
                      :subject-id="query.entityId"
                      :aggregation-function-options="aggregationFunctionOptions"
                      sortable
                    />
                  </q-list>
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
          :disable="!(configurationComplete && querySubjectPresent)"
          @click="execute()"
        />
        <q-btn
          icon="save"
          color="primary"
          :label="t('export')"
          :title="t('queryExportDescription')"
          @click="exportQuery"
        />
      </q-card-actions>
    </q-card>

    <query-results-table
      :page="queryPage"
      @delete="deleteQuery"
      @prefill="prefillQuery"
      @request="loadQueryPage($event)"
    />
  </q-page>
</template>

<script lang="ts">
import {
  Concept,
  ConceptQuery,
  DataSource,
  EntityType,
  ExpressionFunction,
  QueryPage,
  QueryType,
} from '@onto-med/top-api'
import {storeToRefs} from 'pinia'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import QuerySubject from 'src/components/Query/QuerySubject.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import {useEntity} from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import {computed, defineComponent, inject, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {v4 as uuidv4} from 'uuid'
import {QueryApiKey} from 'src/boot/axios'
import {exportFile, useQuasar} from 'quasar'
import QueryResultsTable from 'src/components/Query/QueryResultsTable.vue'

export default defineComponent({
  components: { QueryResultsTable, EntityTree, QuerySubject },
  setup () {
    const { t } = useI18n()
    const $q = useQuasar()
    const { isConcept } = useEntityFormatter()
    const entityStore = useEntity()
    const { renderError } = useNotify()
    const { entities, repository, organisation } = storeToRefs(entityStore)
    const query = ref({
      id: (uuidv4 as () => string)(),
      entityId: '',
      dataSources: [],
      language: 'de',
      type: QueryType.Concept
    } as ConceptQuery)
    const treeLoading = ref(false)
    const importFile = ref(undefined as Blob|undefined)
    const fileReader = new FileReader()
    const queryApi = inject(QueryApiKey)
    const step = ref(1)
    const queryPage = ref<QueryPage>({
      content: [],
      number: 1,
      size: 0,
      totalElements: 0,
      totalPages: 0,
      type: 'query'
    })

    const splitterModel = ref<number>($q.localStorage.getItem('phenotypeQuerySplitterWidth') || 25)

    const prefillQuery = (oldQuery: ConceptQuery) => {
      query.value = JSON.parse(JSON.stringify(oldQuery)) as ConceptQuery
      step.value = 1
    }

    fileReader.onload = (e) => prefillQuery(JSON.parse(e.target?.result as string) as ConceptQuery)

    const reloadEntities = async () => {
      treeLoading.value = true
      await entityStore.reloadEntities()
        // .then(() => query.value.criteria = query.value.criteria?.filter(c => entities.value.findIndex(e => e.id === c.subjectId) !== -1))
        .catch((e: Error) => renderError(e))
        .finally(() => treeLoading.value = false)
    }

    const aggregationFunctionOptions = ref([] as ExpressionFunction[])
    entityStore.getFunction('aggregate', 'Last', 'First')
      .then(r => aggregationFunctionOptions.value = r)
      .catch((e: Error) => renderError(e))

    const dataSources = ref([] as DataSource[])
    entityStore.getDataSources(QueryType.Concept)
      .then(r => dataSources.value = r)
      .catch((e: Error) => renderError(e))

    const loadQueryPage = (page: number) => {
      if (queryApi && organisation.value && repository.value)
        queryApi.getQueries(organisation.value.id, repository.value.id, page)
          .then(r => queryPage.value = r.data)
          .catch((e: Error) => renderError(e))
    }

    onMounted(() => {
      reloadEntities().catch((e: Error) => renderError(e))
      loadQueryPage(1)
    })

    watch(
      splitterModel,
      (newVal) => $q.localStorage.set('editorSplitterWidth', newVal)
    )

    return {
      t,
      EntityType,
      step,
      query,
      organisation,
      repository,
      entities,
      splitterModel,
      reloadEntities,
      treeLoading,
      dataSources,
      importFile,
      aggregationFunctionOptions,
      prefillQuery,
      queryPage,
      loadQueryPage,

      configurationComplete: computed(() =>
        query.value.dataSources && query.value.dataSources.length > 0
      ),

      querySubjectPresent: computed(() =>
        query.value.entityId.length > 0
      ),

      addSelection: (subject: Concept) => {
        if (
          !subject || !isConcept(subject) || !subject.id
        ) return
        query.value.entityId = subject.id
      },

      // moveSelectEntry: (oldIndex: number, newIndex: number) => {
      //   if (!query.value.projection || newIndex < 0 || newIndex >= query.value.projection.length) return
      //   query.value.projection.splice(newIndex, 0, query.value.projection.splice(oldIndex, 1)[0])
      // },

      execute: () => {
        if (!queryApi || !organisation.value || !repository.value) return
        const currentQuery = JSON.parse(JSON.stringify(query.value)) as ConceptQuery
        currentQuery.id = (uuidv4 as () => string)()

        queryApi.enqueueQuery(organisation.value.id, repository.value.id, currentQuery)
          .then(() => queryPage.value.content.unshift(currentQuery))
          .catch((e: Error) => renderError(e))
      },

      exportQuery: () =>
        exportFile(
          new Date().toISOString() + '_documentQuery_' + (query.value.name || 'top_query') + '.json',
          JSON.stringify(query.value)),

      importQuery: () => {
        if (!importFile.value) return
        fileReader.readAsText(importFile.value)
        importFile.value = undefined
      },

      deleteQuery: (query: ConceptQuery) => {
        if (!queryApi || !organisation.value || !repository.value) return

        queryApi?.deleteQuery(organisation.value.id, repository.value.id, query.id)
          .catch((e: Error) => renderError(e))
          .finally(() => {
            const index = queryPage.value.content.findIndex(q => q.id === query.id)
            if (index !== -1) queryPage.value.content.splice(index, 1)
          })
      }
    }
  }
})
</script>

<style lang="sass">
.phenotype-step, .projection-step
  min-height: 200px
  .q-stepper__step-inner
    padding: 0 !important
.and-separator
  height: 0px
  margin-top: -16px
</style>
