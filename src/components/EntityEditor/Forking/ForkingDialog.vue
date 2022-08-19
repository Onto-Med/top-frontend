<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card v-if="forkingStats">
      <q-card-section v-t="'forkingState'" class="text-h6" />

      <template v-if="forkingStats.origin">
        <q-separator />

        <q-card-section>
          <div v-t="'entityIsForkDescription'" />
          <span v-t="'origin'" />:
          <q-btn
            flat
            dense
            no-caps
            :label="getTitle(forkingStats.origin)"
            :title="t('showThing', { thing: t('origin') })"
            @click="routeToEntity(forkingStats.origin)"
          />
        </q-card-section>
      </template>

      <q-separator />

      <q-table
        class="sticky-header-table"
        :title="t('fork', 2)"
        :rows="forkingStats.forks"
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
import { Entity, ForkingStats } from '@onto-med/top-api'
import useAlert from 'src/mixins/useAlert'
import { useRouter } from 'vue-router'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

export default defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true
    },
    entity: {
      type: Object as () => Entity,
      required: true
    }
  },
  emits: ['update:show'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d }     = useI18n()
    const forkApi      = inject(ForkApiKey)
    const { alert }    = useAlert()
    const router       = useRouter()
    const loading      = ref(false)
    const forkingStats = ref(undefined as ForkingStats|undefined)
    const { getTitle } = useEntityFormatter()

    const reload = async () => {
      if (!forkApi || !props.entity || !props.entity.id || !props.entity.repository || !props.entity.repository.organisation) return
      loading.value = true

      await forkApi.getForks(props.entity.repository.organisation.id, props.entity.repository.id, props.entity.id)
        .then(r => forkingStats.value = r.data)
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    watch(
      () => props.show,
      (newShow: boolean) => {
        if (newShow && !forkingStats.value) void reload()
      }
    )

    return {
      t,
      d,
      loading,
      reload,
      forkingStats,
      getTitle,

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