<template>
  <q-dialog ref="dialogRef" persistent full-width full-height @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <ag-grid-vue
          :row-data="rows"
          :column-defs="colDefs"
          :default-col-def="defaultColDef"
          :column-types="columnTypes"
          style="width: 100%; height: 90vh"
          class="ag-theme-quartz"
        >
        </ag-grid-vue>
      </q-card-section>
      <q-separator />
      <!--
        ...content
        ... use q-card-section for it?
      -->
      <!-- buttons example -->
      <q-card-actions align="right">
        <q-btn color="primary" :label="t('close')" @click="onDialogHide" />
      </q-card-actions>
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

const props = defineProps<{
  csv: string
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
