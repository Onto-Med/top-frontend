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
                :label="t('import')"
                @click="importQuery"
              />
            </template>
          </q-file>
        </div>
      </q-card-section>

      <q-separator />

      <q-splitter v-model="splitterModel" style="height: 50vh">
        <template #before>
          <div class="column fit">
            <entity-tree
              :nodes="entities"
              :loading="treeLoading"
              class="col column"
              @refresh-clicked="reloadEntities"
              @update:selected="addCriterion($event)"
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
                  <q-item-label v-t="'projectionSelection'" caption />
                  <q-item-label v-t="'emptyProjectionBehaviour'" caption />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-card-section class="col fit q-pa-none">
                <q-scroll-area class="fit q-px-sm">
                  <q-list v-if="query.projection && query.projection.length" dense separator>
                    <projection-entry
                      v-for="(entry, index) in query.projection"
                      :key="index"
                      v-model:default-aggregation-function-id="entry.defaultAggregationFunctionId"
                      v-model:date-time-restriction="entry.dateTimeRestriction"
                      :aggregation-function-options="aggregationFunctionOptions"
                      :down-disabled="index == query.projection.length - 1"
                      :subject-id="entry.subjectId"
                      :up-disabled="index == 0"
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
                  <q-item-label v-t="'eligibilityCriterionSelection'" caption />
                  <q-item-label v-t="'emptyCriteriaBehaviour'" caption />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-card-section v-if="aggregationFunctionOptions" class="col fit q-pa-none">
                <q-scroll-area class="fit q-px-sm">
                  <q-list v-if="query.criteria?.length" dense>
                    <template v-for="(criterion, index) in query.criteria" :key="index">
                      <criterion
                        v-model:inclusion="criterion.inclusion"
                        v-model:date-time-restriction="criterion.dateTimeRestriction"
                        v-model:default-aggregation-function-id="criterion.defaultAggregationFunctionId"
                        :aggregation-function-options="aggregationFunctionOptions"
                        :subject-id="criterion.subjectId"
                        @remove-clicked="query.criteria?.splice(index, 1)"
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

    <query-result-view
      v-for="run in runs.slice().reverse()"
      :key="run.query.id"
      show-timer
      :result="run.result"
      :title="run.query.name"
      @remove="removeRun(run.query.id)"
      @prefill="prefillQuery(run.query)"
    />
  </q-page>
</template>

<script lang="ts">
import { DataSource, EntityType, ExpressionFunction, Phenotype, Query, QueryResult, TypeEnum } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import Criterion from 'src/components/Query/Criterion.vue'
import ProjectionEntry from 'src/components/Query/ProjectionEntry.vue'
import QueryResultView from 'src/components/Query/QueryResult.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntity } from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import { defineComponent, onMounted, ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { v4 as uuidv4 } from 'uuid'
import { QueryApiKey } from 'src/boot/axios'
import { exportFile } from 'quasar'

interface Run {
  query: Query,
  result?: QueryResult,
  timer?: number
}

export default defineComponent({
  components: { EntityTree, Criterion, QueryResultView, ProjectionEntry },
  setup () {
    const { t } = useI18n()
    const { isPhenotype, isRestricted } = useEntityFormatter()
    const entityStore = useEntity()
    const { renderError } = useNotify()
    const { entities, repository, organisation } = storeToRefs(entityStore)
    const query = ref({
      id: (uuidv4 as () => string)(),
      dataSources: [],
      criteria: [],
      projection: []
    } as Query)
    const treeLoading = ref(false)
    const runs = ref([] as Run[])
    const importFile = ref(undefined as Blob|undefined)
    const fileReader = new FileReader()
    const queryApi = inject(QueryApiKey)
    const step = ref(1)

    const prefillQuery = (oldQuery: Query) => {
      query.value = JSON.parse(JSON.stringify(oldQuery)) as Query
      step.value = 1
    }

    fileReader.onload = (e) => prefillQuery(JSON.parse(e.target?.result as string) as Query)

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

    const getRunIndex = (queryId: string) => runs.value.findIndex(r => r.query.id === queryId)

    const buildQueryRunTimer = (run: Run) =>
      window.setInterval(() => {
        void updateRun(run).then(() => {
          if (run.result?.finishedAt) clearInterval(run.timer)
        })
      }, 5000)

    const updateRun = async (run: Run) => {
      if (!queryApi || !organisation.value?.id || !repository.value?.id || run.result?.finishedAt)
        return new Promise<void>(resolve => resolve())
      return queryApi.getQueryResult(organisation.value.id, repository.value.id, run.query.id)
        .then(r => run.result = r.data)
        .catch((e: Error) => {
          clearInterval(run.timer)
          renderError(e)
        })
    }

    onMounted(() => {
      reloadEntities().catch((e: Error) => renderError(e))
      if (queryApi && organisation.value && repository.value)
        queryApi.getQueries(organisation.value.id, repository.value.id)
          .then(r => r.data.content.forEach(q => {
            const run = { query: q } as Run
            void updateRun(run).then(() => {
              if (!run.result) run.timer = buildQueryRunTimer(run)
              runs.value.push(run)
            })
          }))
          .catch((e: Error) => renderError(e))
    })

    return {
      t,
      EntityType,
      step,
      query,
      organisation,
      repository,
      entities,
      runs,
      splitterModel: ref(25),
      reloadEntities,
      treeLoading,
      dataSources,
      importFile,
      aggregationFunctionOptions,
      prefillQuery,

      configurationComplete: computed(() =>
        query.value.dataSources && query.value.dataSources.length > 0
      ),

      querySubjectPresent: computed(() => 
        query.value.criteria && query.value.criteria.length > 0
        || query.value.projection && query.value.projection.length > 0
      ),

      addCriterion: (subject: Phenotype) => {
        if (!subject || !isPhenotype(subject) && !isRestricted(subject)) return
        if (!query.value.criteria) query.value.criteria = []
        query.value.criteria.push({
          defaultAggregationFunctionId: 'Last',
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
          defaultAggregationFunctionId: 'Last',
          type: TypeEnum.ProjectionEntry
        })
      },

      moveSelectEntry: (oldIndex: number, newIndex: number) => {
        if (!query.value.projection || newIndex < 0 || newIndex >= query.value.projection.length) return
        query.value.projection.splice(newIndex, 0, query.value.projection.splice(oldIndex, 1)[0])
      },

      execute: () => {
        if (!queryApi || !organisation.value || !repository.value) return
        const currentQuery = JSON.parse(JSON.stringify(query.value)) as Query
        currentQuery.id = (uuidv4 as () => string)()
        runs.value.push({ query: currentQuery })

        queryApi.enqueueQuery(organisation.value.id, repository.value.id, currentQuery)
          .then(r => {
            const index = getRunIndex(r.data.id)
            runs.value[index].result = r.data
            runs.value[index].timer = buildQueryRunTimer(runs.value[index])
          })
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

      removeRun: (queryId: string) => {
        if (!queryApi || !organisation.value || !repository.value) return

        queryApi?.deleteQuery(organisation.value.id, repository.value.id, queryId)
          .catch((e: Error) => renderError(e))
          .finally(() => {
            const index = getRunIndex(queryId)
            if (index !== -1) runs.value.splice(index, 1)
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
