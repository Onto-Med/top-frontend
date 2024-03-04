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
            <div v-if="title" class="text-h6">
              {{ title }}
            </div>
          </slot>
          <q-space v-if="title" />
          <div :class="{ 'col': !title }">
            <q-input
              v-if="filterable"
              v-model="filter"
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
              :disabled="loading"
              :label="$q.screen.gt.xs ? t('createThing', { thing: name }) : ''"
              icon="add"
              @click="$emit('create-clicked')"
            />
            <q-btn
              color="secondary"
              :disabled="loading"
              :label="$q.screen.gt.xs ? t('reload') : ''"
              icon="refresh"
              @click="reload()"
            />
          </q-btn-group>
        </template>
        <template #header="headerProps">
          <q-tr :props="headerProps">
            <q-th v-for="col in headerProps.cols" :key="col.name" :props="headerProps" class="bg-grey-1">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
        <template #body="bodyProps">
          <q-tr class="cursor-pointer" :props="bodyProps" @click="$emit('row-clicked', bodyProps.row)">
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
          {{ t('resultCountWithTotal', { count: page?.content.length || 0, total: page?.totalElements || 0 }) }}
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
    default: true
  },
  /** Wrap text within table cells. */
  wrapCells: Boolean
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
    { name: 'updatedAt', field: 'updatedAt', label: t('updatedAt'), align: 'left' }
  ] as QTableProps['columns']
})

const rows = computed(() => props.page?.content)

function onPageSelect(page: number) {
  emit('request', filter.value, page)
}

function onFilter() {
  emit('request', filter.value, 1)
}

function reload() {
  filter.value = ''
  emit('request', undefined, 1)
}
</script>

<style lang="sass">
.sticky-header-table
  max-height: 72vh

  thead tr th
    position: sticky
    z-index: 1
    border-top-width: 1px !important
  thead tr:first-child th
    top: 0
  &.q-table--loading thead tr:last-child th
    top: 48px
</style>
