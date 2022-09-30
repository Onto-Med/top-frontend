<template>
  <q-page class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('document', 2) }}
        </div>
      </q-card-section>
      <q-card-section>
        {{ t('documentPage.description') }}
      </q-card-section>
    </q-card>

    <table-with-actions
      :rows="documents"
      :columns="columns"
      :loading="loading"
      @reload-clicked="reload()"
    >
      <template #row-cells="{ row }">
        <q-td auto-width>
          {{ row.id }}
        </q-td>
        <q-td>{{ row.text }}</q-td>
      </template>
    </table-with-actions>
  </q-page>
</template>

<script lang="ts">
import {computed, defineComponent, inject, onMounted, ref} from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentApiKey } from 'src/boot/axios'
import { Document } from '@onto-med/top-api';
import TableWithActions from 'components/TableWithActions.vue';

export default defineComponent({
  name: 'DocumentSearch',
  components: {
    TableWithActions,
  },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const documentApi = inject(DocumentApiKey)
    const documents   = ref<Document[]>([])
    const loading   = ref(false)
    const columns = computed(() => [
      { name: 'actions', sortable: false },
      { name: 'docId', label: t('document'), align: 'left', required: true, sortable: true },
      { name: 'docText', label: t('string'), align: 'left', sortable: false },
    ])

    const reload = async () => {
      if (!documentApi) return
      loading.value = true
      await documentApi.getDocuments()
        .then(r => documents.value = r.data)
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      documents,
      loading,
      columns,
      reload,
      alert
    }
  }
})
</script>
