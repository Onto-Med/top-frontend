<template>
  <q-page class="q-pa-md q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('home_.runQuery.header') }}
          <span v-if="repository">
            {{ t('for') }}:
            <q-breadcrumbs class="inline-block">
              <q-breadcrumbs-el :label="repository.organisation?.name" :to="{ name: 'showOrganisation', params: { organisationId: organisation?.id } }" />
              <q-breadcrumbs-el class="text-primary" :label="repository.name" :to="{ name: 'editor', params: { organisationId: organisation?.id, repositoryId: repository.id } }" />
            </q-breadcrumbs>
          </span>
        </div>
        <span class="q-pt-md">{{ t('queryBuilder.description') }}</span>
      </q-card-section>

      <q-separator />

      <q-card-section class="row q-pa-none">
        <div class="col-12 col-sm-6 col-md-7 q-pa-md">
          <q-input v-model="query.name" :label="t('queryName')" type="text" />
          <repository-select-field
            :model-value="repository"
            :label="t('repositoryContainingModel')"
            required
            @update:model-value="setRepository"
          />
          <q-select
            v-model="query.dataSources"
            :options="dataSources"
            :label="t('dataSource', 2)"
            :error-message="t('dataSourceDescription')"
            :error="query.dataSources?.length == 0"
            option-value="id"
            option-label="title"
            class="data-sources-input"
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
              @update:selected="addCriterion($event); addSelection($event)"
            >
              <template #entity-context-menu="props">
                <q-menu context-menu>
                  <q-list dense>
                    <q-item v-close-popup clickable @click="addSelection(props.entity)">
                      <q-item-section>{{ t('addAsThing', { thing: t('projectionEntry') }) }}</q-item-section>
                    </q-item>
                    <q-item v-close-popup clickable @click="addCriterion(props.entity)">
                      <q-item-section>{{ t('addAsThing', { thing: t('eligibilityCriterion') }) }}</q-item-section>
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
                  <q-list v-if="query.projection && query.projection.length" dense separator>
                    <query-subject
                      v-for="(entry, index) in query.projection"
                      :key="index"
                      v-model:default-aggregation-function-id="entry.defaultAggregationFunctionId"
                      v-model:date-time-restriction="entry.dateTimeRestriction"
                      :aggregation-function-options="aggregationFunctionOptions"
                      :down-disabled="index == query.projection.length - 1"
                      :subject-id="entry.subjectId"
                      :up-disabled="index == 0"
                      sortable
                      @move-up="moveSelectEntry(index, index - 1)"
                      @move-down="moveSelectEntry(index, index + 1)"
                      @remove="query.projection?.splice(index, 1)"
                    />
                  </q-list>
                  <div v-else class="q-pa-sm">
                    {{ t('nothingSelectedYet') }}
                  </div>
                </q-scroll-area>
              </q-card-section>
            </q-card>

            <q-card class="col-12 col-md column">
              <q-item class="col-auto">
                <q-item-section>
                  <q-item-label class="text-h6">
                    {{ t('eligibilityCriterion', 2) }}
                    <q-icon v-show="!querySubjectPresent" name="error" color="negative" class="float-right" :title="t('incomplete')" />
                  </q-item-label>
                  <q-item-label caption class="gt-sm">
                    {{ t('eligibilityCriterionSelection') }}
                  </q-item-label>
                  <q-item-label caption class="gt-sm">
                    {{ t('emptyCriteriaBehaviour') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-card-section v-if="aggregationFunctionOptions" class="col fit q-pa-none">
                <q-scroll-area class="fit q-px-sm">
                  <q-list v-if="query.criteria?.length" dense>
                    <template v-for="(criterion, index) in query.criteria" :key="index">
                      <query-subject
                        v-model:default-aggregation-function-id="criterion.defaultAggregationFunctionId"
                        v-model:date-time-restriction="criterion.dateTimeRestriction"
                        v-model:inclusion="criterion.inclusion"
                        :aggregation-function-options="aggregationFunctionOptions"
                        :subject-id="criterion.subjectId"
                        excludable
                        @remove="query.criteria?.splice(index, 1)"
                      />
                      <div v-show="index < query.criteria.length - 1" class="row no-wrap items-center">
                        <q-separator class="col" />
                        <small v-t="'and'" class="col-grow q-px-md text-grey text-uppercase non-selectable and-separator" />
                        <q-separator class="col" />
                      </div>
                    </template>
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
import { DataSource, DataType, EntityType, ExpressionFunction, Phenotype, PhenotypeQuery, QueryPage, QueryType, Repository, TypeEnum } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import QuerySubject from 'src/components/Query/QuerySubject.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntity } from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import { defineComponent, onMounted, ref, computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { v4 as uuidv4 } from 'uuid'
import { QueryApiKey } from 'src/boot/axios'
import { exportFile, useQuasar } from 'quasar'
import QueryResultsTable from 'src/components/Query/QueryResultsTable.vue'
import RepositorySelectField from 'src/components/Repository/RepositorySelectField.vue'
import Dialog from 'src/components/Dialog.vue'

export default defineComponent({
  components: {
    EntityTree,
    QuerySubject,
    QueryResultsTable,
    RepositorySelectField
  },
  setup () {
    const { t } = useI18n()
    const $q = useQuasar()
    const { isPhenotype, isRestricted, requiresAggregationFunction } = useEntityFormatter()
    const entityStore = useEntity()
    const { renderError } = useNotify()
    const { entities, repository, organisation } = storeToRefs(entityStore)

    const emptyQuery = () => {
      return {
        id: (uuidv4 as () => string)(),
        dataSources: [],
        criteria: [],
        projection: [],
        type: QueryType.Phenotype
      } as PhenotypeQuery
    }

    const query = ref(emptyQuery())
    const treeLoading = ref(false)
    const importFile = ref<File>()
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

    const prefillQuery = (oldQuery: PhenotypeQuery) => {
      query.value = JSON.parse(JSON.stringify(oldQuery)) as PhenotypeQuery
      step.value = 1
    }

    fileReader.onload = (e) => prefillQuery(JSON.parse(e.target?.result as string) as PhenotypeQuery)

    const reloadEntities = async () => {
      treeLoading.value = true
      await entityStore.reloadEntities()
        .then(() => query.value.criteria = query.value.criteria?.filter(c => entities.value.findIndex(e => e.id === c.subjectId) !== -1))
        .catch((e: Error) => renderError(e))
        .finally(() => treeLoading.value = false)
    }

    const aggregationFunctionOptions = ref([] as ExpressionFunction[])
    entityStore.getFunction('aggregate', 'Last', 'First')
      .then(r => aggregationFunctionOptions.value = r)
      .catch((e: Error) => renderError(e))

    const dataSources = ref([] as DataSource[])
    entityStore.getDataSources()
      .then(r => dataSources.value = r)
      .catch((e: Error) => renderError(e))

    const loadQueryPage = (page: number) => {
      if (queryApi && organisation.value && repository.value)
        queryApi.getQueries(organisation.value.id, repository.value.id, page)
          .then(r => queryPage.value = r.data)
          .catch((e: Error) => renderError(e))
    }

    onMounted(() => {
      if (!organisation.value || !repository.value) return
      reloadEntities().catch((e: Error) => renderError(e))
      loadQueryPage(1)
    })

    watch(
      splitterModel,
      (newVal) => $q.localStorage.set('editorSplitterWidth', newVal)
    )

    const reset = (repository?: Repository) => {
      entityStore.setRepository(repository)
      void loadQueryPage(1)
      void reloadEntities().then(() => {
        query.value = emptyQuery()
      })
    }

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
        query.value.criteria && query.value.criteria.length > 0
        || query.value.projection && query.value.projection.length > 0
      ),

      addCriterion: (subject: Phenotype) => {
        if (!subject || subject.dataType !== DataType.Boolean && !isRestricted(subject)) return
        if (!query.value.criteria) query.value.criteria = []
        query.value.criteria.push({
          defaultAggregationFunctionId: requiresAggregationFunction(subject) ? 'Last' : undefined,
          inclusion: true,
          subjectId: subject.id as string,
          type: TypeEnum.QueryCriterion
        })
      },

      addSelection: (subject: Phenotype) => {
        if (!query.value.projection) query.value.projection = []
        if (
          !subject
          || !isPhenotype(subject) && !isRestricted(subject)
        ) return
        query.value.projection.push({
          subjectId: subject.id as string,
          defaultAggregationFunctionId: requiresAggregationFunction(subject) ? 'Last' : undefined,
          type: TypeEnum.ProjectionEntry
        })
      },

      moveSelectEntry: (oldIndex: number, newIndex: number) => {
        if (!query.value.projection || newIndex < 0 || newIndex >= query.value.projection.length) return
        query.value.projection.splice(newIndex, 0, query.value.projection.splice(oldIndex, 1)[0])
      },

      execute: () => {
        if (!queryApi || !organisation.value || !repository.value) return
        const currentQuery = JSON.parse(JSON.stringify(query.value)) as PhenotypeQuery
        currentQuery.id = (uuidv4 as () => string)()

        queryApi.enqueueQuery(organisation.value.id, repository.value.id, currentQuery)
          .then(() => queryPage.value.content.unshift(currentQuery))
          .catch((e: Error) => renderError(e))
      },

      exportQuery: () =>
        exportFile(
          new Date().toISOString() + '_' + (query.value.name || 'top_query') + '.json',
          JSON.stringify(query.value)),

      importQuery: () => {
        if (!importFile.value) return
        fileReader.readAsText(importFile.value)
        importFile.value = undefined
      },

      deleteQuery: (query: PhenotypeQuery) => {
        if (!queryApi || !organisation.value || !repository.value) return

        queryApi?.deleteQuery(organisation.value.id, repository.value.id, query.id)
          .catch((e: Error) => renderError(e))
          .finally(() => {
            const index = queryPage.value.content.findIndex(q => q.id === query.id)
            if (index !== -1) queryPage.value.content.splice(index, 1)
          })
      },

      setRepository (repo?: Repository) {
        if (repo !== repository.value && (query.value.criteria?.length || query.value.projection?.length)) {
          $q.dialog({
            component: Dialog,
            componentProps: {
              message: t('confirmClearQuery')
            }
          }).onOk(() => reset(repo))
        } else {
          reset(repo)
        }
      }
    }
  }
})
</script>

<style lang="sass">
.and-separator
  height: 0px
  margin-top: -16px
.data-sources-input .q-field__native
  min-height: 37px !important
</style>
