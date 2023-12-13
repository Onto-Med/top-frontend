<template>
  <div>
    <table-with-actions
      flat
      wrap-cells
      :grid="$q.screen.xs"
      :title="t('document', 2)"
      :name="t('document')"
      :page="documents"
      :loading="loading"
      :columns="cols"
      :create="false"
      :filterable="!querySearch"
      @request="reload"
      @row-clicked="routeToDocument($event)"
    >
      <template
        v-if="querySearch"
        #searchQuery
      >
        <q-space />
        <q-btn
          color="primary"
          no-caps
          :label="$q.screen.gt.xs ? (queryDisplayName) : ''"
        >
          <q-menu>
            <q-list dense>
              <q-item v-close-popup clickable @click="clearQueryResults">
                <q-item-section>
                  {{ t('clearDocumentQueryResult') }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
      <template #row-cells="rowCellProps">
        <q-td :title="rowCellProps.row.id">
          {{ rowCellProps.row.name }}
        </q-td>
        <q-td>
          {{ rowCellProps.row.text }}
        </q-td>
      </template>
    </table-with-actions>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, computed } from 'vue'
import TableWithActions from 'components/TableWithActions.vue'
import DocumentDetailsDialog from 'components/Documents/DocumentDetailsDialog.vue'
import { useI18n } from 'vue-i18n'
import useNotify from 'src/mixins/useNotify'
import { DocumentApiKey } from 'boot/axios'
import { DocumentPage, Document} from '@onto-med/top-api'
import { QTableProps, useQuasar } from 'quasar'
import { SearchTypesEnum } from 'src/config'
import { useRouter } from 'vue-router'

const props = defineProps<{
  organisationId?: string,
  repositoryId?: string,
  queryId?: string,
  queryName?: string
}>()

defineEmits(['clearQueryResults'])

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const { renderError } = useNotify()
const loading = ref(false)
const querySearch = ref(false)
const queryDisplayName = ref('')
const documentApi = inject(DocumentApiKey)
const documents = ref<DocumentPage>({
  content: [],
  number: 1,
  size: 0,
  totalElements: 0,
  totalPages: 0,
  type: 'document'
})

function routeToDocument(document: Document) {
  $q.dialog({
    component: DocumentDetailsDialog,
    componentProps: {
      document
    }
  })
}

const cols = computed(() => [
  { name: 'actions' },
  { name: 'name', field: 'name', label: t('name'), align: 'left' },
  { name: 'text', field: 'text', label: t('content'), align: 'left' },
] as QTableProps['columns'])

onMounted(() => reload())

function reload(filter: string|undefined = undefined, page = 1) {
  if (!documentApi) return
  loading.value = true
  const searchByQuery = !!(props.organisationId && props.repositoryId && props.queryId)

  var promise = undefined
  if (searchByQuery) {
    queryDisplayName.value = props.queryName || ''
    promise = documentApi.getDocumentsForQuery(props.organisationId, props.repositoryId, props.queryId, page)
  } else {
    promise = documentApi.getDocuments(undefined, filter ? [filter] : undefined, undefined, page)
  }

  promise.then(r => documents.value = r.data)
    .catch((e: Error) => renderError(e))
    .finally(() => {
      loading.value = false
      querySearch.value = searchByQuery
    })
}

function clearQueryResults() {
  void router.replace({
    name: 'documentSearch',
    query: { searchType: SearchTypesEnum.SEARCH_QUERY },
  }).then(() => reload())
}
</script>
