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
            <q-th>#</q-th>
            <q-th auto-width />
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body="props">
          <q-tr :props="props" :title="t('prefillWithThing', { thing: t('version') })" class="cursor-pointer" :class="{ 'bg-blue-2': props.row.version === currentVersion }" @click="$emit('prefill', props.row)">
            <q-td>{{ props.row.version }}</q-td>
            <q-td auto-width>
              <q-btn-group v-if="currentVersion && props.row.version !== currentVersion">
                <q-btn
                  size="sm"
                  color="accent"
                  round
                  dense
                  icon="fast_rewind"
                  :title="t('restoreThing', { thing: t('version') })"
                  @click.stop="$emit('restore', props.row)"
                />
                <q-btn
                  v-close-popup
                  size="sm"
                  color="red"
                  round
                  dense
                  icon="delete"
                  :title="t('deleteThing', { thing: t('version') })"
                  @click.stop="$emit('delete', props.row)"
                />
              </q-btn-group>
              <b v-else-if="currentVersion">
                {{ t('current') }}:
              </b>
            </q-td>
            <q-td>{{ getTitle(props.row) }}</q-td>
            <q-td>{{ props.row.author ? props.row.author.username : '' }}</q-td>
            <q-td>{{ d(props.row.createdAt, 'long') }}</q-td>
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
    currentVersion: Number
  },
  emits: ['restore', 'update:show', 'prefill', 'delete'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d } = useI18n()
    const entityApi = inject(EntityApiKey)
    const { getTitle } = useEntityFormatter()
    const versions = ref<Entity[]>([])
    const loading = ref(false)

    const reload = async () => {
      if (!entityApi) return
      loading.value = true

      await entityApi.getEntityVersionsById(props.organisationId, props.repositoryId, props.entityId)
        .then(r => versions.value = r.data)
        .catch((e: Error) => alert(e.message))
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
      ]),
      versions,
      loading,
      reload
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
  thead tr:first-child th
    top: 0
  &.q-table--loading thead tr:last-child th
    top: 48px
</style>