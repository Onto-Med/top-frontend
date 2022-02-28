<template>
  <q-page>
    <q-table
      class="sticky-header-table"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :pagination="initialPagination"
      :no-data-label="t('noDataPresent')"
      row-key="id"
    >
      <template #header="props">
        <q-tr :props="props">
          <q-th auto-width />
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template #body="props">
        <q-tr class="cursor-pointer" :props="props" @click="$emit('row-clicked', props.row)">
          <q-td auto-width>
            <slot :row="props.row" />
          </q-td>
          <q-td>{{ props.row.name || props.row.id }}</q-td>
          <q-td>{{ props.row.description }}</q-td>
          <q-td>{{ d(props.row.createdAt, 'long') }}</q-td>
        </q-tr>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'TableWithActions',
  props: {
    rows: Array,
    loading: Boolean
  },
  emits: ['row-clicked'],
  setup() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d } = useI18n()

    return {
      t,
      d,
      initialPagination: { sortBy: 'name', descenting: false, page: 1, rowsPerPage: 10 },
      columns: computed(() => [
        { name: 'name', field: 'name', label: t('name'), align: 'left', required: true, sortable: true },
        { name: 'description', field: 'description', label: t('description'), align: 'left', sortable: true },
        { name: 'createdAt', field: 'createdAt', label: t('createdAt'), align: 'left', sortable: true }
      ])
    }
  },
})
</script>
