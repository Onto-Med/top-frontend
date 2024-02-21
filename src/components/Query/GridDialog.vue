<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent full-width full-height>
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <ag-grid-vue :rowData="rowData" :columnDefs="colDefs" style="height: 500px" class="ag-theme-quartz">
        </ag-grid-vue>
      </q-card-section>
      <q-separator />
      <!--
        ...content
        ... use q-card-section for it?
      -->
      <!-- buttons example -->
      <q-card-actions align="right">
        <q-btn color="primary" label="OK" @click="onOKClick" />
        <q-btn color="primary" label="Cancel" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable vue/no-unused-components*/
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useDialogPluginComponent } from 'quasar'
import 'ag-grid-community/styles/ag-grid.css' // Core CSS
import 'ag-grid-community/styles/ag-theme-quartz.css' // Theme
import { AgGridVue } from 'ag-grid-vue3' // Vue Grid Logic
import { ref } from 'vue'

const props = defineProps({
  csv: String
  // ...your custom props
})

const rowData = ref([
  { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
  { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
  { make: 'Toyota', model: 'Corolla', price: 29600, electric: false }
])

// Column Definitions: Defines & controls grid columns.
const colDefs = ref([{ field: 'make' }, { field: 'model' }, { field: 'price' }, { field: 'electric' }])

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

// this is part of our example (so not required)
function onOKClick() {
  // on OK, it is REQUIRED to
  // call onDialogOK (with optional payload)
  onDialogOK()
  // or with payload: onDialogOK({ ... })
  // ...and it will also hide the dialog automatically
}
</script>