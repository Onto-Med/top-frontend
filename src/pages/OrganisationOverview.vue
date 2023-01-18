<template>
  <q-page class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('organisation', 2) }}
        </div>
      </q-card-section>
      <q-card-section>
        {{ t('organisationPage.description') }}
      </q-card-section>
    </q-card>

    <table-with-actions
      :name="t('organisation')"
      :rows="organisations"
      :loading="loading"
      create
      @row-clicked="routeToOrganisation($event)"
      @reload-clicked="reload()"
      @create-clicked="organisation = newOrganisation(); showForm = true"
    >
      <template #actions="{ row }">
        <q-btn
          size="sm"
          color="primary"
          dense
          icon="edit"
          :title="t('editThing', { thing: t('organisation') })"
          @click.stop="organisation = row; showForm = true"
        />
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
import { Organisation } from '@onto-med/top-api'
import TableWithActions from 'src/components/TableWithActions.vue'
import OrganisationForm from 'src/components/Organisation/OrganisationForm.vue'
import { AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'


export default defineComponent({
  name: 'OrganisationOverview',
  components: {
    TableWithActions,
    OrganisationForm
  },
  setup () {
    const { t }     = useI18n()
    const { notify, renderError } = useNotify()
    const router    = useRouter()
    const loading   = ref(false)
    const saving    = ref(false)
    const showForm  = ref(false)
    const organisationApi = inject(OrganisationApiKey)
    const organisations   = ref<Organisation[]>([])
    const  newOrganisation = () => {
      return { id: (uuidv4 as () => string)() } as Organisation
    }
    const organisation    = ref(newOrganisation())

    const reload = async () => {
      if (!organisationApi) return
      loading.value = true
      await organisationApi.getOrganisations()
        .then(r => organisations.value = r.data)
        .catch((e: Error) => renderError(e))
        .finally(() => loading.value = false)
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
      newOrganisation,
      routeToOrganisation (organisation: Organisation) {
        void router.push({ name: 'showOrganisation', params: { organisationId: organisation.id } })
      },
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
          .then(() => {
            showForm.value = false
            notify(t('thingSaved', { thing: t('organisation') }), 'positive')
            void reload()
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
            void reload()
          })
          .catch((e: Error) => renderError(e))
          .finally(() => saving.value = false)
      }
    }
  }
})
</script>
