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
      @create-clicked="organisation = newOrganisation(); showForm = true"
      @request="reload"
    >
      <template v-if="isAuthenticated" #actions="{ row }">
        <q-btn
          v-if="row.permission === Permission.Manage"
          size="sm"
          color="primary"
          dense
          icon="edit"
          :title="t('editThing', { thing: t('organisation') })"
          @click.stop="organisation = row; showForm = true"
        />
        <permission-icon :permission="row.permission" class="q-ml-sm gt-xs" size="sm" />
      </template>
    </table-with-actions>

    <organisation-form
      v-model="organisation"
      v-model:show="showForm"
      :loading="saving"
      @update:model-value="saveOrganisation($event)"
      @delete-clicked="deleteOrganisation($event)"
    />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useNotify from 'src/mixins/useNotify'
import { useRouter } from 'vue-router'
import { OrganisationApiKey } from 'src/boot/axios'
import { Organisation, OrganisationPage, Permission } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'
import OrganisationForm from 'src/components/Organisation/OrganisationForm.vue'
import PermissionIcon from 'src/components/PermissionIcon.vue'
import { AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { useEntity } from 'src/pinia/entity'
import { storeToRefs } from 'pinia'
import packageInfo from '../../package.json'

export default defineComponent({
  components: {
    TableWithActions,
    OrganisationForm,
    PermissionIcon
  },
  setup () {
    const { t }     = useI18n()
    const { notify, renderError } = useNotify()
    const router    = useRouter()
    const loading   = ref(false)
    const saving    = ref(false)
    const showForm  = ref(false)
    const organisationApi = inject(OrganisationApiKey)
    const organisations   = ref<OrganisationPage>({
      content: [],
      number: 1,
      size: 0,
      totalElements: 0,
      totalPages: 0,
      type: 'organisation'
    })
    const newOrganisation = () => {
      return { id: (uuidv4 as () => string)() } as Organisation
    }
    const organisation = ref(newOrganisation())
    const { isAuthenticated } = storeToRefs(useEntity())

    const reload = async (filter: string|undefined = undefined, page = 1) => {
      if (!organisationApi) return
      loading.value = true
      await organisationApi.getOrganisations(undefined, filter, page)
        .then(r => organisations.value = r.data)
        .catch((e: Error) => renderError(e))
        .finally(() => loading.value = false)
    }

    const routeToOrganisation = (organisation: Organisation) => {
      void router.push({ name: 'showOrganisation', params: { organisationId: organisation.id } })
    }

    const updateRow = (organisation: Organisation) => {
      const index = organisations.value.content.findIndex((o) => o.id === organisation.id)
      if (index !== -1)
        organisations.value.content[index] = organisation
    }

    const removeRow = (organisation: Organisation) => {
      const index = organisations.value.content.findIndex((o) => o.id === organisation.id)
      if (index !== -1) {
        organisations.value.content.splice(index, 1)
        organisations.value.totalElements--
      }
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      reload,
      organisations,
      organisation,
      loading,
      saving,
      showForm,
      isAuthenticated,
      newOrganisation,
      routeToOrganisation,
      Permission,
      productName: packageInfo.productName,

      async saveOrganisation (organisation: Organisation) {
        if (!organisationApi) return
        saving.value = true

        let promise: Promise<AxiosResponse<Organisation>>
        if (organisation.createdAt) {
          promise = organisationApi.updateOrganisationById(organisation.id, organisation)
        } else {
          promise = organisationApi.createOrganisation(organisation)
        }

        await promise
          .then(r => {
            showForm.value = false
            notify(t('thingSaved', { thing: t('organisation') }), 'positive')
            return r.data
          })
          .then(newOrganisation => {
            if (organisation.createdAt)
              updateRow(newOrganisation)
            else
              routeToOrganisation(newOrganisation)
          })
          .catch((e: Error) => renderError(e))
          .finally(() => saving.value = false)
      },

      async deleteOrganisation (organisation: Organisation) {
        if (!organisationApi) return
        saving.value = true

        await organisationApi.deleteOrganisationById(organisation.id)
          .then(() => {
            showForm.value = false
            notify(t('thingDeleted', { thing: t('organisation') }), 'positive')
            removeRow(organisation)
          })
          .catch((e: Error) => renderError(e))
          .finally(() => saving.value = false)
      }
    }
  }
})
</script>
