<template>
  <q-page>
    <q-table
      class="sticky-header-table"
      :rows="organisations"
      :columns="columns"
      :loading="loading"
      :pagination="initialPagination"
      :no-data-label="t('noDataPresent')"
      row-key="id"
    />
  </q-page>
</template>

<script lang="ts">
import { Organisation } from '@onto-med/top-api'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'OrganisationTable',
  props: {
    organisations: Array as () => Organisation[],
    loading: Boolean
  },
  setup() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    const columns = [
      { name: 'name', field: 'name', label: t('name'), align: 'left', required: true, sortable: true },
      { name: 'description', field: 'description', label: t('description'), align: 'left', sortable: true },
      { name: 'createdAt', field: 'createdAt', label: t('createdAt'), sortable: true }
    ]

    return {
      t,
      initialPagination: { sortBy: 'name', descenting: false, page: 1, rowsPerPage: 10 },
      columns: columns
    }
  },
})
</script>
