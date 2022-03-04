<template>
  <q-page class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('repository', 2) }}
        </div>
      </q-card-section>
      <q-card-section>
        {{ t('repositoryPage.description') }}
      </q-card-section>
    </q-card>

    <table-with-actions
      :rows="repositories"
      :columns="columns"
      :loading="loading"
      @row-clicked="routeToRepository($event)"
      @reload-clicked="reload()"
    >
      <template #row-cells="{ row }">
        <q-td>{{ row.organisation.name || row.organisation.id }}</q-td>
        <q-td>{{ row.name || row.id }}</q-td>
        <q-td>{{ row.description }}</q-td>
        <q-td>{{ d(row.createdAt, 'long') }}</q-td>
      </template>
    </table-with-actions>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import useAlert from 'src/mixins/useAlert'
import { useRouter } from 'vue-router'
import { RepositoryApiKey } from 'src/boot/axios'
import { Repository } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'


export default defineComponent({
  name: 'RepositoryOverview',
  components: {
    TableWithActions
  },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d }  = useI18n()
    const { alert } = useAlert()
    const router    = useRouter()
    const loading   = ref(false)
    const repositoryApi = inject(RepositoryApiKey)
    const repositories  = ref<Repository[]>([])
    const columns = computed(() => [
      { name: 'organisation', label: t('organisation'), align: 'left', sortable: true },
      { name: 'name', field: 'name', label: t('name'), align: 'left', required: true, sortable: true },
      { name: 'description', field: 'description', label: t('description'), align: 'left', sortable: true },
      { name: 'createdAt', field: 'createdAt', label: t('createdAt'), align: 'left', sortable: true }
    ])

    const reload = async () => {
      if (!repositoryApi) return
      loading.value = true
      await repositoryApi.getRepositories()
        .then(r => repositories.value = r.data)
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      d,
      alert,
      reload,
      columns,
      repositories,
      loading,
      routeToRepository (repository: Repository) {
        void router.push({ name: 'editor', params: { organisationId: repository.organisation?.id, repositoryId: repository.id } })
      }
    }
  }
})
</script>
