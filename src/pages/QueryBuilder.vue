<template>
  <q-layout>
    <q-page class="q-pa-md q-gutter-md q-mr-xl">
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

          <div class="row q-gutter-md">
            <repository-type-select
              v-model="repositoryTypeFilter"
              :required="false"
              hide-bottom-space
              class="col-lg-2 col-4"
            />
            <repository-select-field
              :model-value="repository"
              :repository-type="repositoryTypeFilter"
              :label="t('repositoryContainingModel')"
              :permissions="[Permission.Write, Permission.Manage]"
              required
              class="col-4 col"
              @update:model-value="setRepository"
            />
          </div>
        </q-card-section>

        <q-separator />

        <concept-query-form
          v-if="isConceptQuery"
          ref="conceptQueryForm"
          @execute="execute"
        />
        <phenotype-query-form
          v-if="isPhenotypeQuery"
          ref="phenotypeQueryForm"
          @execute="execute"
        />
      </q-card>

      <q-drawer
        v-if="repository"
        :model-value="resultsDrawer"
        :mini="minifyResults"
        :width="drawerWidth"
        :class="{ 'bg-grey-2': !isDarkModeActive }"
        :breakpoint="0"
        bordered
        elevated
        overlay
        side="right"
        @update:model-value="resultsDrawer = true"
      >
        <q-scroll-area v-show="!minifyResults" ref="resultsScrollArea" class="fit">
          <query-results-table
            class="fit"
            :page="queryPage"
            :is-concept-query="isConceptQuery"
            @delete="deleteQuery"
            @prefill="prefillQuery"
            @request="loadQueryPage($event)"
          />
        </q-scroll-area>

        <div v-show="minifyResults" class="q-mt-xl rotate-90 q-table__title text-no-wrap">
          {{ t('queryResult', 2) }}
        </div>
        <div class="absolute drawer-icon">
          <q-btn
            dense
            round
            unelevated
            color="primary"
            :icon="minifyResults ? 'chevron_left' : 'chevron_right'"
            @click="minifyResults = !minifyResults"
          />
        </div>
      </q-drawer>
    </q-page>
  </q-layout>
</template>

<script setup lang="ts">
import {
  ConceptQuery,
  Permission,
  PhenotypeQuery,
  Query,
  QueryPage,
  Repository,
  RepositoryType
} from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import { useEntity } from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import { onMounted, ref, computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { v4 as uuidv4 } from 'uuid'
import { QueryApiKey } from 'src/boot/axios'
import { QScrollArea, useQuasar } from 'quasar'
import QueryResultsTable from 'src/components/Query/QueryResultsTable.vue'
import RepositorySelectField from 'src/components/Repository/RepositorySelectField.vue'
import Dialog from 'src/components/Dialog.vue'
import ConceptQueryForm from 'src/components/Query/ConceptQueryForm.vue'
import PhenotypeQueryForm from 'src/components/Query/PhenotypeQueryForm.vue'
import RepositoryTypeSelect from 'src/components/EntityEditor/RepositoryTypeSelect.vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  queryId: String
})
const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const entityStore = useEntity()
const { renderError } = useNotify()
const { repository, organisation } = storeToRefs(entityStore)
const queryApi = inject(QueryApiKey)
const queryPage = ref<QueryPage>({
  content: [],
  number: 1,
  size: 0,
  totalElements: 0,
  totalPages: 0,
  type: 'query'
})
const repositoryTypeFilter = ref<RepositoryType>()
const conceptQueryForm = ref<InstanceType<typeof ConceptQueryForm>>()
const phenotypeQueryForm = ref<InstanceType<typeof PhenotypeQueryForm>>()
const isDarkModeActive = computed(() => $q.dark.isActive)
const minifyResults = ref(true)
const resultsScrollArea = ref<QScrollArea>()
const resultsDrawer = ref(true)

const drawerWidth = computed(() => {
  return $q.screen.width / ($q.screen.width >= 1000  ? 2 : 1.2)
})

async function loadQueryPage (page: number) {
  if (queryApi && organisation.value && repository.value)
    await queryApi.getQueries(organisation.value.id, repository.value.id, page)
      .then(r => queryPage.value = r.data)
      .catch((e: Error) => renderError(e))
}

onMounted(() => {
  if (!organisation.value || !repository.value) return
  // TODO: Loading the first page is not sufficient to get a query by ID. There must be an API endpoint to request a query by ID.
  void loadQueryPage(1)
    .then(() => prefillQuery(queryPage.value.content.find(q => q.id === props.queryId)))
})

function reset (repository?: Repository) {
  entityStore
    .setRepository(repository)
    .then(() => {
      if (isConceptQuery.value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        conceptQueryForm.value?.reset()
      } else if (isPhenotypeQuery.value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        phenotypeQueryForm.value?.reset()
      }
    })
    .then(() => {
      void router.replace({
        name: 'queryBuilder',
        params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repository?.id }
      })
    })
    .then(() => loadQueryPage(1))
    .catch((e: Error) => renderError(e))
}

const isPhenotypeQuery = computed(
  () => repository.value?.repositoryType === RepositoryType.PhenotypeRepository
)
const isConceptQuery = computed(
  () => repository.value?.repositoryType === RepositoryType.ConceptRepository
)

function execute (query: Query) {
  if (!queryApi || !organisation.value || !repository.value) return
  query.id = (uuidv4 as () => string)()

  queryApi.enqueueQuery(organisation.value.id, repository.value.id, query)
    .then(() => {
      queryPage.value.content.unshift(query)
      queryPage.value.totalElements++
      resultsScrollArea.value?.setScrollPosition('vertical', 0)
      minifyResults.value = false
    })
    .catch((e: Error) => renderError(e))
}

function deleteQuery (query: PhenotypeQuery) {
  if (!queryApi || !organisation.value || !repository.value) return

  queryApi?.deleteQuery(organisation.value.id, repository.value.id, query.id)
    .catch((e: Error) => renderError(e))
    .finally(() => {
      const index = queryPage.value.content.findIndex(q => q.id === query.id)
      if (index !== -1) {
        queryPage.value.content.splice(index, 1)
        queryPage.value.totalElements--
      }
    })
}

function prefillQuery (query?: Query) {
  void router.replace({
    name: 'queryBuilder',
    params: { organisationId: organisation.value?.id, repositoryId: repository.value?.id, queryId: query?.id }
  })
  if (!query) return
  if (isConceptQuery.value) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    conceptQueryForm.value?.prefillQuery(query as ConceptQuery)
  } else if (isPhenotypeQuery.value) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    phenotypeQueryForm.value?.prefillQuery(query)
  }
  minifyResults.value = true
}

function setRepository (repo?: Repository) {
  if (repository.value && repo !== repository.value) {
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
</script>

<style lang="sass">
.drawer-icon
  top: 30px
  left: -17px
</style>
