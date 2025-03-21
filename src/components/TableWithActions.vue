<template>
  <q-card>
    <q-card-section class="q-pa-none">
      <q-table
        :rows="rows"
        :columns="cols"
        :loading="loading"
        :no-data-label="t('noDataPresent')"
        :rows-per-page-options="[0]"
        :wrap-cells="wrapCells"
        class="sticky-header-table"
        flat
        hide-pagination
        row-key="id"
      >
        <template #top>
          <slot name="title">
            <div v-if="title" class="ellipsis" :class="titleClass">
              {{ title }}
            </div>
          </slot>
          <q-space v-if="title" />
          <div :class="{ col: !title }">
            <q-input
              v-if="filterable"
              v-model="filter"
              :disable="disable"
              :label="t('searchThing', { thing: title || name })"
              dense
              debounce="300"
              color="primary"
              class="q-pr-md"
              @update:model-value="onFilter"
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <q-space v-if="!title" />
          <q-btn-group>
            <slot name="action-buttons" />
            <q-btn
              v-if="create"
              color="primary"
              :disabled="loading || disable"
              :label="$q.screen.gt.xs ? t('createThing', { thing: name }) : ''"
              icon="add"
              no-wrap
              @click="$emit('create-clicked')"
            />
            <q-btn
              color="secondary"
              :disabled="loading || disable"
              :label="$q.screen.gt.xs ? t('reload') : ''"
              icon="refresh"
              no-wrap
              @click="reload()"
            />
          </q-btn-group>
        </template>
        <template #header="headerProps">
          <q-tr :props="headerProps">
            <q-th
              v-for="col in headerProps.cols"
              :key="col.name"
              :props="headerProps"
              class="bg-grey-1"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
        <template #body="bodyProps">
          <q-tr class="cursor-pointer" :props="bodyProps" @click="onRowClick(bodyProps.row)">
            <q-td auto-width>
              <slot name="actions" :row="bodyProps.row" />
            </q-td>
            <slot name="row-cells" :row="bodyProps.row">
              <q-td>{{ bodyProps.row.name || bodyProps.row.id }}</q-td>
              <q-td>{{ bodyProps.row.description }}</q-td>
              <q-td :title="t('createdAt', { date: d(bodyProps.row.createdAt, 'long') })">
                {{ d(bodyProps.row.updatedAt, 'long') }}
              </q-td>
            </slot>
          </q-tr>
        </template>
        <template v-if="$slots.footer" #bottom-row>
          <q-tr>
            <q-td colspan="100%">
              <slot name="footer" />
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <div class="row justify-end items-center">
        <b class="text-grey-8">
          {{
            t('resultCountWithTotal', {
              count: page?.content.length || 0,
              total: page?.totalElements || 0,
            })
          }}
        </b>
        <q-pagination
          :model-value="page?.number || 0"
          :max="page?.totalPages || 0"
          boundary-links
          direction-links
          color="grey-8"
          size="sm"
          class="q-ml-sm"
          @update:model-value="onPageSelect"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { QTableProps } from 'quasar'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentPage, OrganisationPage, RepositoryPage } from '@onto-med/top-api'

const props = defineProps({
  /** The title to be displayed above the table. It is recommended to use a plural noun. */
  title: String,
  /** Class to be used for the title. Defaults to 'text-h6'. */
  titleClass: {
    type: String,
    default: 'text-h6',
  },
  /** The name to be used for button labels. It should be singular noun. */
  name: String,
  /** The page holding the content if the table. */
  page: Object as () => OrganisationPage | RepositoryPage | DocumentPage,
  columns: Array as () => QTableProps['columns'],
  loading: Boolean,
  /** Whether creating new entries is allowed. A respective button is displayed if true. */
  create: Boolean,
  /** Whether a search field is enabled */
  filterable: {
    type: Boolean,
    default: true,
  },
  /** Wrap text within table cells. */
  wrapCells: Boolean,
  /** Whether buttons and input fields should be disabled. */
  disable: Boolean,
})

const emit = defineEmits(['row-clicked', 'create-clicked', 'request'])

const { t, d } = useI18n()
const filter = ref('')

const cols = computed(() => {
  if (props.columns) return props.columns
  return [
    { name: 'actions' },
    { name: 'name', field: 'name', label: t('name'), align: 'left', required: true },
    { name: 'description', field: 'description', label: t('description'), align: 'left' },
    { name: 'updatedAt', field: 'updatedAt', label: t('updatedAt'), align: 'left' },
  ] as QTableProps['columns']
})

const rows = computed(() => props.page?.content || [])

function onPageSelect(page: number) {
  if (props.disable) return
  emit('request', filter.value, page)
}

function onFilter() {
  if (props.disable) return
  emit('request', filter.value, 1)
}

function onRowClick(row: unknown) {
  if (props.disable) return
  emit('row-clicked', row)
}

function reload() {
  if (props.disable) return
  filter.value = ''
  emit('request', undefined, 1)
}
</script>

<style lang="scss">
.sticky-header-table {
  max-height: 69vh;

  .q-table__top {
    flex-wrap: nowrap;
    min-height: 64px;
  }
  thead tr th {
    position: sticky;
    z-index: 1;
    border-top-width: 1px !important;
  }
  thead tr:first-child th {
    top: 0;
  }
  &.q-table--loading thead tr:last-child th {
    top: 48px;
  }
}
</style>
