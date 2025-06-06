<template v-slot="append">
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('manageThing', { thing: t('dataSource', 2) }) }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <p>{{ t('manageDataSourceDescription') }}</p>
        <q-select
          v-model="dataSource"
          :options="availableDataSources"
          :label="t('dataSource')"
          option-value="id"
          map-options
        >
          <template #selected>
            <span v-if="dataSource">
              {{ dataSource.title || dataSource.id }}
            </span>
          </template>
          <template #option="scope">
            <q-item v-bind="scope.itemProps" :title="t(scope.opt.queryType)">
              <q-item-section>
                <div class="items-center">
                  <q-icon :name="queryIcon(scope.opt.queryType)" size="xs" />
                  {{ scope.opt.title || scope.opt.id }}
                  <q-btn
                    v-if="scope.opt.local"
                    icon="delete"
                    color="red"
                    size="sm"
                    class="float-right"
                    dense
                    :title="t('deleteThing', { thing: t('dataSource') })"
                    @click.stop="deleteDataSource(scope.opt)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </template>
          <template #after>
            <q-btn
              type="submit"
              icon="add"
              color="primary"
              :disabled="!dataSource || loading"
              :label="t('add')"
              @click="addDataSource()"
            />
          </template>
        </q-select>
      </q-card-section>

      <q-separator size="3px" />

      <q-card-section class="q-pa-none">
        <q-table
          flat
          :loading="loading"
          :rows="dataSources"
          :columns="columns"
          :no-data-label="t('noDataPresent')"
          :pagination="initialPagination"
          :filter="filter"
          :rows-per-page-label="t('recordsPerPage')"
          :pagination-label="paginationLabel"
        >
          <template #top>
            <q-input v-model="filter" dense debounce="300" color="primary">
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-space />
            <q-btn
              color="secondary"
              :disabled="loading"
              :label="t('reload')"
              icon="refresh"
              @click="reloadOrganisationDataSources()"
            />
          </template>
          <template #body="rowProps">
            <q-tr :props="rowProps">
              <q-td>{{ rowProps.row.title || rowProps.row.id }}</q-td>
              <q-td>{{ t(rowProps.row.queryType) }}</q-td>
              <q-td auto-width>
                <q-btn
                  v-if="isAuthenticated"
                  dense
                  icon="remove"
                  color="red"
                  :title="t('remove')"
                  @click="removeDataSource(rowProps.row)"
                />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('close')" color="primary" @click="onCancelClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { DataSource, Organisation } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import { QDialog, QTableColumn, useQuasar } from 'quasar'
import { QueryApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { useEntityStore } from 'src/stores/entity-store'
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'src/components/Dialog.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

const props = defineProps({
  organisation: {
    type: Object as () => Organisation,
    required: true,
  },
})
const emit = defineEmits(['hide', 'ok'])

const { t } = useI18n()
const { notify, renderError } = useNotify()
const $q = useQuasar()
const dialog = ref<QDialog | undefined>(undefined)
const dataSource = ref<DataSource>()
const dataSources = ref<DataSource[]>([])
const availableDataSources = ref<DataSource[]>([])
const loading = ref(false)
const queryApi = inject(QueryApiKey)
const { isAuthenticated } = storeToRefs(useEntityStore())
const { queryIcon, paginationLabel } = useEntityFormatter()
const filter = ref('')
const initialPagination = {
  sortBy: 'id',
  descenting: false,
  page: 1,
  rowsPerPage: 10,
}

const columns = computed(() => {
  return [
    { name: 'id', label: t('dataSource'), align: 'left', sortable: true, required: true },
    { name: 'queryType', label: t('suitableFor'), align: 'left', sortable: true, required: true },
    { name: 'actions', align: 'right', sortable: false },
  ] as QTableColumn[]
})

onMounted(async () => {
  await reloadOrganisationDataSources().then(reloadAvailableDataSources)
})

function hide() {
  dialog.value?.hide()
}

async function reloadAvailableDataSources() {
  if (!queryApi) return Promise.reject()
  return queryApi.getDataSources().then((r) => (availableDataSources.value = r.data))
}

async function reloadOrganisationDataSources() {
  if (loading.value || !queryApi) return Promise.reject()
  loading.value = true

  return queryApi
    .getOrganisationDataSources(props.organisation.id)
    .then((r) => {
      dataSources.value = r.data
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function resetDataSource() {
  dataSource.value = undefined
}

function onDialogHide() {
  emit('hide')
}

function onCancelClick() {
  hide()
}

async function addDataSource() {
  if (!queryApi || !isAuthenticated.value || !dataSource.value) return
  loading.value = true

  await queryApi
    .addOrganisationDataSource(props.organisation.id, dataSource.value)
    .then(() => {
      const source = dataSource.value as DataSource
      const index = dataSources.value.findIndex((ds) => ds.id === source.id)
      if (index !== -1) {
        dataSources.value[index] = source
      } else {
        dataSources.value.unshift(source)
      }
      notify(t('thingAdded', { thing: t('dataSource') }), 'positive')
      resetDataSource()
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function deleteDataSource(dataSource: DataSource) {
  if (!queryApi || !isAuthenticated.value) return
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('confirmDeleteDataSource'),
    },
  }).onOk(() => {
    queryApi
      .deleteDataSource(dataSource.id)
      .then(() => notify(t('thingDeleted', { thing: t('dataSource') }), 'positive'))
      .then(reloadAvailableDataSources)
      .catch((e: Error) => renderError(e))
  })
}

function removeDataSource(dataSource: DataSource) {
  if (!queryApi || !isAuthenticated.value) return
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('confirmRemoveDataSource'),
    },
  }).onOk(() => {
    loading.value = true
    queryApi
      .removeOrganisationDataSource(props.organisation.id, dataSource)
      .then(() => {
        const index = dataSources.value.findIndex((ds) => ds.id === dataSource.id)
        if (index !== -1) {
          dataSources.value.splice(index, 1)
        }
        notify(t('thingRemoved', { thing: t('dataSource') }), 'positive')
      })
      .catch((e: Error) => renderError(e))
      .finally(() => (loading.value = false))
  })
}
</script>
<style lang="scss" scoped>
.text-break {
  word-wrap: break-word;
}
</style>
