<template>
  <q-dialog ref="dialogRef" persistent full-width full-height @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('dataOfQuery', { thing: query.name }) }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <ag-grid-vue
          :row-data="rows"
          :column-defs="colDefs"
          :default-col-def="defaultColDef"
          :column-types="columnTypes"
          class="ag-theme-quartz"
        >
        </ag-grid-vue>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import 'ag-grid-community/styles/ag-grid.css' // Core CSS
import 'ag-grid-community/styles/ag-theme-quartz.css' // Theme
import { AgGridVue } from 'ag-grid-vue3' // Vue Grid Logic
import Papa from 'papaparse'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Query } from '@onto-med/top-api'

const props = defineProps<{
  csv: string
  query: Query
}>()

defineEmits([
  ...useDialogPluginComponent.emits
])

const { t } = useI18n()
const { dialogRef, onDialogHide } = useDialogPluginComponent()
const rows = computed(() => Papa.parse(props.csv, { header: true, delimiter: ';' }).data as Array<Array<string>>)
const colDefs = computed(() => {
  const keys = Object.keys(rows.value[0])
  return keys.map((key) => colDef(key))
})

const defaultColDef = {
  editable: false,
  sortable: true,
  filter: 'agNumberColumnFilter'
}
const columnTypes = {
  idColumn: { filter: 'agTextColumnFilter' },
  dateColumn: {
    filter: 'agDateColumnFilter',
    cellDataType: 'dateString'
  }
}

function colDef(fieldName: string) {
  let type = undefined
  if (fieldName == 'Id') {
    type = 'idColumn'
  }
  if (fieldName.includes('(DATE)')) {
    type = 'dateColumn'
  }
  return {
    field: fieldName,
    type
  }
}
</script>

<style lang="sass" scoped>
.ag-theme-quartz
  width: 100%
  height: calc(100vh - 147px)
</style>