<template>
  <q-card>
    <q-card-section class="q-pa-none">
      <q-table
        flat
        hide-pagination
        :columns="cols"
        :loading="loading"
        :rows="rows"
        :rows-per-page-options="[0]"
        :title="t('previousQuery', 2)"
        row-key="id"
      >
        <template #body="props">
          <q-tr :props="props">
            <slot name="row-cells" :row="props.row">
              <q-td auto-width>
                <q-spinner v-if="isRunning(props.row)" :title="t('running')" class="q-mr-sm" />
                <q-icon v-else-if="isFinished(props.row)" :title="t('finished')" name="done" color="positive" class="q-mr-sm" />
                <q-icon v-else-if="isFailed(props.row)" :title="t('failed')" name="bolt" color="negative" class="q-mr-sm" />
                <q-icon v-else :title="t('queued')" name="pause" color="grey" class="q-mr-sm" />
              </q-td>
              <q-td>{{ props.row.name || t('unnamedQuery') }}</q-td>
              <q-td>
                {{ getResult(props.row) }}
              </q-td>
              <q-td auto-width class="col-auto text-grey text-right" :title="t('elapsedTime')">
                {{ getEllapsedTime(props.row) }}
              </q-td>
              <q-td auto-width class="text-right">
                <q-btn-group flat class="q-ml-sm">
                  <q-btn
                    icon="save"
                    :disable="!isFinished(props.row)"
                    :title="t('downloadDataSet')"
                    @click.stop="download(props.row)"
                  />
                  <q-btn
                    icon="file_upload"
                    :title="t('loadThing', { thing: t('query') })"
                    @click.stop="$emit('prefill', props.row)"
                  />
                  <q-btn
                    icon="clear"
                    :title="t('removeThing', { thing: t('queryResult') })"
                    @click.stop="$emit('delete', props.row)"
                  />
                </q-btn-group>
              </q-td>
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

<script lang="ts">
import { Query, QueryPage, QueryResult, QueryState } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import { exportFile, QTableProps } from 'quasar'
import { QueryApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { useEntity } from 'src/pinia/entity'
import { computed, defineComponent, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    page: {
      type: Object as () => QueryPage,
      required: true
    },
    loading: Boolean
  },
  emits: ['delete', 'prefill', 'request'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const queryApi = inject(QueryApiKey)
    const entityStore = useEntity()
    const { renderError } = useNotify()
    const { organisationId, repositoryId } = storeToRefs(entityStore)
    const results = ref<QueryResult[]>([])

    const loadResult = async (query: Query) => {
      if (props.loading || !queryApi || !organisationId.value || !repositoryId.value || getQueryResult(query)?.finishedAt)
        return new Promise<void>(resolve => resolve())
      return queryApi.getQueryResult(organisationId.value, repositoryId.value, query.id)
        .then(r => {
          const index = results.value.findIndex(result => result.id === query.id)
          if (index !== -1) results.value.splice(index, 1)
          results.value.push(r.data)
        })
        .catch((e: Error) => renderError(e))
    }

    const getQueryResult = (query: Query) => results.value.find(r => r.id === query.id)

    const getState = (query: Query): QueryState => {
      const result = getQueryResult(query)
      if (!result) return QueryState.Queued
      if (!result.finishedAt) return QueryState.Running
      return result.state || QueryState.Running
    }

    onMounted(() => {
      window.setInterval(() => {
        props.page.content.map(async (query) => {
          if (getQueryResult(query)?.finishedAt) return
          await loadResult(query)
        })
      }, 5000)
    })

    return {
      t,

      rows: computed(() => props.page.content),
      cols: computed(() => [
          { name: 'state' },
          { name: 'name', field: 'name', label: t('name'), align: 'left' },
          { name: 'result', field: 'result', label: t('result'), align: 'left' },
          { name: 'elappsedTime', align: 'right' },
          { name: 'actions', align: 'right' }
      ] as QTableProps['columns']),

      isRunning(query: Query): boolean {
        return getState(query) === QueryState.Running
      },

      isFinished(query: Query): boolean {
        return getState(query) === QueryState.Finished
      },

      isFailed(query: Query): boolean {
        return getState(query) === QueryState.Failed
      },

      getEllapsedTime(query: Query): string|undefined {
        const result = getQueryResult(query)
        if (!result) return undefined
        const finishedAt = result.finishedAt
          ? new Date(result.finishedAt).getTime()
          : new Date().getTime()
        return new Date(finishedAt - new Date(result.createdAt).getTime())
          .toISOString().slice(11, 19)
      },

      getResult(query: Query): number|string|undefined {
        const result = getQueryResult(query)
        if (!result) return undefined
        return result.message || result.count
      },

      async download(query: Query) {
        if (!queryApi || !getQueryResult(query) || !organisationId.value || !repositoryId.value) return
        await queryApi.downloadQueryResult(organisationId.value, repositoryId.value, query.id, { responseType: 'blob' })
          .then(r => exportFile(query.id + '.zip', r.data as Blob))
      },

      onPageSelect (page: number) {
        emit('request', page)
      },
    }
  }
})
</script>
