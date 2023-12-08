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
        <template #header="props">
          <q-tr :props="props">
            <q-th class="bg-grey-1" auto-width />
            <q-th class="bg-grey-1">
              #
            </q-th>
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              class="bg-grey-1"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr
            v-close-popup
            :props="props"
            :title="t('showThing', { thing: t('version') })"
            class="cursor-pointer"
            :class="{ 'bg-secondary': props.row.version === selectedVersion }"
            @click="$emit('prefill', props.row)"
          >
            <q-td auto-width>
              <q-btn
                v-if="!readonly && currentVersion && props.row.version !== currentVersion"
                size="sm"
                color="red"
                round
                dense
                flat
                icon="delete"
                :title="t('deleteThing', { thing: t('version') })"
                @click.stop="deleteVersion(props.row)"
              />
              <b v-else-if="currentVersion && props.row.version === currentVersion">
                {{ t('current') }}:
              </b>
            </q-td>
            <q-td>{{ props.row.version }}</q-td>
            <q-td>{{ getTitle(props.row) }}</q-td>
            <q-td>{{ props.row.author }}</q-td>
            <q-td>{{ props.row.createdAt ? d(props.row.createdAt, 'long') : '' }}</q-td>
          </q-tr>
        </template>
      </q-table>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('reload')" color="primary" @click="reload" />
        <q-btn v-close-popup flat :label="t('close')" color="primary" />
      </q-card-actions>
      <q-inner-loading
        :showing="loading"
        :label="t('pleaseWait') + '...'"
      />
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, inject, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityApiKey } from 'src/boot/axios'
import { Entity } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import useNotify from 'src/mixins/useNotify'
import { useEntity } from 'src/pinia/entity'
import { QTableProps } from 'quasar'

export default defineComponent({
  name: 'VersionHistoryDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    organisationId: {
      type: String,
      required: true
    },
    repositoryId: {
      type: String,
      required: true
    },
    currentVersion: Number,
    selectedVersion: Number,
    readonly: Boolean
  },
  emits: ['restore', 'update:show', 'prefill', 'deleted'],
  setup (props, { emit }) {
    const { t, d }     = useI18n()
    const entityApi    = inject(EntityApiKey)
    const entityStore  = useEntity()
    const { getTitle } = useEntityFormatter()
    const { notify, renderError } = useNotify()
    const versions     = ref<Entity[]>([])
    const loading      = ref(false)

    const reload = async () => {
      if (!entityApi || !props.entityId) return
      loading.value = true

      await entityApi.getEntityVersionsById(props.organisationId, props.repositoryId, props.entityId)
        .then(r => versions.value = r.data)
        .catch((e: Error) => renderError(e))
        .finally(() => loading.value = false)
    }

    watch(
      () => props.show,
      (newShow: boolean) => {
        if (newShow && !versions.value.length) void reload()
      }
    )

    return {
      t,
      d,
      getTitle,
      columns: computed(() => [
        { name: 'title', label: t('title'), align: 'left' },
        { name: 'userAccount', label: t('author'), align: 'left' },
        { name: 'timestamp', label: t('timestamp') }
      ] as QTableProps['columns']),
      versions,
      loading,
      reload,

      deleteVersion (version: Entity) {
        entityStore.deleteVersion(version)
          .then(() => {
            notify(t('thingDeleted', { thing: t('version') }), 'positive')
          })
          .then(() => emit('deleted'))
          .then(() => reload())
          .catch((e: Error) => renderError(e))
      }
    }
  }
})
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
