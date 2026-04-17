<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="dialog-content">
      <q-table :rows="rows" :columns="cols" flat hide-pagination row-key="id">
        <template v-slot:top>
          <q-btn size="sm" color="primary" label="Add Hierarchy" @click="addHierarchy" />
          <q-btn
            size="sm"
            v-if="rows.length !== 0"
            class="q-ml-sm"
            color="primary"
            label="Remove Hierarchy"
            @click="removeHierarchy"
          />
        </template>
      </q-table>
      <q-card-actions align="right">
        <q-btn flat :label="t('cancel')" color="primary" @click="onCancelClick" />
        <q-btn flat :label="t('import')" color="primary" @click="onOkClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { QTableProps, useDialogPluginComponent } from 'quasar'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  files: {
    type: Array as () => FileDescription[],
    default: () => [],
  },
  language: {
    type: String as () => string | undefined,
    default: () => undefined,
  },
})

const rows = ref([] as FileDescription[])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t, locale } = useI18n()

const cols = ref([
  {
    name: 'name',
    label: t('file'),
    field: (row: FileDescription) => row.name,
    required: true,
    align: 'left',
    sortable: true,
  },
  {
    name: 'language',
    label: t('language'),
    field: (row: FileDescription) => row.language,
    required: true,
    align: 'left',
  },
] as QTableProps['columns'])

watch(locale, (newLocale) => {
  if (cols.value) {
    const nameCol = cols.value.find(c => c.name === 'name')
    if (nameCol) nameCol.label = t('file')
    const langCol = cols.value.find(c => c.name === 'language')
    if (langCol) langCol.label = t('language')
  }
})
const onCancelClick = onDialogCancel

onMounted(() => {
  rows.value = props.files.map(
      (fi) =>
        ({
          name: fi.name,
          language: props.language === undefined ? locale.value : props.language,
        }) as FileDescription,
    )
  }
)

function onOkClick() {
  onDialogOK()
}

function addHierarchy() {
  if (cols.value?.some(c => c.name === 'hierarchy')) return
  cols.value?.push({
    name: 'hierarchy',
    label: 'Hierarchy',
    field: (row: FileDescription) => row.hierarchy?.join(', '),
    align: 'left',
  })
}

function removeHierarchy() {
  const index = cols.value?.findIndex(c => c.name === 'hierarchy')
  if (index !== undefined && index !== -1) {
    cols.value?.splice(index, 1)
  }
}

interface FileDescription {
  name: string
  language: string
  hierarchy?: string[]
}
</script>

<style scoped lang="scss"></style>
