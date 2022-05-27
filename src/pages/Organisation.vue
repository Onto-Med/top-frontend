<template>
  <q-page v-if="organisation && !loading" class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ organisation.name }}
        </div>
        <small>{{ t('createdAt') }}: {{ d(organisation.createdAt, 'long') }}</small>
      </q-card-section>
      <q-card-section>
        {{ organisation.description }}
      </q-card-section>
    </q-card>

    <table-with-actions
      :name="t('repository')"
      :rows="repositories"
      :loading="repositoriesLoading"
      create
      @row-clicked="routeToEditor($event)"
      @create-clicked="repository = newRepository(); showForm = true"
    >
      <template #actions="{ row }">
        <q-btn
          size="sm"
          color="primary"
          dense
          icon="edit"
          :title="t('editThing', { thing: t('repository') })"
          @click.stop="repository = row; showForm = true"
        />
      </template>
    </table-with-actions>

    <repository-form
      v-model="repository"
      v-model:show="showForm"
      :loading="saving"
      @update:model-value="saveRepository($event)"
      @delete-clicked="deleteRepository($event)"
    />
  </q-page>
  <q-page v-else>
    <q-inner-loading showing :label="t('pleaseWait') + '...'" />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import useAlert from 'src/mixins/useAlert'
import { OrganisationApiKey } from 'src/boot/axios'
import { RepositoryApiKey } from 'src/boot/axios'
import { Organisation, Repository } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'
import RepositoryForm from 'src/components/Repository/RepositoryForm.vue'
import { AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'

export default defineComponent({
  name: 'Editor',
  components: {
    TableWithActions,
    RepositoryForm
  },
  props: {
    organisationId: {
      type: String,
      required: true
    }
  },
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d } = useI18n()
    const { alert } = useAlert()
    const router = useRouter()
    const loading = ref(false)
    const showForm = ref(false)
    const saving = ref(false)
    const repositoriesLoading = ref(false)
    const organisationApi = inject(OrganisationApiKey)
    const repositoryApi = inject(RepositoryApiKey)
    const organisation = ref<Organisation|undefined>(undefined)
    const repositories = ref<Repository[]>([])
    const newRepository = () => {
      return { id: (uuidv4 as () => string)(), primary: false } as Repository
    }
    const repository = ref(newRepository())

    const reloadRepositories = async () => {
      if (!repositoryApi) return
      repositoriesLoading.value = true

      await repositoryApi.getRepositoriesByOrganisationId(props.organisationId)
        .then(r => repositories.value = r.data)
        .catch((e: Error) => alert(e.message))
        .finally(() => repositoriesLoading.value = false)
    }

    const reload = async () => {
      if (!organisationApi) return
      loading.value = true
      
      await organisationApi.getOrganisationById(props.organisationId)
        .then(r => organisation.value = r.data)
        .catch((e: Error) => {
          alert(e.message)
          void router.push({ name: 'organisations' })
        })
        .finally(() => loading.value = false)
      
      await reloadRepositories()
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      d,
      alert,
      showForm,
      organisation,
      repository,
      repositories,
      loading,
      repositoriesLoading,
      saving,
      newRepository,
      routeToEditor (repository: Repository) {
        if (!organisation.value) return
        void router.push({ name: 'editor', params: { organisationId: organisation.value.id, repositoryId: repository.id } })
      },
      async saveRepository (repository: Repository) {
        if (!repositoryApi || !organisation.value) return
        saving.value = true

        let promise: Promise<AxiosResponse<Repository>>
        if (repository.createdAt) {
          promise = repositoryApi.updateRepositoryById(organisation.value.id, repository.id, repository)
        } else {
          promise = repositoryApi.createRepository(organisation.value.id, repository)
        }

        await promise
          .then(() => {
            showForm.value = false
            alert(t('thingSaved', { thing: t('repository') }), 'positive')
            void reload()
          })
          .catch((e: Error) => alert(e.message))
          .finally(() => saving.value = false)
      },
      async deleteRepository (repository: Repository) {
        if (!organisationApi || !organisation.value) return
        saving.value = true

        await repositoryApi?.deleteRepositoryById(repository.id, organisation.value.id)
          .then(() => {
            showForm.value = false
            alert(t('thingDeleted', { thing: t('repository') }), 'positive')
            void reload()
          })
          .catch((e: Error) => alert(e.message))
          .finally(() => saving.value = false)
      }
    }
  }
})
</script>
