<template>
  <q-card>
    <q-card-section class="q-pa-none">
      <q-table
        dense
        flat
        hide-pagination
        :columns="cols"
        :loading="loading"
        :rows="rows"
        :rows-per-page-options="[0]"
        :title="t('queryResult', 2)"
        :no-data-label="t('noDataPresent')"
        row-key="id"
      >
        <template #body="trProps">
          <q-tr :props="trProps" class="cursor-pointer">
            <slot name="row-cells" :row="trProps.row">
              <q-td auto-width>
                <q-spinner v-if="isRunning(trProps.row)" :title="t('running')" size="sm" />
                <q-icon
                  v-else-if="isFinished(trProps.row)"
                  :title="t('finished')"
                  name="done"
                  size="sm"
                  color="positive"
                />
                <q-icon v-else-if="isFailed(trProps.row)" :title="t('failed')" name="bolt" size="sm" color="negative" />
                <q-icon v-else :title="t('queued')" name="pause" size="sm" color="grey" />
              </q-td>
              <q-td>{{ trProps.row.name || t('unnamedQuery') }}</q-td>
              <q-td>
                {{ getResult(trProps.row) }}
              </q-td>
              <q-td auto-width class="col-auto text-grey text-right" :title="t('elapsedTime')">
                <span class="gt-sm">{{ getEllapsedTime(trProps.row) }}</span>
              </q-td>
              <q-menu>
                <q-list dense>
                  <q-item
                    v-if="isConceptQuery"
                    v-close-popup
                    clickable
                    :disable="!isFinished(trProps.row)"
                    @click="routeToDocumentView(trProps.row)"
                  >
                    <q-item-section>
                      {{ t('showDocumentResults') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-else
                    v-close-popup
                    clickable
                    :disable="!isFinished(trProps.row)"
                    @click="showGrid(trProps.row)"
                  >
                    <q-item-section>
                      {{ t('showGrid') }}
                    </q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                    :disable="!isFinished(trProps.row)"
                    @click="exportToFile(trProps.row)"
                  >
                    <q-item-section>
                      {{ t('downloadDataSet') }}
                    </q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable @click="$emit('prefill', trProps.row)">
                    <q-item-section>
                      {{ t('repeatThing', { thing: t('query') }) }}
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item v-close-popup clickable @click="$emit('delete', trProps.row)">
                    <q-item-section>
                      {{ t('removeThing', { thing: t('queryResult') }) }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </slot>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <div class="row justify-end items-center">
        <b class="text-grey-8">
          {{ t('resultCountWithTotal', { count: page.content.length, total: page.totalElements }) }}
        </b>
        <q-pagination
          :model-value="page.number"
          :max="page.totalPages"
          boundary-links
          direction-links
          color="grey-8"
          size="sm"
          class="q-ml-sm"
          @update:model-value="onPageSelect"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { Query, QueryPage, QueryResult, QueryState } from '@onto-med/top-api'
import GridDialog from './GridDialog.vue'
import { storeToRefs } from 'pinia'
import { exportFile, useQuasar, QTableProps } from 'quasar'
import { QueryApiKey } from 'src/boot/axios'
import { SearchTypesEnum } from 'src/config'
import useNotify from 'src/mixins/useNotify'
import { useEntity } from 'src/pinia/entity'
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import * as zip from '@zip.js/zip.js'

const props = defineProps({
  page: {
    type: Object as () => QueryPage,
    required: true
  },
  loading: Boolean,
  isConceptQuery: Boolean
})

const emit = defineEmits(['delete', 'prefill', 'request'])

const { t } = useI18n()
const queryApi = inject(QueryApiKey)
const entityStore = useEntity()
const { renderError } = useNotify()
const { organisationId, repositoryId } = storeToRefs(entityStore)
const results = ref<QueryResult[]>([])
const interval = ref<number>()
const skippedQueries = ref<Set<string>>(new Set<string>())
const router = useRouter()
const $q = useQuasar()

const rows = computed(() => props.page.content)
const cols = computed(
  () =>
    [
      { name: 'state' },
      { name: 'name', field: 'name', label: t('name'), align: 'left' },
      { name: 'result', field: 'result', label: t('result'), align: 'left' },
      { name: 'elappsedTime', align: 'right' }
    ] as QTableProps['columns']
)

onMounted(() => {
  interval.value = window.setInterval(() => {
    props.page.content.map(async (query) => {
      if (getQueryResult(query)?.finishedAt || skippedQueries.value.has(query.id)) return
      await loadResult(query).catch((e: Error) => {
        skippedQueries.value.add(query.id)
        renderError(e)
      })
    })
  }, 5000)
})

onUnmounted(() => {
  window.clearInterval(interval.value)
})

async function loadResult(query: Query) {
  if (props.loading || !queryApi || !organisationId.value || !repositoryId.value || getQueryResult(query)?.finishedAt)
    return new Promise<void>((resolve) => resolve())
  return queryApi.getQueryById(organisationId.value, repositoryId.value, query.id).then((r) => {
    if (!r.data.result) return
    const index = results.value.findIndex((result) => result.id === query.id)
    if (index !== -1) results.value.splice(index, 1)
    results.value.push(r.data.result)
  })
}

function getQueryResult(query: Query) {
  return results.value.find((r) => r.id === query.id)
}

function getState(query: Query): QueryState {
  const result = getQueryResult(query)
  if (!result) return QueryState.Queued
  if (!result.finishedAt) return QueryState.Running
  return result.state || QueryState.Running
}

function routeToDocumentView(query: Query) {
  if (organisationId.value && repositoryId.value && query.id)
    void router.push({
      name: 'documentSearchByQuery',
      params: {
        organisationId: organisationId.value,
        repositoryId: repositoryId.value,
        queryId: query.id
      },
      query: {
        queryName: query.name,
        searchType: SearchTypesEnum.SEARCH_QUERY
      }
    })
}

async function download(query: Query) {
  if (!queryApi || !getQueryResult(query) || !organisationId.value || !repositoryId.value) return Promise.reject()
  return queryApi.downloadQueryResult(organisationId.value, repositoryId.value, query.id, { responseType: 'blob' })
}

function isRunning(query: Query): boolean {
  return getState(query) === QueryState.Running
}

function isFinished(query: Query): boolean {
  return getState(query) === QueryState.Finished
}

function isFailed(query: Query): boolean {
  return getState(query) === QueryState.Failed
}

function getEllapsedTime(query: Query): string | undefined {
  const result = getQueryResult(query)
  if (!result) return undefined
  const finishedAt = result.finishedAt ? new Date(result.finishedAt).getTime() : new Date().getTime()
  return new Date(finishedAt - new Date(result.createdAt).getTime()).toISOString().slice(11, 19)
}

function getResult(query: Query): number | string | undefined {
  const result = getQueryResult(query)
  if (!result) return undefined
  return result.message || result.count
}

function exportToFile(query: Query) {
  download(query).then(
    (r) => exportFile(query.id + '.zip', r.data as Blob),
    () => {}
  )
}

function showGrid(query: Query) {
  download(query)
    .then((r) => {
      const zipBlob = r.data as Blob
      const zipReader = new zip.ZipReader(new zip.BlobReader(zipBlob))
      return zipReader.getEntries()
    })
    .then((entries) =>
      $q.dialog({
        component: GridDialog,
        componentProps: {
          entries: entries,
          query
        }
      })
    )
    .catch((e: Error) => renderError(e))
}

function onPageSelect(page: number) {
  emit('request', page)
}
</script>
