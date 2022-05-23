<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card>
      <q-card-section v-t="'forkingState'" class="text-h6" />

      <q-separator />

      <q-table
        class="sticky-header-table"
        :title="t('fork', 2)"
        :rows="forks"
        :columns="forkColumns"
        :no-data-label="t('noDataPresent')"
        row-key="id"
      >
        <template #body="props">
          <q-tr
            v-close-popup
            :props="props"
            :title="t('showThing', { thing: t('fork') })"
            class="cursor-pointer"
            @click="routeToEntity(props.row)"
          >
            <q-td>{{ props.row.repository.organisation.name }}</q-td>
            <q-td>{{ props.row.repository.name }}</q-td>
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
import { defineComponent, ref, inject, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ForkApiKey } from 'src/boot/axios'
import { Entity } from '@onto-med/top-api'
import useAlert from 'src/mixins/useAlert'
import { useRouter } from 'vue-router'

export default defineComponent({
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
    }
  },
  emits: ['update:show'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d }  = useI18n()
    const forkApi   = inject(ForkApiKey)
    const { alert } = useAlert()
    const router    = useRouter()
    const loading   = ref(false)
    const forks     = ref([] as Entity[])

    const reload = async () => {
      if (!forkApi) return
      loading.value = true

      await forkApi.getForks(props.organisationId, props.repositoryId, props.entityId)
        .then(r => forks.value = r.data)
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    watch(
      () => props.show,
      (newShow: boolean) => {
        if (newShow && !forks.value.length) void reload()
      }
    )

    return {
      t,
      d,
      loading,
      reload,
      forks,

      forkColumns: computed(() => [
        { name: 'organisation', label: t('organisation'), align: 'left' },
        { name: 'repository', label: t('repository'), align: 'left' },
        { name: 'userAccount', label: t('author'), align: 'left' },
        { name: 'createdAt', label: t('createdAt') }
      ]),

      routeToEntity (entity: Entity) {
        if (!entity.repository || !entity.repository.organisation) return
        void router.push({ name: 'editor', params: { organisationId: entity.repository.organisation.id, repositoryId: entity.repository.id, entityId: entity.id } })
      },
    }
  }
})
</script>
