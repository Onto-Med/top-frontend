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
        <q-select
          v-model="entry"
          :options="entryOptions"
          :label="t('selectThing', { thing: t('fileToDisplay') })"
          @update:model-value="loadEntry"
        />
        <ag-grid-vue
          :row-data="rows"
          :column-defs="colDefs"
          :default-col-def="defaultColDef"
          :column-types="columnTypes"
          suppress-field-dot-notation
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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Query } from '@onto-med/top-api'
import * as zip from '@zip.js/zip.js'
import useNotify from 'src/mixins/useNotify'

const props = defineProps<{
  entries: zip.Entry[]
  query: Query
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { dialogRef, onDialogHide } = useDialogPluginComponent()
const { renderError } = useNotify()
const subjectsFileName = 'data_subjects.csv'
const rows = ref<Array<Array<string>>>([])
const entry = ref<string>()

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

const entryOptions = computed(() => props.entries.map((e) => e.filename))

const isEmpty = computed(() => rows.value.length == 0)

const colDefs = computed(() => {
  if (isEmpty.value) return []
  const keys = Object.keys(rows.value[0])
  return keys.map((key) => colDef(key))
})

onMounted(() => {
  if (props.entries.find((e) => e.filename == subjectsFileName)) entry.value = subjectsFileName
  else entry.value = props.entries[0]?.filename
  loadEntry()
})

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

function loadEntry() {
  const csv = props.entries.filter((e) => e.filename === entry.value)[0]
  const writer = new zip.TextWriter()
  csv?.getData!(writer)
    .then(
      (data) =>
        (rows.value = Papa.parse(data, { header: true, delimiter: ';', skipEmptyLines: true }).data as Array<
          Array<string>
        >)
    )
    .catch((e: Error) => renderError(e))
}
</script>

<style lang="sass" scoped>
.ag-theme-quartz
  width: 100%
  height: calc(100vh - 203px)
</style>
