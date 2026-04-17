<template>
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
</template>

<script setup lang="ts">
import { QTableProps } from 'quasar'
import { useI18n } from 'vue-i18n'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  files: {
    type: Array as () => File[],
    default: () => [],
  },
  language: {
    type: String as () => string | undefined,
    default: () => undefined,
  },
})

const rows = ref([] as FileDescription[])

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
  console.log(newLocale)
})

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
