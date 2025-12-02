<template>
  <q-page class="q-pa-md q-gutter-md">
    <q-card>
      <q-card-section class="document-search-title">
        <div class="text-h6">
          {{ t('documentSearch.title') }}
        </div>
        <q-chip v-if="query" square removable @remove="resetPage">
          {{ t('dataOfQuery', { thing: query.name || query.id }) }}
          ({{ t('dataSource') }}:&nbsp;
          <span v-if="dataSource">{{ t('quoteThing', { thing: dataSource.id }) }}</span>
          <i v-else class="text-negative">{{ t('unavailable') }}</i
          >)
        </q-chip>

        <q-select
          v-else
          v-model="dataSource"
          :options="dataSources"
          :label="t('dataSource')"
          :error="!dataSource"
          dense
          hide-bottom-space
          class="data-source-select"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                {{ scope.opt.title || scope.opt.id }}
              </q-item-section>
            </q-item>
          </template>
          <template #selected-item="scope">
            {{ scope.opt.title || scope.opt.id }}
          </template>
        </q-select>
      </q-card-section>
      <q-separator />

      <q-card-section class="q-pa-none">
        <document-search-form
          :query="query"
          :data-source="dataSource"
          :document-filter="documentIds"
          :document-query-offsets="documentOffsets"
          :with-rag="env.RAG_ENABLED"
          class="cluster-form"
          @clear-query="resetPage()"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import DocumentSearchForm from 'components/Documents/DocumentSearchForm.vue'
import { useI18n } from 'vue-i18n'
import { inject, onMounted, ref, watch } from 'vue'
import { DataSource, Query, QueryType } from '@onto-med/top-api'
import { QueryApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { useRouter } from 'vue-router'
import { useMeta } from 'quasar'
import { env } from 'src/config'

const props = defineProps({
  organisationId: String,
  repositoryId: String,
  queryId: String,
})

const { t } = useI18n()
const { renderError } = useNotify()
const dataSource = ref<DataSource>()
const dataSources = ref<DataSource[]>([])
const queryApi = inject(QueryApiKey)
const query = ref<Query>()
const documentIds = ref<Array<string>>()
const documentOffsets = ref<{ [key: string]: string[] }>()
const router = useRouter()

useMeta({ title: t('documentSearch.title') })

watch(
  () => props.queryId,
  () => loadQuery(),
)

onMounted(() => {
  reloadDataSources()
  loadQuery()
})

function setUpSQResults() {
  if (!props.organisationId || !props.repositoryId || !props.queryId) return
  queryApi
    ?.getQueryResultIds(props.organisationId, props.repositoryId, props.queryId)
    .then((r) => {
      for (const id of Object.keys(r.data)) {
        documentIds.value?.push(id)
      }
      documentOffsets.value = r.data
    })
    .catch((e: Error) => renderError(e))

  if (!query.value) return
  queryApi
    ?.getDataSources(QueryType.Concept)
    .then((r) => {
      dataSource.value = r.data.find((d) => d.id === query.value?.dataSource)
    })
    .catch((e: Error) => renderError(e))
}

function reloadDataSources() {
  queryApi
    ?.getDataSources(QueryType.Concept)
    .then((r) => (dataSources.value = r.data))
    .catch((e: Error) => renderError(e))
}

function loadQuery() {
  query.value = undefined
  documentIds.value = []
  if (props.organisationId && props.repositoryId && props.queryId)
    queryApi
      ?.getQueryById(props.organisationId, props.repositoryId, props.queryId)
      .then((r) => {
        query.value = r.data
        dataSource.value = dataSources.value.find((d) => d.id == r.data.dataSource)
      })
      .then(setUpSQResults)
      .catch((e: Error) => renderError(e))
}

function resetPage() {
  query.value = undefined
  documentIds.value = []
  documentOffsets.value = undefined
  void router.push({ name: 'documentSearch' })
}

</script>

<style lang="scss" scoped>
.document-search-title {
  min-height: 104px;
}
.data-source-select {
  min-width: 50px;
  max-width: 500px;
}
</style>
