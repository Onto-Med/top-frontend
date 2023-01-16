<template>
  <q-page v-if="organisation" class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          <q-icon name="groups" :title="t('organisation')" class="q-mr-sm q-tree__icon" />
          {{ organisation.name }}
        </div>
        <small v-if="organisation.createdAt">
          {{ t('createdAt') }}: {{ d(organisation.createdAt, 'long') }}
        </small>
      </q-card-section>
      <q-card-section>
        {{ organisation.description }}
      </q-card-section>
    </q-card>

    <table-with-actions
      :name="t('repository')"
      :rows="repositories"
      :loading="loading"
      create
      @row-clicked="routeToEditor($event)"
      @reload-clicked="reload()"
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
        <q-icon
          :name="repositoryIcon(row)"
          :title="t(row.repositoryType || 'repository')"
          class="q-ml-sm q-tree__icon"
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
import { Repository } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'
import RepositoryForm from 'src/components/Repository/RepositoryForm.vue'
import { AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { storeToRefs } from 'pinia'
import { useEntity } from 'src/pinia/entity'

export default defineComponent({
  components: {
    TableWithActions,
    RepositoryForm
  },
  setup () {
    const { t, d } = useI18n()
    const { alert } = useAlert()
    const { repositoryIcon } = useEntityFormatter()
    const router = useRouter()
    const loading = ref(false)
    const showForm = ref(false)
    const saving = ref(false)
    const organisationApi = inject(OrganisationApiKey)
    const repositoryApi = inject(RepositoryApiKey)
    const { organisation } = storeToRefs(useEntity())
    const repositories = ref<Repository[]>([])
    const newRepository = () => {
      return { id: (uuidv4 as () => string)(), primary: false } as Repository
    }
    const repository = ref(newRepository())

    const reload = async () => {
      if (!repositoryApi || !organisation.value) return
      loading.value = true

      await repositoryApi.getRepositoriesByOrganisationId(organisation.value.id)
        .then(r => repositories.value = r.data)
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
      // if (!organisationApi) return
      // loading.value = true

      // await organisationApi.getOrganisationById(props.organisationId)
      //   .then(r => organisation.value = r.data)
      //   .then(() => reloadRepositories())
      //   .catch((e: Error) => {
      //     alert(e.message)
      //     void router.push({ name: 'organisations' })
      //   })
      //   .finally(() => loading.value = false)
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      d,
      alert,
      repositoryIcon,
      showForm,
      organisation,
      repository,
      repositories,
      loading,
      saving,
      reload,
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
