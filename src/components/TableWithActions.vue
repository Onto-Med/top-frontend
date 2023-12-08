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
        flat
        hide-pagination
        row-key="id"
      >
        <template #top>
          <div class="text-h6">
            {{ title || name }}
          </div>
          <slot name="searchQuery" />
          <q-space />
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
          <q-btn-group>
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
              <q-td :title="t('createdAt', { date: d(props.row.createdAt, 'long') })">
                {{ d(props.row.updatedAt, 'long') }}
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
          {{ t('resultCountWithTotal', { count: page.content.length, total: page.totalElements }) }}
        </b>
        <q-pagination
          :model-value="page.number"
          :max="page.totalPages"
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

<script lang="ts">
import { QTableProps } from 'quasar'
import { defineComponent, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentPage, OrganisationPage, RepositoryPage } from '@onto-med/top-api'

export default defineComponent({
  props: {
    /** The title to be displayed above the table. It is recommended to use a plural noun. */
    title: String,
    /** The name to be used for button labels. It should be singular noun. */
    name: String,
    /** The page holding the content if the table. */
    page: {
      type: Object as () => OrganisationPage|RepositoryPage|DocumentPage,
      required: true
    },
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
  },
  emits: ['row-clicked', 'create-clicked', 'request'],
  setup(props, { emit }) {
    const { t, d } = useI18n()
    const filter = ref('')

    return {
      t,
      d,
      filter,

      cols: computed(() => {
        if (props.columns) return props.columns
        return [
          { name: 'actions' },
          { name: 'name', field: 'name', label: t('name'), align: 'left', required: true },
          { name: 'description', field: 'description', label: t('description'), align: 'left' },
          { name: 'updatedAt', field: 'updatedAt', label: t('updatedAt'), align: 'left' }
        ] as QTableProps['columns']
      }),

      rows: computed(() => props.page?.content),

      onPageSelect (page: number) {
        emit('request', filter.value, page)
      },

      onFilter () {
        emit('request', filter.value, 1)
      },

      reload () {
        filter.value = ''
        emit('request', undefined, 1)
      }
    }
  }
})
</script>
