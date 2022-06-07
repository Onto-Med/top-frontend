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
              v-model="query.configuration.sources"
              :options="sources"
              :label="t('dataSource', 2)"
              :error-message="t('dataSourceDescription')"
              :error="query.configuration.sources.length == 0"
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
                :exclude-type-if-empty="[EntityType.Category, EntityType.CombinedPhenotype]"
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

              <q-card-section>
                <div v-show="!query.criteria.length">
                  {{ t('nothingSelectedYet') }}
                </div>
                <q-list v-show="query.criteria.length" dense>
                  <template v-for="(criterion, index) in query.criteria" :key="index">
                    <q-item>
                      <q-item-section avatar>
                        <q-toggle v-model="criterion.exclusion" :icon="criterion.exclusion ? 'block' : 'check'" color="red" :title="criterion.exclusion ? t('exclusion') : t('inclusion')" />
                      </q-item-section>
                      <q-item-section :title="getSynonyms(criterion.subject)">
                        <div class="row items-center fit non-selectable">
                          <q-icon size="1.3rem" class="q-mr-sm" :class="{ restriction: isRestricted(criterion.subject) }" :name="getIcon(criterion.subject)" />
                          {{ getTitle(criterion.subject) }}
                        </div>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn-group flat>
                          <!-- <q-btn icon="settings" :title="t('setting', 2)" /> -->
                          <q-btn icon="remove" :title="t('removeThing', { thing: t('criterion') })" @click="query.criteria.splice(index, 1)" />
                        </q-btn-group>
                      </q-item-section>
                    </q-item>
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
                :nodes="projectionEntities"
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
                <q-list v-if="query.projection && query.projection.select.length" dense separator>
                  <q-item v-for="(select, index) in query.projection.select" :key="index">
                    <q-item-section avatar>
                      <q-btn-group flat class="column">
                        <q-btn
                          dense
                          :disable="index == 0"
                          icon="keyboard_arrow_up"
                          size="sm"
                          class="q-pa-none"
                          @click="moveSelectEntry(index, index - 1)"
                        />
                        <q-btn
                          dense
                          :disable="index == query.projection.select.length - 1"
                          icon="keyboard_arrow_down"
                          size="sm"
                          class="q-pa-none"
                          @click="moveSelectEntry(index, index + 1)"
                        />
                      </q-btn-group>
                    </q-item-section>
                    <q-item-section :title="getSynonyms(select.subject)">
                      <div class="row items-center fit non-selectable">
                        <q-icon size="1.3rem" class="q-mr-sm" :name="getIcon(select.subject)" />
                        {{ getTitle(select.subject) }}
                      </div>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn-group flat>
                        <q-btn
                          :icon="select.sorting === Sorting.Desc ? 'arrow_downward' : 'arrow_upward'"
                          :label="t(select.sorting)"
                          :title="t('sorting')"
                          @click="select.sorting = select.sorting === Sorting.Asc ? Sorting.Desc : Sorting.Asc"
                        />
                        <q-btn icon="remove" :title="t('removeThing', { thing: t('selection') })" @click="query.projection.select.splice(index, 1)" />
                      </q-btn-group>
                    </q-item-section>
                  </q-item>
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
                :disable="running"
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

    <query-result
      v-for="run in runs.slice().reverse()"
      :key="run.id"
      show-timer
      :running="run.running"
      :result="run.result"
      :label="t('queryResult') + ' #' + run.id"
      :title="run.title"
      @remove-clicked="removeRun(run.id)"
    />
  </q-page>
</template>

<script lang="ts">
import { EntityType, Phenotype, Query, Sorting } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import QueryResult from 'src/components/Query/QueryResult.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntity } from 'src/pinia/entity'
import { defineComponent, onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import useFile from 'src/mixins/useFile'

interface QueryResult {
  message: string
}

interface Run {
  id: number,
  title?: string,
  running: boolean,
  result?: QueryResult
}

export default defineComponent({
  components: { EntityTree, QueryResult },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const { getTitle, getSynonyms, getIcon, isPhenotype, isRestricted } = useEntityFormatter()
    const entityStore = useEntity()
    const { saveToFile } = useFile()
    const { entities, repository, organisation } = storeToRefs(entityStore)
    const query = ref({ configuration: { sources: [] }, criteria: [], projection: { select: [] } } as Query)
    const treeLoading = ref(false)
    const runs = ref([] as Run[])
    const runId = ref(1)
    const importFile = ref(undefined as Blob|undefined)
    const fileReader = new FileReader()
    fileReader.onload = (e) => query.value = JSON.parse(e.target?.result as string) as Query

    const reloadEntities = async () => {
      treeLoading.value = true
      await entityStore.reloadEntities()
        .then(() => query.value.criteria = query.value.criteria?.filter(c => entities.value.findIndex(e => e.id === c.subject.id) !== -1))
        .catch((e: Error) => alert(e.message))
        .finally(() => treeLoading.value = false)
    }

    const getRunIndex = (id: number) => runs.value.findIndex(r => r.id === id)

    onMounted(() => reloadEntities())

    return {
      t,
      getTitle,
      getSynonyms,
      getIcon,
      isRestricted,
      EntityType,
      step: ref(1),
      query,
      organisation,
      repository,
      entities,
      runs,
      splitterModel: ref(25),
      reloadEntities,
      treeLoading,
      Sorting,
      sources: [ 'source1', 'source2' ],
      importFile,

      projectionEntities: computed(() =>
        entities.value.filter(e => [EntityType.Category, EntityType.SinglePhenotype, EntityType.DerivedPhenotype, EntityType.CombinedPhenotype].includes(e.entityType))
      ),

      configurationComplete: computed(() =>
        query.value.configuration && query.value.configuration.sources.length > 0
      ),
      criteriaComplete: computed(() =>
        query.value.criteria && query.value.criteria.length > 0
      ),

      projectionComplete: computed(() =>
        query.value.projection && query.value.projection.select && query.value.projection.select.length > 0
      ),

      addCriterion: (subject: Phenotype) => {
        if (!subject || (!isPhenotype(subject) && !isRestricted(subject))) return
        if (!query.value.criteria) query.value.criteria = []
        query.value.criteria.push({ exclusion: false, subject: subject })
      },

      addSelection: (subject: Phenotype) => {
        if (!query.value.projection) query.value.projection = { select: [] }
        if (!query.value.projection.select) query.value.projection.select = []
        if (
          !subject
          || ![EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(subject.entityType)
          || query.value.projection.select.findIndex(r => r.subject.id === subject.id) !== -1
        ) return
        query.value.projection.select.push({ subject: subject, sorting: Sorting.Asc })
      },

      moveSelectEntry: (oldIndex: number, newIndex: number) => {
        if (!query.value.projection || !query.value.projection.select || newIndex < 0 || newIndex >= query.value.projection.select.length) return
        query.value.projection.select.splice(newIndex, 0, query.value.projection.select.splice(oldIndex, 1)[0])
      },

      execute: () => {
        const id = runId.value++
        runs.value.push({
          id: id,
          running: true,
          title: query.value.name
        })
        new Promise((r) => setTimeout(r, 5000))
          .then(() => {
            const index = getRunIndex(id)
            if (index !== -1) runs.value[index].result = { message: 'result' }
          })
          .finally(() => {
            const index = getRunIndex(id)
            if (index !== -1) runs.value[index].running = false
          })
      },

      exportQuery: () => {
        saveToFile(JSON.stringify(query.value), new Date().toISOString() + '_' + (query.value.name || 'top_query') + '.json')
      },

      importQuery: () => {
        if (!importFile.value) return
        fileReader.readAsText(importFile.value)
        importFile.value = undefined
      },

      removeRun: (id: number) => {
        const index = getRunIndex(id)
        if (index !== -1) runs.value.splice(index, 1)
      },

      running: computed(() => runs.value.findIndex(r => r.running) !== -1)
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