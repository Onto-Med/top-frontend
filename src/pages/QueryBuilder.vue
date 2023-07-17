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
            required
            class="col-4 col"
            @update:model-value="setRepository"
          />
        </div>
      </q-card-section>

      <q-separator />

      <phenotype-query-form
        v-if="isPhenotypeQuery"
        ref="phenotypeQueryForm"
        @execute="execute"
      />
    </q-card>

    <query-results-table
      v-if="repository"
      :page="queryPage"
      @delete="deleteQuery"
      @prefill="prefillQuery"
      @request="loadQueryPage($event)"
    />
  </q-page>
</template>

<script setup lang="ts">
import {
  DataSource,
  PhenotypeQuery,
  Query,
  QueryPage,
  QueryType,
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
import { useQuasar } from 'quasar'
import QueryResultsTable from 'src/components/Query/QueryResultsTable.vue'
import RepositorySelectField from 'src/components/Repository/RepositorySelectField.vue'
import Dialog from 'src/components/Dialog.vue'
import PhenotypeQueryForm from 'src/components/Query/PhenotypeQueryForm.vue'
import RepositoryTypeSelect from 'src/components/EntityEditor/RepositoryTypeSelect.vue'

const { t } = useI18n()
const $q = useQuasar()
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
// TODO: const conceptQueryForm = ref<InstanceType<typeof ConceptQueryForm>>()
const conceptQueryForm = ref()
const phenotypeQueryForm = ref<InstanceType<typeof PhenotypeQueryForm>>()
  console.log(typeof PhenotypeQueryForm)

const dataSources = ref([] as DataSource[])
entityStore.getDataSources(QueryType.Phenotype)
  .then(r => dataSources.value = r)
  .catch((e: Error) => renderError(e))

function loadQueryPage (page: number) {
  if (queryApi && organisation.value && repository.value)
    queryApi.getQueries(organisation.value.id, repository.value.id, page)
      .then(r => queryPage.value = r.data)
      .catch((e: Error) => renderError(e))
}

onMounted(() => {
  if (!organisation.value || !repository.value) return
  loadQueryPage(1)
})

function reset (repository?: Repository) {
  entityStore.setRepository(repository)
  if (isConceptQuery.value) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    conceptQueryForm.value?.reset()
  } else if (isPhenotypeQuery.value) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    phenotypeQueryForm.value?.reset()
  }
  void loadQueryPage(1)
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
    .then(() => queryPage.value.content.unshift(query))
    .catch((e: Error) => renderError(e))
}

function deleteQuery (query: PhenotypeQuery) {
  if (!queryApi || !organisation.value || !repository.value) return

  queryApi?.deleteQuery(organisation.value.id, repository.value.id, query.id)
    .catch((e: Error) => renderError(e))
    .finally(() => {
      const index = queryPage.value.content.findIndex(q => q.id === query.id)
      if (index !== -1) queryPage.value.content.splice(index, 1)
    })
}

function prefillQuery (query: Query) {
  if (isConceptQuery.value) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    conceptQueryForm.value?.prefillQuery(query)
  } else if (isPhenotypeQuery.value) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    phenotypeQueryForm.value?.prefillQuery(query)
  }
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
