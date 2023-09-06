<template>
  <q-card-section class="row q-pa-none">
    <table-with-actions
      :title="t('document', 2)"
      :name="t('document')"
      :page="documents"
      :loading="loading"
      :columns="cols"
      :create="false"
      @request="reload"
    />
  </q-card-section>
</template>

<script lang="ts">
import {defineComponent, inject, ref} from 'vue';
import TableWithActions from 'components/TableWithActions.vue';
import {useI18n} from 'vue-i18n';
import useNotify from 'src/mixins/useNotify';
import {DocumentApiKey} from 'boot/axios';
import {DocumentPage, Permission} from '@onto-med/top-api';
import {QTableProps} from 'quasar';
import {storeToRefs} from 'pinia';
import {useEntity} from 'src/pinia/entity';

export default defineComponent({
  components: {
    TableWithActions,
    // PermissionIcon
  },
  setup () {
    const { t }     = useI18n()
    const { renderError } = useNotify()
    const loading   = ref(false)
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

    const reload = async (page = 1) => {
      if (!documentApi) return
      loading.value = true
      await documentApi.getDocuments(undefined, undefined, page)
        .then(
          r => {
            documents.value = r.data
          }
        )
        .catch(
          (e: Error) => {
            renderError(e)
          }
        )
        .finally(
          () => {
            console.log(documents.value)
            loading.value = false
          }
        )
    }

    const cols = [
      { name: 'id', field: 'id', label: 'id', align: 'left' },
      { name: 'name', field: 'name', label: t('name'), align: 'left' },
      { name: 'highlightedText', field: 'highlightedText', label: 'Content', align: 'left' },
    ] as QTableProps['columns']

    return {
      t,
      documents,
      loading,
      reload,
      cols,
      isAuthenticated,
      Permission,
    }
  }
})
</script>
