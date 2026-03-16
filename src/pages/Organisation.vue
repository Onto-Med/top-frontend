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
            <small
              ><div v-if="organisation.createdAt">
                {{ t('createdAt', { date: d(organisation.createdAt, 'long') }) }}
              </div>
              <div v-if="organisation.updatedAt">
                {{ t('updatedAt', { date: d(organisation.updatedAt, 'long') }) }}
              </div></small
            >
          </div>
          <div v-if="manage" class="col-auto">
            <q-btn icon="settings" color="primary" :label="t('manage')">
              <q-menu fit>
                <q-list>
                  <q-item v-close-popup clickable @click="showOrganisationForm = true">
                    <q-item-section>
                      {{ t('edit') }}
                    </q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable @click="showMembershipDialog">
                    <q-item-section>
                      {{ t('permission', 2) }}
                    </q-item-section>
                  </q-item>
                  <q-item v-if="isAdmin && env.QUERIES_ENABLED" v-close-popup clickable @click="showDataSourceDialog">
                    <q-item-section>
                      {{ t('dataSource', 2) }}
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item v-close-popup clickable @click="deleteOrganisation">
                    <q-item-section>
                      {{ t('delete') }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
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
      :create="write"
      @row-clicked="routeToEditor"
      @create-clicked="((repository = newRepository()), (showRepositoryForm = true))"
      @request="reload"
    >
      <template #actions="{ row }">
        <q-btn
          v-if="write"
          size="sm"
          color="primary"
          dense
          icon="edit"
          :title="t('editThing', { thing: t('repository') })"
          @click.stop="((repository = row), (showRepositoryForm = true))"
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
      <template v-if="!read" #footer>
        <q-icon name="info" />
        {{ t('notAuthorised.onlyPrimaryVisible') }}
      </template>
    </table-with-actions>

    <repository-form
      v-model="repository"
      v-model:show="showRepositoryForm"
      :loading="savingRepository"
      @update:model-value="saveRepository"
      @delete-clicked="deleteRepository"
    />

    <organisation-form
      v-model="organisation"
      v-model:show="showOrganisationForm"
      :loading="saving"
      @update:model-value="updateOrganisation"
    />
  </q-page>
  <q-page v-else>
    <q-inner-loading showing :label="t('pleaseWait') + '...'" />
  </q-page>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import useNotify from 'src/mixins/useNotify'
import { OrganisationApiKey } from 'src/boot/axios'
import { RepositoryApiKey } from 'src/boot/axios'
import { Organisation, Repository, RepositoryPage } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'
import OrganisationForm from 'src/components/Organisation/OrganisationForm.vue'
import RepositoryForm from 'src/components/Repository/RepositoryForm.vue'
import MembershipDialog from 'src/components/Organisation/MembershipDialog.vue'
import DataSourceDialog from 'src/components/Organisation/DataSourceDialog.vue'
import Dialog from 'src/components/Dialog.vue'
import { AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { storeToRefs } from 'pinia'
import { useEntityStore } from 'src/stores/entity-store'
import { useMeta, useQuasar } from 'quasar'
import { env } from 'src/config'

const { t, d } = useI18n()
const $q = useQuasar()
const { notify, renderError } = useNotify()
const { canManage, canRead, canWrite, repositoryIcon } = useEntityFormatter()
const router = useRouter()
const loading = ref(false)
const showOrganisationForm = ref(false)
const showRepositoryForm = ref(false)
const saving = ref(false)
const savingRepository = ref(false)
const organisationApi = inject(OrganisationApiKey)
const repositoryApi = inject(RepositoryApiKey)
const entityStore = useEntityStore()
const { organisation } = storeToRefs(entityStore)
const repositories = ref<RepositoryPage>({
  content: [],
  number: 1,
  size: 0,
  totalElements: 0,
  totalPages: 0,
  type: 'repository',
})
const repository = ref(newRepository())
const { isAuthenticated, isAdmin } = storeToRefs(entityStore)

const read = computed(() => isAuthenticated.value && canRead(organisation.value))
const write = computed(() => isAuthenticated.value && canWrite(organisation.value))
const manage = computed(() => isAuthenticated.value && canManage(organisation.value))

useMeta(() => ({
  title: organisation.value ? organisation.value.name : t('organisation'),
}))

onMounted(async () => {
  await entityStore.loadUser().then(() => reload())
})

function newRepository() {
  return { id: uuidv4(), primary: false } as Repository
}

async function reload(filter?: string, page = 1) {
  if (!repositoryApi || !organisation.value) return
  loading.value = true
  await repositoryApi
    .getRepositoriesByOrganisationId(organisation.value.id, undefined, filter, undefined, page)
    .then((r) => (repositories.value = r.data))
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function routeToEditor(repository: Repository) {
  if (!organisation.value) return
  void router.push({
    name: 'editor',
    params: { organisationId: organisation.value.id, repositoryId: repository.id },
  })
}

function updateRow(repository: Repository) {
  const index = repositories.value.content.findIndex((r) => r.id === repository.id)
  if (index !== -1) repositories.value.content[index] = repository
}

function removeRow(repository: Repository) {
  const index = repositories.value.content.findIndex((r) => r.id === repository.id)
  if (index !== -1) {
    repositories.value.content.splice(index, 1)
    repositories.value.totalElements--
  }
}

async function updateOrganisation(newData: Organisation) {
  if (!organisationApi || !organisation.value) return
  saving.value = true

  await organisationApi
    .updateOrganisationById(organisation.value.id, newData)
    .then((r) => {
      showOrganisationForm.value = false
      notify(t('thingSaved', { thing: t('organisation') }), 'positive')
      organisation.value = r.data
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (saving.value = false))
}

function deleteOrganisation() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('organisationPage.confirmDelete'),
    },
  }).onOk(() => {
    if (!organisationApi || !organisation.value) return
    void organisationApi
      .deleteOrganisationById(organisation.value.id)
      .then(() => {
        notify(t('thingDeleted', { thing: t('organisation') }), 'positive')
        void router.push({ name: 'organisations' })
      })
      .catch((e: Error) => renderError(e))
      .finally(() => (saving.value = false))
  })
}

async function saveRepository(repository: Repository) {
  if (!repositoryApi || !organisation.value) return
  savingRepository.value = true

  let promise: Promise<AxiosResponse<Repository>>
  if (repository.createdAt) {
    promise = repositoryApi.updateRepositoryById(organisation.value.id, repository.id, repository)
  } else {
    promise = repositoryApi.createRepository(organisation.value.id, repository)
  }

  await promise
    .then((r) => {
      showRepositoryForm.value = false
      notify(t('thingSaved', { thing: t('repository') }), 'positive')
      return r.data
    })
    .then((newRepository) => {
      if (repository.createdAt) updateRow(newRepository)
      else routeToEditor(newRepository)
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (savingRepository.value = false))
}

async function deleteRepository(repository: Repository) {
  if (!organisationApi || !organisation.value) return
  savingRepository.value = true

  await repositoryApi
    ?.deleteRepositoryById(repository.id, organisation.value.id)
    .then(() => {
      showRepositoryForm.value = false
      notify(t('thingDeleted', { thing: t('repository') }), 'positive')
      removeRow(repository)
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (savingRepository.value = false))
}

function showMembershipDialog() {
  $q.dialog({
    component: MembershipDialog,
    componentProps: {
      organisation: organisation.value,
    },
  })
}

function showDataSourceDialog() {
  $q.dialog({
    component: DataSourceDialog,
    componentProps: {
      organisation: organisation.value,
    },
  })
}
</script>
