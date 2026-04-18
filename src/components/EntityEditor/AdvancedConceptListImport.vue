<template>
    <q-table :rows="rows" :columns="cols" flat hide-pagination row-key="id">
      <template v-slot:top>
        <q-btn size="sm" color="primary" :label="t('addThing', {thing: t('hierarchy')})" :disable="maxHierarchyReached" @click="addHierarchy" />
        <q-btn
          size="sm"
          v-if="rows.length !== 0"
          class="q-ml-sm"
          color="primary"
          :label="t('removeThing', {thing: t('hierarchy')})"
          :disable="hierarchyCount <= 0"
          @click="removeHierarchy"
        />
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="name" :props="props">{{ props.row.name }}</q-td>
          <q-td key="language" :props="props">
            {{ props.row.language }}
            <q-popup-edit dense buttons v-model="props.row.language" v-slot="scope">
              <q-list padding dense class="rounded-borders text-primary">
                <q-item
                  v-for="(item, index) in languages"
                  clickable
                  v-ripple
                  :key="index"
                  :active="scope.value === item.value"
                  @click="scope.value = item.value"
                  active-class="my-menu-link"
                >
                  <q-item-section>
                    {{item.label}}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-popup-edit>
          </q-td>
          <q-td
            v-for="index in hierarchyCount"
            :key="index"
          >
            <q-popup-edit dense buttons v-model="props.row.hierarchy[index]" v-slot="scope">
              <q-input
                :model-value=scope.value
                dense
                autofocus
                @keyup.enter="scope.set"
              />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </q-table>
</template>

<script setup lang="ts">
import { QTableProps } from 'quasar'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import { languages } from 'src/config'

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

const { t, locale } = useI18n()

const rows = ref([] as FileDescription[])

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

const maxHierarchy = 3
const hierarchyCount = ref(0)
const maxHierarchyReached = computed(() => hierarchyCount.value >= maxHierarchy)

onMounted(() => {
  rows.value = props.files.map(
      (fi) =>
        ({
          name: fi.name,
          language: props.language === undefined ? locale.value : props.language,
          hierarchy: new Array(maxHierarchy)
        }) as FileDescription,
    )
  }
)

function updateHierarchy(val: string, hierarchyList: string[], index: number) {
  console.log(val)
  console.log(hierarchyList)
  hierarchyList.splice(index, 0, val)
  console.log(hierarchyList)
  return true
}

function addHierarchy() {
  if (maxHierarchyReached.value) return
  hierarchyCount.value += 1
  cols.value?.push({
    name: 'hierarchy' + hierarchyCount.value,
    label: t('hierarchy') + ' ' + hierarchyCount.value,
    field: '',
    align: 'left',
  })
}

function removeHierarchy() {
  const index = cols.value?.findIndex(c => c.name === ('hierarchy' + hierarchyCount.value))
  if (index !== undefined && index !== -1) {
    cols.value?.splice(index, 1)
  }
  hierarchyCount.value -= 1
}

interface FileDescription {
  name: string
  language: string
  hierarchy: string[]
}
</script>

<style scoped lang="scss">
.my-menu-link {
  color: white;
  background: $primary
}
</style>
