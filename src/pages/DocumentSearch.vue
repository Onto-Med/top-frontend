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

    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('concept', 2) }}
        </div>
      </q-card-section>

      <q-separator />

      <div class="fit row wrap justify-center items-start content-start">
        <q-card>
          <q-card-section>
            Hello
          </q-card-section>
        </q-card>
        <q-card>
          <q-card-section>
            you
          </q-card-section>
        </q-card>
      </div>
<!--      <q-card-actions align="right">-->
<!--        <q-btn flat>Action 1</q-btn>-->
<!--        <q-btn flat>Action 2</q-btn>-->
<!--      </q-card-actions>-->
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
      { name: 'docPhrases', label: t('phrase'), align: 'left', sortable: false },
    ])

    const reload = async () => {
      if (!documentApi) return
      loading.value = true
      await documentApi.getDocuments(undefined, undefined, 0, 20) // ToDo: Read these numbers from table values
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
