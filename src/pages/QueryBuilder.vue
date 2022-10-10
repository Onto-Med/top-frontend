<template>
  <q-page v-if="organisation && repository" class="q-pa-md q-gutter-md">
    <h5 class="row">
      <b>{{ t('buildQueryFor') }}:</b>
      <q-breadcrumbs class="q-ml-sm">
        <q-breadcrumbs-el :label="organisation.name" :to="{ name: 'showOrganisation', params: { organisationId: organisation.id } }" />
        <q-breadcrumbs-el :label="repository.name" :to="{ name: 'editor', params: { organisationId: organisation.id, repositoryId: repository.id } }" />
      </q-breadcrumbs>
    </h5>

    <q-stepper
      ref="stepper"
      v-model="step"
      color="primary"
      done-color="secondary"
      animated
      header-nav
      keep-alive
    >
      <q-step
        :name="1"
        icon="settings"
        :title="t('configureThing', { thing: t('source', 2) })"
        :error="!configurationComplete && step > 1"
        :done="configurationComplete"
      >
        <div class="row q-gutter-md">
          <div class="col-7">
            <q-input v-model="query.name" :label="t('queryName')" type="text" />
            <q-select
              v-model="query.dataSources"
              :options="dataSources"
              :label="t('dataSource', 2)"
              :error-message="t('dataSourceDescription')"
              :error="query.dataSources?.length == 0"
              option-label="title"
              multiple
              counter
              use-chips
            />
          </div>

          <q-separator vertical />

          <div class="col">
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
        </div>
      </q-step>

      <q-step
        :name="2"
        icon="rule"
        :title="t('selectThing', { thing: t('criterion', 2) })"
        :error="!criteriaComplete && step > 2"
        :done="criteriaComplete"
        class="phenotype-step"
      >
        <q-splitter v-model="splitterModel" style="height: 50vh">
          <template #before>
            <div class="column fit">
              <entity-tree
                :nodes="entities"
                :loading="treeLoading"
                class="col column"
                :exclude-type-if-empty="[EntityType.Category]"
                @refresh-clicked="reloadEntities"
                @update:selected="addCriterion"
              />
            </div>
          </template>

          <template #after>
            <q-card class="q-ma-lg">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-h6">
                    {{ t('eligibilityCriterion', 2) }}
                  </q-item-label>
                  <q-item-label v-t="'eligibilityCriterionSelection'" caption />
                </q-item-section>
              </q-item>

              <q-separator />

              <q-card-section v-if="aggregationFunctionOptions">
                <div v-show="!query.criteria.length">
                  {{ t('nothingSelectedYet') }}
                </div>
                <q-list v-show="query.criteria.length" dense>
                  <template v-for="(criterion, index) in query.criteria" :key="index">
                    <criterion
                      v-model:inclusion="criterion.inclusion"
                      v-model:date-time-restriction="criterion.dateTimeRestriction"
                      v-model:default-aggregation-function-id="criterion.defaultAggregationFunctionId"
                      :aggregation-function-options="aggregationFunctionOptions"
                      :subject-id="criterion.subjectId"
                      @remove-clicked="query.criteria.splice(index, 1)"
                    />
                    <div v-show="index < query.criteria.length - 1" class="row no-wrap items-center">
                      <q-separator class="col" />
                      <small v-t="'and'" class="col-grow q-px-md text-grey text-uppercase non-selectable" />
                      <q-separator class="col" />
                    </div>
                  </template>
                </q-list>
              </q-card-section>
            </q-card>
          </template>
        </q-splitter>
      </q-step>

      <q-step
        :name="3"
        icon="checklist"
        :title="t('defineThing', { thing: t('resultSet') })"
        :error="!projectionComplete && step > 3"
        :done="projectionComplete"
        class="projection-step"
      >
        <q-splitter v-model="splitterModel" style="height: 50vh">
          <template #before>
            <div class="column fit">
              <entity-tree
                :nodes="entities"
                :loading="treeLoading"
                :exclude-type-if-empty="[EntityType.Category]"
                class="col column"
                @refresh-clicked="reloadEntities"
                @update:selected="addSelection"
              />
            </div>
          </template>

          <template #after>
            <q-card class="q-ma-lg">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-h6">
                    {{ t('projection') }}
                  </q-item-label>
                  <q-item-label v-t="'projectionSelection'" caption />
                </q-item-section>
              </q-item>

              <q-separator />

              <q-card-section>
                <q-list v-if="query.projection && query.projection.length" dense separator>
                  <projection-entry
                    v-for="(entry, index) in query.projection"
                    :key="index"
                    v-model:sorting="entry.sorting"
                    :subject-id="entry.subjectId"
                    :up-disabled="index == 0"
                    :down-disabled="index == query.projection.length - 1"
                    @move-up="moveSelectEntry(index, index - 1)"
                    @move-down="moveSelectEntry(index, index + 1)"
                    @remove="query.projection.splice(index, 1)"
                  />
                </q-list>
                <div v-else>
                  {{ t('nothingSelectedYet') }}
                </div>
              </q-card-section>
            </q-card>
          </template>
        </q-splitter>
      </q-step>

      <q-step
        :name="4"
        icon="flag"
        :title="t('closure')"
      >
        <q-list>
          <q-item>
            <q-item-section top avatar class="col-2">
              <q-btn
                icon="save"
                color="primary"
                :label="t('export')"
                @click="exportQuery"
              />
            </q-item-section>
            <q-item-section v-t="'queryExportDescription'" />
          </q-item>
          <q-item>
            <q-item-section top avatar class="col-2">
              <q-btn
                v-if="configurationComplete && criteriaComplete && projectionComplete"
                icon="play_arrow"
                color="secondary"
                :label="t('execute')"
                @click="execute()"
              />
              <q-btn
                v-else
                icon="play_arrow"
                color="secondary"
                :label="t('execute')"
                :title="t('finishPreviousStep', 2)"
                disable
              />
            </q-item-section>
            <q-item-section v-t="'queryExecuteDescription'" />
          </q-item>
        </q-list>
      </q-step>

      <template #navigation>
        <q-separator class="q-mb-md" />
        <q-stepper-navigation>
          <q-btn v-show="step < 4" color="primary" :label="t('continue')" @click="$refs.stepper.next()" />
          <q-btn
            v-show="step > 1"
            flat
            color="primary"
            :label="t('back')"
            class="q-ml-sm"
            @click="$refs.stepper.previous()"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>

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
import { DataSource, EntityType, ExpressionFunction, Phenotype, Query, QueryResult, Sorting } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import Criterion from 'src/components/Query/Criterion.vue'
import ProjectionEntry from 'src/components/Query/ProjectionEntry.vue'
import QueryResultView from 'src/components/Query/QueryResult.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntity } from 'src/pinia/entity'
import useAlert from 'src/mixins/useAlert'
import { defineComponent, onMounted, ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import useFile from 'src/mixins/useFile'
import { v4 as uuidv4 } from 'uuid'
import { QueryApiKey } from 'src/boot/axios'

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
    const { alert } = useAlert()
    const { saveToFile } = useFile()
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
        .catch((e: Error) => alert(e.message))
        .finally(() => treeLoading.value = false)
    }

    const aggregationFunctionOptions = ref([] as ExpressionFunction[])
    entityStore.getFunction('math', 'last', 'first')
      .then(r => aggregationFunctionOptions.value = r)
      .catch((e: Error) => alert(e.message))

    const dataSources = ref([] as DataSource[])
    entityStore.getDataSources()
      .then(r => dataSources.value = r)
      .catch((e: Error) => alert(e.message))

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
          alert(e.message)
        })
    }

    onMounted(() => {
      reloadEntities().catch((e: Error) => alert(e.message))
      if (queryApi && organisation.value && repository.value)
        queryApi.getQueries(organisation.value.id, repository.value.id)
          .then(r => r.data.forEach(q => {
            const run = { query: q } as Run
            void updateRun(run).then(() => {
              if (!run.result) run.timer = buildQueryRunTimer(run)
              runs.value.push(run)
            })
          }))
          .catch((e: Error) => alert(e.message))
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
      criteriaComplete: computed(() =>
        query.value.criteria && query.value.criteria.length > 0
      ),

      projectionComplete: computed(() =>
        query.value.projection && query.value.projection.length > 0
      ),

      addCriterion: (subject: Phenotype) => {
        if (!subject || !isPhenotype(subject) && !isRestricted(subject)) return
        if (!query.value.criteria) query.value.criteria = []
        query.value.criteria.push({
          defaultAggregationFunctionId: 'last',
          inclusion: true,
          subjectId: subject.id as string
        })
      },

      addSelection: (subject: Phenotype) => {
        if (!query.value.projection) query.value.projection = []
        if (
          !subject
          || ![EntityType.CompositePhenotype, EntityType.SinglePhenotype].includes(subject.entityType)
          || query.value.projection.findIndex(r => r.subjectId === subject.id) !== -1
        ) return
        query.value.projection.push({ subjectId: subject.id as string, sorting: Sorting.Asc })
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
          .catch((e: Error) => alert(e.message))
      },

      exportQuery: () => {
        saveToFile(JSON.stringify(query.value), new Date().toISOString() + '_' + (query.value.name || 'top_query') + '.json')
      },

      importQuery: () => {
        if (!importFile.value) return
        fileReader.readAsText(importFile.value)
        importFile.value = undefined
      },

      removeRun: (queryId: string) => {
        if (!queryApi || !organisation.value || !repository.value) return

        queryApi?.deleteQuery(organisation.value.id, repository.value.id, queryId)
          .catch((e: Error) => alert(e.message))
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
</style>
