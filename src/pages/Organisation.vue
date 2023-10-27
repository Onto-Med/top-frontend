<template>
  <q-page v-if="organisation" class="q-pa-md q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="row">
          <div class="col">
            <div class="text-h6">
              <q-icon name="groups" :title="t('organisation')" class="q-mr-sm q-tree__icon" />
              {{ organisation.name }}
            </div>
            <small v-if="organisation.createdAt" class="gt-xs">
              {{ t('createdAt', { date: d(organisation.createdAt, 'long') }) }}
            </small>
          </div>
          <div v-if="canManage" class="col-auto">
            <q-btn-group>
              <q-btn
                color="primary"
                icon="settings"
                :label="$q.screen.gt.xs ? t('manageThing', { thing: t('permission', 2) }) : ''"
                @click="showMembershipDialog()"
              />
              <q-btn
                v-if="isAdmin"
                color="secondary"
                icon="lan"
                :label="$q.screen.gt.xs ? t('manageThing', { thing: t('dataSource', 2) }) : ''"
                @click="showDataSourceDialog()"
              />
            </q-btn-group>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section v-show="organisation.description">
        <b>{{ t('description') }}:</b>
        <p class="q-my-none">
          {{ organisation.description }}
        </p>
      </q-card-section>
    </q-card>

    <table-with-actions
      :title="t('repository', 2)"
      :name="t('repository')"
      :page="repositories"
      :loading="loading"
      :create="canWrite"
      @row-clicked="routeToEditor($event)"
      @create-clicked="repository = newRepository(); showForm = true"
      @request="reload"
    >
      <template #actions="{ row }">
        <q-btn
          v-if="canWrite"
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
          class="q-ml-sm q-tree__icon gt-xs"
        />
        <q-chip
          v-if="row.primary"
          size="sm"
          color="primary"
          text-color="white"
          class="gt-xs"
          :label="t('primary')"
          :title="t('primaryRepositoryDescription')"
        />
      </template>
      <template v-if="!canRead" #footer>
        <q-icon name="info" />
        {{ t('notAuthorised.onlyPrimaryVisible') }}
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
import { defineComponent, inject, ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import useNotify from 'src/mixins/useNotify'
import { OrganisationApiKey } from 'src/boot/axios'
import { RepositoryApiKey } from 'src/boot/axios'
import { Repository, RepositoryPage } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'
import RepositoryForm from 'src/components/Repository/RepositoryForm.vue'
import MembershipDialog from 'src/components/Organisation/MembershipDialog.vue'
import DataSourceDialog from 'src/components/Organisation/DataSourceDialog.vue'
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
    const { canManage, canRead, canWrite, repositoryIcon } = useEntityFormatter()
    const router = useRouter()
    const loading = ref(false)
    const showForm = ref(false)
    const saving = ref(false)
    const organisationApi = inject(OrganisationApiKey)
    const repositoryApi = inject(RepositoryApiKey)
    const entityStore = useEntity()
    const { organisation } = storeToRefs(entityStore)
    const repositories = ref<RepositoryPage>({
      content: [],
      number: 1,
      size: 0,
      totalElements: 0,
      totalPages: 0,
      type: 'repository'
    })
    const newRepository = () => {
      return { id: (uuidv4 as () => string)(), primary: false } as Repository
    }
    const repository = ref(newRepository())
    const { isAuthenticated, isAdmin } = storeToRefs(entityStore)
    void entityStore.loadUser()

    const reload = async (filter: string|undefined = undefined, page = 1) => {
      if (!repositoryApi || !organisation.value) return
      loading.value = true

      await repositoryApi.getRepositoriesByOrganisationId(organisation.value.id, undefined, filter, undefined, page)
        .then(r => repositories.value = r.data)
        .catch((e: Error) => renderError(e))
        .finally(() => loading.value = false)
    }

    const routeToEditor = (repository: Repository) => {
      if (!organisation.value) return
      void router.push({ name: 'editor', params: { organisationId: organisation.value.id, repositoryId: repository.id } })
    }

    const updateRow = (repository: Repository) => {
      const index = repositories.value.content.findIndex((r) => r.id === repository.id)
      if (index !== -1)
        repositories.value.content[index] = repository
    }

    const removeRow = (repository: Repository) => {
      const index = repositories.value.content.findIndex((r) => r.id === repository.id)
      if (index !== -1) {
        repositories.value.content.splice(index, 1)
        repositories.value.totalElements--
      }
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
      isAdmin,
      routeToEditor,

      canRead: computed(() => isAuthenticated.value && canRead(organisation.value)),
      canWrite: computed(() => isAuthenticated.value && canWrite(organisation.value)),
      canManage: computed(() => isAuthenticated.value && canManage(organisation.value)),

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
          .then(r => {
            showForm.value = false
            notify(t('thingSaved', { thing: t('repository') }), 'positive')
            return r.data
          })
          .then(newRepository => {
            if (repository.createdAt)
              updateRow(newRepository)
            else
              routeToEditor(newRepository)
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
      },

      showDataSourceDialog() {
        $q.dialog({
          component: DataSourceDialog,
          componentProps: {
            organisation: organisation.value
          }
        })
      }
    }
  }
})
</script>
