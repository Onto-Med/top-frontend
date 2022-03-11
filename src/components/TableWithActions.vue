<template>
  <q-page>
    <q-table
      class="sticky-header-table"
      :rows="rows"
      :columns="cols"
      :loading="loading"
      :pagination="initialPagination"
      :filter="filter"
      :no-data-label="t('noDataPresent')"
      row-key="id"
    >
      <template #top>
        <q-btn color="primary" :disabled="loading" :label="t('reload')" icon="refresh" @click="$emit('reload-clicked')" />
        <q-space />
        <q-input v-model="filter" dense debounce="300" color="primary">
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template #header="props">
        <q-tr :props="props">
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
            <slot name="actions" :row="props.row" />
          </q-td>
          <slot name="row-cells" :row="props.row">
            <q-td>{{ props.row.name || props.row.id }}</q-td>
            <q-td>{{ props.row.description }}</q-td>
            <q-td>{{ d(props.row.createdAt, 'long') }}</q-td>
          </slot>
        </q-tr>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'TableWithActions',
  props: {
    rows: Array,
    columns: Array,
    loading: Boolean
  },
  emits: ['row-clicked', 'reload-clicked'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d } = useI18n()

    return {
      t,
      d,
      filter: ref(''),
      initialPagination: { sortBy: 'name', descenting: false, page: 1, rowsPerPage: 10 },
      cols: computed(() => {
        if (props.columns) return props.columns
        return [
          { name: 'actions', sortable: false },
          { name: 'name', field: 'name', label: t('name'), align: 'left', required: true, sortable: true },
          { name: 'description', field: 'description', label: t('description'), align: 'left', sortable: true },
          { name: 'createdAt', field: 'createdAt', label: t('createdAt'), align: 'left', sortable: true }
        ]
      })
    }
  },
})
</script>
