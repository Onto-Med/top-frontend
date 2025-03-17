<template>
  <q-dialog>
    <q-card class="test-dialog">
      <q-card-section class="text-h6">
        <q-icon name="rule" size="sm" />
        {{ t('testThing', { thing: t('repository') }) }}:
        <q-breadcrumbs v-if="repository" class="inline-block">
          <q-breadcrumbs-el
            :label="organisation?.name"
            :to="{ name: 'showOrganisation', params: { organisationId: organisation?.id } }"
          />
          <q-breadcrumbs-el :label="repository.name" />
        </q-breadcrumbs>
      </q-card-section>

      <q-separator />

      <div>
        <q-card-section>
          <p>{{ t('testDescription') }}</p>

          <q-select
            v-model="dataSourceId"
            filled
            :options="dataSources"
            :label="t('dataSource')"
            option-value="id"
            option-label="title"
            emit-value
            map-options
          >
            <template #after>
              <q-btn
                :label="t('executeThing', { thing: t('test') })"
                :disable="!testIsReady"
                color="primary"
                @click="test"
              />
            </template>
          </q-select>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <div class="text-h6 q-px-md q-pt-md">
            {{ t('testReport', 2) }}
            <small v-if="testReports" :class="{ 'text-grey': !failed, 'text-negative': failed }"
              >({{ t('failedCount', { failed, total }) }})</small
            >
          </div>
          <q-table
            :rows="testReports || []"
            :columns="testReportColumns"
            :no-data-label="t('noDataPresent')"
            hide-pagination
            row-key="id"
            class="test-report-table"
            dense
            flat
          >
            <template v-slot:body-cell-passed="props">
              <q-td :props="props">
                <q-icon
                  :name="props.row.passed ? 'check_circle' : 'error'"
                  :color="props.row.passed ? 'positive' : 'negative'"
                  size="xs"
                />
              </q-td>
            </template>
            <template #body-cell-entityId="props">
              <q-td :props="props">
                <entity-chip :entity-id="props.row.entityId" dense />
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-inner-loading :showing="loading" :label="t('pleaseWait') + '...'" />
      </div>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          :label="t('copyThing', { thing: t('testReport', 2) })"
          :title="t('copyToClipboard')"
          :disabled="!testReports"
          @click="copyTestReport"
        />
        <q-btn v-close-popup flat :label="t('close')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { QueryApiKey, RepositoryApiKey } from 'src/boot/axios'
import { DataSource, TestReport } from '@onto-med/top-api'
import useNotify from 'src/mixins/useNotify'
import { copyToClipboard, QTableProps } from 'quasar'
import { useEntityStore } from 'src/stores/entity-store'
import { storeToRefs } from 'pinia'
import EntityChip from '../EntityEditor/EntityChip.vue'

const { t } = useI18n()
const repositoryApi = inject(RepositoryApiKey)
const queryApi = inject(QueryApiKey)
const entityStore = useEntityStore()
const { organisation, repository } = storeToRefs(entityStore)
const { notify, renderError } = useNotify()
const loading = ref(false)
const dataSourceId = ref<string>()
const testReports = ref<TestReport[]>()
const dataSources = ref<DataSource[]>([])

const testReportString = computed(() => JSON.stringify(testReports.value))

const testIsReady = computed(
  () => !!organisation.value && !!repository.value && !!dataSourceId.value,
)

const total = computed(() => testReports.value?.length)
const failed = computed(() => testReports.value?.filter((r) => !r.passed).length)

const testReportColumns = computed(
  () =>
    [
      { name: 'passed', label: t('status'), align: 'left', field: 'passed', sortable: true },
      { name: 'id', label: t('id'), align: 'right', field: 'id', sortable: true },
      { name: 'subjectId', label: t('subject'), field: 'subjectId', sortable: true },
      { name: 'encounterId', label: t('encounter'), field: 'encounterId', sortable: true },
      {
        name: 'entityId',
        label: t('phenotype'),
        align: 'left',
        field: 'entityId',
        sortable: true,
      },
      {
        name: 'expected',
        label: t('expected'),
        align: 'right',
        field: (row) => row.expected.value,
        sortable: true,
      },
      {
        name: 'actual',
        label: t('actual'),
        align: 'right',
        field: (row) => row.actual.value,
        sortable: true,
      },
    ] as QTableProps['columns'],
)

onMounted(reloadDataSources)

async function test() {
  if (
    loading.value ||
    !repositoryApi ||
    !organisation.value ||
    !repository.value ||
    !dataSourceId.value
  )
    return
  loading.value = true

  await repositoryApi
    .testRepository(organisation.value.id, repository.value.id, dataSourceId.value)
    .then((r) => {
      testReports.value = r.data
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function copyTestReport() {
  if (testReports.value)
    copyToClipboard(testReportString.value)
      .then(() => notify(t('copiedToClipboard'), 'positive'))
      .catch(() => notify(t('copyFailed')))
}

async function reloadDataSources() {
  if (loading.value || !queryApi || !organisation.value) return Promise.reject()
  loading.value = true

  return queryApi
    .getOrganisationDataSources(organisation.value.id)
    .then((r) => {
      dataSources.value = r.data.filter((ds) => ds.local)
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}
</script>

<style lang="scss" scoped>
.test-dialog {
  min-width: 400px;
  max-width: 800px;
}
</style>

<style lang="scss">
.test-report-table .ellipsis {
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.25rem;
  letter-spacing: 0.03333em;
}
</style>
