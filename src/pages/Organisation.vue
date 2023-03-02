<template>
  <q-page v-if="organisation" class="q-gutter-md">
    <q-card>
      <q-card-section class="q-pb-none">
        <div class="row">
          <div class="col">
            <div class="text-h6">
              <q-icon name="groups" :title="t('organisation')" class="q-mr-sm q-tree__icon" />
              {{ organisation.name }}
            </div>
            <small v-if="organisation.createdAt">
              {{ t('createdAt') }}: {{ d(organisation.createdAt, 'long') }}
            </small>
          </div>
          <div v-if="isAuthenticated" class="col-auto">
            <q-btn
              v-if="isAuthenticated"
              color="primary"
              icon="settings"
              :label="t('manageThing', { thing: t('permission', 2) })"
              @click="showMembershipDialog()"
            />
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pt-sm">
        <b>{{ t('description') }}:</b>
        <p>{{ organisation.description }}</p>
      </q-card-section>
    </q-card>

    <table-with-actions
      :name="t('repository')"
      :rows="repositories"
      :loading="loading"
      :create="isAuthenticated"
      @row-clicked="routeToEditor($event)"
      @reload-clicked="reload()"
      @create-clicked="repository = newRepository(); showForm = true"
    >
      <template #actions="{ row }">
        <q-btn
          v-if="isAuthenticated"
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
        <q-chip
          v-if="row.primary"
          size="sm"
          color="primary"
          text-color="white"
          :label="t('primary')"
          :title="t('primaryRepositoryDescription')"
        />
      </template>
      <template v-if="!isAuthenticated" #footer>
        <q-icon name="info" />
        {{ t('notAuthenticated.onlyPrimaryVisible') }}
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
import useNotify from 'src/mixins/useNotify'
import { OrganisationApiKey } from 'src/boot/axios'
import { RepositoryApiKey } from 'src/boot/axios'
import { Repository } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'
import RepositoryForm from 'src/components/Repository/RepositoryForm.vue'
import MembershipDialog from 'src/components/Organisation/MembershipDialog.vue'
import { AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { storeToRefs } from 'pinia'
import { useEntity } from 'src/pinia/entity'
import { useQuasar } from 'quasar'

export default defineComponent({
  components: {
    TableWithActions,
    RepositoryForm
  },
  setup () {
    const { t, d } = useI18n()
    const $q = useQuasar()
    const { notify, renderError } = useNotify()
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
    const { isAuthenticated } = storeToRefs(useEntity())

    const reload = async () => {
      if (!repositoryApi || !organisation.value) return
      loading.value = true

      await repositoryApi.getRepositoriesByOrganisationId(organisation.value.id)
        .then(r => repositories.value = r.data)
        .catch((e: Error) => renderError(e))
        .finally(() => loading.value = false)
    }

    const routeToEditor = (repository: Repository) => {
      if (!organisation.value) return
      void router.push({ name: 'editor', params: { organisationId: organisation.value.id, repositoryId: repository.id } })
    }

    const updateRow = (repository: Repository) => {
      const index = repositories.value.findIndex((r) => r.id === repository.id)
      if (index !== -1)
        repositories.value[index] = repository
    }

    const removeRow = (repository: Repository) => {
      const index = repositories.value.findIndex((r) => r.id === repository.id)
      if (index !== -1)
        repositories.value.splice(index, 1)
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
      isAuthenticated,
      routeToEditor,

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
            notify(t('thingSaved', { thing: t('repository') }), 'positive')
          })
          .then(() => {
            if (repository.createdAt)
              updateRow(repository)
            else
              routeToEditor(repository)
          })
          .catch((e: Error) => renderError(e))
          .finally(() => saving.value = false)
      },

      async deleteRepository (repository: Repository) {
        if (!organisationApi || !organisation.value) return
        saving.value = true

        await repositoryApi?.deleteRepositoryById(repository.id, organisation.value.id)
          .then(() => {
            showForm.value = false
            notify(t('thingDeleted', { thing: t('repository') }), 'positive')
            removeRow(repository)
          })
          .catch((e: Error) => renderError(e))
          .finally(() => saving.value = false)
      },

      showMembershipDialog () {
        $q.dialog({
          component: MembershipDialog,
          componentProps: {
            organisation: organisation.value
          }
        })
      }
    }
  }
})
</script>
