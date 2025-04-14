<template>
  <q-page class="q-pa-md q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h5 q-pb-md">
          {{ t('organisation', 2) }}
        </div>
        <p class="q-mb-none">
          {{ t('organisationPage.description', { productName }) }}
        </p>
      </q-card-section>
    </q-card>

    <table-with-actions
      :title="t('organisation', 2)"
      :name="t('organisation')"
      :page="organisations"
      :loading="loading"
      :create="isAuthenticated"
      @row-clicked="routeToOrganisation($event)"
      @create-clicked="((organisation = newOrganisation()), (showForm = true))"
      @request="reload"
    >
      <template v-if="isAuthenticated" #actions="{ row }">
        <permission-icon :permission="row.permission" class="q-ml-sm gt-xs" />
      </template>
    </table-with-actions>

    <organisation-form
      v-model="organisation"
      v-model:show="showForm"
      :loading="saving"
      @update:model-value="saveOrganisation"
    />
  </q-page>
</template>

<script setup lang="ts">
import { inject, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useNotify from 'src/mixins/useNotify'
import { useRouter } from 'vue-router'
import { OrganisationApiKey } from 'src/boot/axios'
import { Organisation, OrganisationPage } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'
import OrganisationForm from 'src/components/Organisation/OrganisationForm.vue'
import PermissionIcon from 'src/components/PermissionIcon.vue'
import { v4 as uuidv4 } from 'uuid'
import { useEntityStore } from 'src/stores/entity-store'
import { storeToRefs } from 'pinia'
import packageInfo from '../../package.json'
import { useMeta } from 'quasar'
import { MetaOptions } from 'quasar/dist/types/meta.js'

const { t } = useI18n()
const { notify, renderError } = useNotify()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const organisationApi = inject(OrganisationApiKey)
const organisations = ref<OrganisationPage>({
  content: [],
  number: 1,
  size: 0,
  totalElements: 0,
  totalPages: 0,
  type: 'organisation',
})

const organisation = ref(newOrganisation())
const { isAuthenticated } = storeToRefs(useEntityStore())
const productName = packageInfo.productName

useMeta(
  () =>
    ({
      title: t('organisation', 2),
      meta: [
        {
          name: 'description',
          content: t('organisationPage.description', { productName }),
        },
      ],
    }) as unknown as MetaOptions,
)

onMounted(async () => {
  await reload()
})

function newOrganisation(): Organisation {
  return { id: uuidv4() } as Organisation
}

async function reload(filter: string | undefined = undefined, page = 1): Promise<void> {
  if (!organisationApi) return
  loading.value = true
  await organisationApi
    .getOrganisations(undefined, filter, page)
    .then((r) => (organisations.value = r.data))
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function routeToOrganisation(organisation: Organisation) {
  void router.push({ name: 'showOrganisation', params: { organisationId: organisation.id } })
}

async function saveOrganisation(organisation: Organisation) {
  if (!organisationApi) return
  saving.value = true

  await organisationApi
    .createOrganisation(organisation)
    .then((r) => {
      showForm.value = false
      notify(t('thingSaved', { thing: t('organisation') }), 'positive')
      return r.data
    })
    .then((newOrganisation) => {
      routeToOrganisation(newOrganisation)
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (saving.value = false))
}
</script>
