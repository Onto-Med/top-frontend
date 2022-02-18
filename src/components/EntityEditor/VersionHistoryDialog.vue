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

        <template #body="{ row }">
          <q-td auto-width>
            <q-btn
              v-close-popup
              size="sm"
              color="accent"
              round
              dense
              icon="fast_rewind"
              :title="t('restoreThing', { thing: t('version') })"
              @click="$emit('restore', row)"
            />
          </q-td>
          <q-td>{{ row.getTitle() }}</q-td>
            <q-td>{{ row.author ? row.author.username : '' }}</q-td>
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
import { defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FullEntity } from 'src/models/Entity'
import { fetchEntityVersions } from 'src/api/entityRepository'

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
    }
  },
  emits: ['restore', 'update:show'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d } = useI18n()
    const columns = [
      { name: 'title', label: t('title') },
      { name: 'userAccount', label: t('author') },
      { name: 'timestamp', label: t('timestamp') }
    ]
    const versions = ref<FullEntity[]>([])
    const loading = ref(false)

    const reload = () => {
      loading.value = true
      fetchEntityVersions(props.entityId)
        .then(r => versions.value = r)
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    watch(
      () => props.show,
      (newShow: boolean) => {
        if (newShow && !versions.value.length) reload()
      }
    )

    return { t, d, columns, versions, loading, reload }
  }
})
</script>


<style lang="sass" scoped>
.sticky-header-table
  height: 310px

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0
  &.q-table--loading thead tr:last-child th
    top: 48px
</style>