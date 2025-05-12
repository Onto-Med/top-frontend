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
            v-model="selectedDataSourceId"
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

        <q-card-section v-if="uploadPossible">
          <q-expansion-item
            dense
            dense-toggle
            expand-separator
            :label="t('uploadDataSource')"
            header-class="q-px-none"
          >
            <p>{{ t('uploadDataSourceDescription') }}</p>
            <div class="row q-gutter-sm">
              <q-input v-model="dataSourceId" :label="t('dataSourceId')" class="col" />
              <enum-select
                v-model:selected="dataSourceFileType"
                i18n-prefix="dataSourceFileType"
                :enum="DataSourceFileType"
                :label="t('type')"
                class="col"
              />
            </div>
            <p
              v-show="dataSourceFileHint"
              class="text-caption text-break text-grey q-mt-md q-mb-none"
            >
              {{ dataSourceFileHint }}
            </p>
            <q-checkbox
              v-show="dataSourceFileType == DataSourceFileType.Fhir"
              v-model="mergeEncounters"
              size="sm"
              :label="t('mergeEncounters')"
            />
            <q-file
              v-model="dataSourceFile"
              :label="t('selectThing', { thing: t('file') })"
              accept=".csv,.json,.rdf,.xml,.yaml,.yml"
              :disable="!dataSourceFileType"
            >
              <template #after>
                <q-btn
                  type="submit"
                  icon="file_upload"
                  color="primary"
                  :disabled="!dataSourceFileType || !dataSourceFile || loading"
                  :label="t('upload')"
                  @click="uploadDataSource()"
                />
              </template>
            </q-file>
          </q-expansion-item>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <div class="text-h6 q-px-md q-pt-md">
            {{ t('testReport', 2) }}
            <small v-if="testReports" :class="{ 'text-positive': !failed, 'text-negative': failed }"
              >({{ t('passedCount', { passed, total }) }})</small
            >
          </div>
          <q-table
            :rows="testReports || []"
            :columns="testReportColumns"
            :no-data-label="t('noDataPresent')"
            :rows-per-page-options="[0]"
            hide-pagination
            row-key="id"
            class="test-report-table"
            dense
            flat
          >
            <template v-slot:body-cell-passed="props">
              <q-td :props="props" :title="props.row.passed ? t('passed') : t('failed')">
                <q-icon
                  v-if="props.row.passed !== undefined"
                  :name="props.row.passed ? 'check_circle' : 'dangerous'"
                  :color="props.row.passed ? 'positive' : 'negative'"
                  size="xs"
                />
              </q-td>
            </template>
            <template #body-cell-entityId="props">
              <q-td :props="props">
                <entity-chip
                  :entity-id="props.row.entityId"
                  :label="props.row.entityId"
                  disable
                  dense
                />
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
import { DataSource, DataSourceFileType, TestReport } from '@onto-med/top-api'
import useNotify from 'src/mixins/useNotify'
import { copyToClipboard, QTableProps } from 'quasar'
import { useEntityStore } from 'src/stores/entity-store'
import { storeToRefs } from 'pinia'
import EntityChip from '../EntityEditor/EntityChip.vue'
import EnumSelect from 'src/components/EnumSelect.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const repositoryApi = inject(RepositoryApiKey)
const queryApi = inject(QueryApiKey)
const entityStore = useEntityStore()
const { isAuthenticated, organisation, repository } = storeToRefs(entityStore)
const { notify, renderError } = useNotify()
const loading = ref(false)
const selectedDataSourceId = ref<string>()
const testReports = ref<TestReport[]>()
const dataSources = ref<DataSource[]>([])
const dataSourceId = ref<string>()
const dataSourceFileType = ref<DataSourceFileType>()
const dataSourceFile = ref<File>()
const mergeEncounters = ref(false)
const { canWrite } = useEntityFormatter()

const uploadPossible = computed(() => canWrite(organisation.value))

const testReportString = computed(() => JSON.stringify(testReports.value))

const testIsReady = computed(
  () => !!organisation.value && !!repository.value && !!selectedDataSourceId.value,
)

const total = computed(() => testReports.value?.filter((r) => r.passed !== undefined).length)
const failed = computed(() => testReports.value?.filter((r) => r.passed === false).length)
const passed = computed(() => testReports.value?.filter((r) => r.passed === true).length)

const dataSourceConfig = computed(() => {
  if (dataSourceFileType.value == DataSourceFileType.Fhir && mergeEncounters.value != undefined) {
    return `mergeEncounters=${mergeEncounters.value}`
  }
  return undefined
})

const dataSourceFileHint = computed(() => {
  const key = `dataSourceFileTypeDescriptions.${dataSourceFileType.value}`
  return te(key) ? t(key) : undefined
})

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
        field: (row) => row.expected?.value,
        sortable: true,
      },
      {
        name: 'actual',
        label: t('actual'),
        align: 'right',
        field: (row) => row.actual?.value,
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
    !selectedDataSourceId.value
  )
    return
  loading.value = true

  await repositoryApi
    .testRepository(organisation.value.id, repository.value.id, selectedDataSourceId.value)
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

function uploadDataSource() {
  if (
    !queryApi ||
    !isAuthenticated.value ||
    !organisation.value ||
    !dataSourceId.value ||
    !dataSourceFileType.value ||
    !dataSourceFile.value
  )
    return

  queryApi
    .uploadDataSource(
      organisation.value.id,
      dataSourceFile.value,
      dataSourceFileType.value,
      dataSourceId.value,
      dataSourceConfig.value,
    )
    .then(() => notify(t('finishedThing', { thing: t('upload') }), 'positive'))
    .then(reloadDataSources)
    .then(() => (selectedDataSourceId.value = dataSourceId.value))
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
