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
      :loading="loading"
      @row-clicked="routeToRepository($event)"
    />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue'
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
    const { t }     = useI18n()
    const { alert } = useAlert()
    const router    = useRouter()
    const loading   = ref(false)
    const repositoryApi = inject(RepositoryApiKey)
    const repositories  = ref<Repository[]>([])

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
      alert,
      repositories,
      loading,
      routeToRepository (repository: Repository) {
        void router.push({ name: 'editor', params: { organisationId: repository.organisation.id, repositoryId: repository.id } })
      }
    }
  }
})
</script>
