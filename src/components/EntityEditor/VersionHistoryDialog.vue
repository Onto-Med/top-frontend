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

        <template #body="props">
          <q-td auto-width>
            <q-btn
              size="sm"
              color="accent"
              round
              dense
              icon="fast_rewind"
              :title="t('entityEditor.restore')"
              @click="$emit('restore', props)"
            />
          </q-td>
          <q-tr :props="$props">
            <q-td>{{ props.getTitle() }}</q-td>
            <q-td>{{ props.author }}</q-td>
            <q-td>{{ props.updatedAt }}</q-td>
          </q-tr>
        </template>
      </q-table>

      <q-separator />

      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('close')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'VersionHistoryDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    versions: {
      type: Array as () => Entity[]
    }
  },
emits: ['restore'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const columns = [
      { name: 'title', label: t('title') },
      { name: 'userAccount', label: t('author') },
      { name: 'timestamp', label: t('timestamp') }
    ]

    return { t, columns }
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