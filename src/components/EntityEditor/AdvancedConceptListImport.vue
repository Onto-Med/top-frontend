<template>
  <p>
    <small>
      {{ t('entityImport.concept.description.advancedDescription') }}
    </small>
  </p>
  <q-table
    :rows="rows.filter((row) => row.name.endsWith('.txt'))"
    :columns="cols"
    :no-data-label="t('noDataPresent')"
    flat
    dense
    row-key="id"
    class="q-pa-none"
  >
    <template v-slot:top>
      <q-btn
        size="sm"
        color="primary"
        :label="t('addThing', { thing: t('hierarchy') })"
        :disable="maxHierarchyReached"
        @click="addHierarchy"
      />
      <q-btn
        size="sm"
        v-if="rows.length !== 0"
        class="q-ml-sm"
        color="primary"
        :label="t('removeThing', { thing: t('hierarchy') })"
        :disable="hierarchyCount <= 0"
        @click="removeHierarchy"
      />
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="name" class="non-selectable" :props="props">{{ props.row.name }}</q-td>
        <q-td key="language" class="cursor-pointer" :props="props">
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
                  {{ item.label }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-popup-edit>
        </q-td>
        <q-td key="nameAsTitle" :props="props">
          <q-toggle dense v-model="props.row.nameAsTitle" />
        </q-td>
        <q-td v-for="i in hierarchyCount" :key="i" class="cursor-pointer">
          {{ props.row.hierarchy[i - 1] }}
          <q-popup-edit
            dense
            buttons
            v-model="props.row.hierarchy[i - 1]"
            v-slot="scope"
            @save="pushTag(i, $event)"
          >
            <div>
              <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set">
                <template v-slot:append>
                  <q-icon name="close" @click="scope.value = ''" />
                </template>
              </q-input>
            </div>
            <div class="q-pt-sm">
              <q-chip
                v-for="(tag, j) in getTagsForHierarchy(i)"
                :key="j"
                dense
                clickable
                removable
                @click="scope.value = tag"
                @remove="removeTag(i, tag)"
              >
                {{ tag }}
              </q-chip>
            </div>
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
const hierarchyTags = ref(new Map<number, Set<string>>())
defineExpose({ rows, hierarchyTags })

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
    align: 'center',
  },
  {
    name: 'nameAsTitle',
    label: t('entityImport.concept.nameAsTitleCaption'),
    field: (row: FileDescription) => row.nameAsTitle,
    required: true,
    align: 'center',
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
        nameAsTitle: false,
        hierarchy: new Array(maxHierarchy),
      }) as FileDescription,
  )
})

function getTagsForHierarchy(hierarchy: number) {
  const tags = hierarchyTags.value.get(hierarchy)
  if (tags === undefined) return []
  return [...tags].filter((t) => t != undefined && t.length > 0).toSorted()
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
  hierarchyTags.value.set(hierarchyCount.value, new Set())
}

function removeHierarchy() {
  const index = cols.value?.findIndex((c) => c.name === 'hierarchy' + hierarchyCount.value)
  if (index !== undefined && index !== -1) {
    cols.value?.splice(index, 1)
  }
  rows.value.forEach((row: FileDescription) => {
    row.hierarchy[hierarchyCount.value - 1] = ''
  })
  hierarchyCount.value -= 1
}

function pushTag(idx: number, val: string) {
  if (val.length <= 0) return
  hierarchyTags.value.get(idx)?.add(val)
}

function removeTag(idx: number, val: string) {
  hierarchyTags.value.get(idx)?.delete(val)
}

export interface FileDescription {
  name: string
  language: string
  nameAsTitle: boolean
  hierarchy: string[]
}
</script>

<style scoped lang="scss">
.my-menu-link {
  color: white;
  background: $primary;
}
</style>
