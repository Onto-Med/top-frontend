<template>
  <q-card-section class="q-pa-none">
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
          :label="$q.screen.gt.xs ? (queryDisplayName) : ''"
        >
          <q-menu>
            <q-list dense>
              <q-item v-close-popup clickable @click="$emit('clearQueryResults')">
                <q-item-section>
                  {{ t('clearDocumentQueryResult') }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
      <template #row-cells="props">
        <tr>
          <q-td>
            {{ props.row.id }}
          </q-td>
          <q-td>
            {{ props.row.name }}
          </q-td>
          <q-td>
            {{ props.row.text }}
          </q-td>
        </tr>
      </template>
    </table-with-actions>
  </q-card-section>
</template>

<script lang="ts">
import {defineComponent, inject, ref, onMounted, onUpdated} from 'vue';
import TableWithActions from 'components/TableWithActions.vue';
import {useI18n} from 'vue-i18n';
import useNotify from 'src/mixins/useNotify';
import {DocumentApiKey} from 'boot/axios';
import {DocumentPage, Permission, Document} from '@onto-med/top-api';
import {QTableProps} from 'quasar';
import {storeToRefs} from 'pinia';
import {useEntity} from 'src/pinia/entity';

export default defineComponent({
  components: {
    TableWithActions,
    // PermissionIcon
  },
  props: {
    organisationId: String,
    repositoryId: String,
    queryId: String,
    queryName: String
  },
  emits: ['clearQueryResults'],
  setup (props) {
    const { t }     = useI18n()
    const { renderError } = useNotify()
    const loading   = ref(false)
    const querySearch = ref(false)
    const queryDisplayName = ref('')
    const documentApi = inject(DocumentApiKey)
    const documents   = ref<DocumentPage>({
      content: [],
      number: 1,
      size: 0,
      totalElements: 0,
      totalPages: 0,
      type: 'document'
    })
    const { isAuthenticated } = storeToRefs(useEntity())

    const routeToDocument = (document: Document) => {
      console.log(document.id)
    }

    const reload = async (filter: string|undefined = undefined, page = 1) => {
      if (!documentApi) return
      loading.value = true
      if (!(props.organisationId && props.repositoryId && props.queryId)) {
        await documentApi.getDocuments(undefined, filter? [filter] : undefined, undefined, page)
          .then( r => { documents.value = r.data } )
          .catch( (e: Error) => { renderError(e) } )
          .finally( () => {
            loading.value = false
            querySearch.value = false
            queryDisplayName.value = ''
          } )
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await documentApi.getDocumentsForQuery(props.organisationId, props.repositoryId, props.queryId, page)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
          .then(r => documents.value = r.data)
          .catch( (e: Error) => { renderError(e) } )
          .finally( () => {
            loading.value = false
            querySearch.value = true
            queryDisplayName.value = props.queryName? props.queryName: ''
          } )
      }
    }

    const cols = [
      { name: 'actions'},
      { name: 'id', field: 'id', label: 'id', align: 'left' },
      { name: 'name', field: 'name', label: t('name'), align: 'left' },
      { name: 'text', field: 'text', label: 'Content', align: 'left' },
    ] as QTableProps['columns']

    onMounted(async () => {
      await reload()
    })

    onUpdated( async() => {
      await reload()
    })

    return {
      t,
      documents,
      loading,
      reload,
      cols,
      isAuthenticated,
      Permission,
      querySearch,
      queryDisplayName,
      routeToDocument
    }
  }
})
</script>
