<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card>
      <q-table
        class="sticky-header-table"
        :title="t('versionHistory')"
        :rows="versions"
        :columns="columns"
        :no-data-label="t('noDataPresent')"
        row-key="versionId"
      >
        <template #header="headerProps">
          <q-tr :props="headerProps">
            <q-th class="bg-grey-1" auto-width />
            <q-th class="bg-grey-1"> # </q-th>
            <q-th v-for="col in headerProps.cols" :key="col.name" :props="headerProps" class="bg-grey-1">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body="bodyProps">
          <q-tr
            v-close-popup
            :props="bodyProps"
            :title="t('showThing', { thing: t('version') })"
            class="cursor-pointer"
            :class="{ 'bg-secondary': bodyProps.row.version === selectedVersion }"
            @click="$emit('prefill', bodyProps.row)"
          >
            <q-td auto-width>
              <q-btn
                v-if="!readonly && currentVersion && bodyProps.row.version !== currentVersion"
                size="sm"
                color="red"
                round
                dense
                flat
                icon="delete"
                :title="t('deleteThing', { thing: t('version') })"
                @click.stop="deleteVersion(bodyProps.row)"
              />
              <b v-else-if="currentVersion && bodyProps.row.version === currentVersion"> {{ t('current') }}: </b>
            </q-td>
            <q-td>{{ bodyProps.row.version }}</q-td>
            <q-td>{{ getTitle(bodyProps.row) }}</q-td>
            <q-td>{{ bodyProps.row.author }}</q-td>
            <q-td>{{ bodyProps.row.createdAt ? d(bodyProps.row.createdAt, 'long') : '' }}</q-td>
          </q-tr>
        </template>
      </q-table>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('reload')" color="primary" @click="reload" />
        <q-btn v-close-popup flat :label="t('close')" color="primary" />
      </q-card-actions>
      <q-inner-loading :showing="loading" :label="t('pleaseWait') + '...'" />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, inject, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityApiKey } from 'src/boot/axios'
import { Entity } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import useNotify from 'src/mixins/useNotify'
import { useEntity } from 'src/pinia/entity'
import { QTableProps } from 'quasar'

const props = defineProps<{
  show: boolean
  entityId: string
  organisationId: string
  repositoryId: string
  currentVersion?: number
  selectedVersion?: number
  readonly?: boolean
}>()

const emit = defineEmits(['restore', 'update:show', 'prefill', 'deleted'])

const { t, d } = useI18n()
const entityApi = inject(EntityApiKey)
const entityStore = useEntity()
const { getTitle } = useEntityFormatter()
const { notify, renderError } = useNotify()
const versions = ref<Entity[]>([])
const loading = ref(false)

const columns = computed(
  () =>
    [
      { name: 'title', label: t('title'), align: 'left' },
      { name: 'userAccount', label: t('author'), align: 'left' },
      { name: 'timestamp', label: t('timestamp') }
    ] as QTableProps['columns']
)

watch(
  () => props.show,
  (newShow: boolean) => {
    if (newShow && !versions.value.length) void reload()
  }
)

async function reload() {
  if (!entityApi || !props.entityId) return
  loading.value = true

  await entityApi
    .getEntityVersionsById(props.organisationId, props.repositoryId, props.entityId)
    .then((r) => (versions.value = r.data))
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function deleteVersion(version: Entity) {
  entityStore
    .deleteVersion(version)
    .then(() => {
      notify(t('thingDeleted', { thing: t('version') }), 'positive')
    })
    .then(() => emit('deleted'))
    .then(() => reload())
    .catch((e: Error) => renderError(e))
}
</script>

<style lang="sass" scoped>
.sticky-header-table
  max-height: 80%

  thead tr th
    position: sticky
    z-index: 1
    border-top-width: 1px !important
  thead tr:first-child th
    top: 0
  &.q-table--loading thead tr:last-child th
    top: 48px
</style>
