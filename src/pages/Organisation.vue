<template>
  <q-page class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('organisation', 2) }}
          <q-btn
            class="float-right"
            color="primary"
            icon="add"
            :title="t('createThing', { thing: t('organisation') })"
            @click="organisation = newOrganisation(); showForm = true"
          />
        </div>
      </q-card-section>
      <q-card-section v-t="'organisation.description'" />
    </q-card>

    <organisation-table
      :organisations="organisations"
      :loading="loading"
      @edit-clicked="organisation = $event; showForm = true"
    />

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
import useAlert from 'src/mixins/useAlert'
import { OrganisationApiKey } from 'src/boot/axios'
import { Organisation } from '@onto-med/top-api'
import OrganisationTable from 'src/components/Organisation/OrganisationTable.vue'
import OrganisationForm from 'src/components/Organisation/OrganisationForm.vue'
import { AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'


export default defineComponent({
  name: 'Editor',
  components: {
    OrganisationTable,
    OrganisationForm
  },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }     = useI18n()
    const { alert } = useAlert()
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
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      alert,
      organisations,
      organisation,
      loading,
      saving,
      showForm: showForm,
      newOrganisation,
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
            alert(t('thingSaved', { thing: t('organisation') }), 'positive')
            void reload()
          })
          .catch((e: Error) => alert(e.message))
          .finally(() => saving.value = false)
      },
      async deleteOrganisation (organisation: Organisation) {
        if (!organisationApi) return
        saving.value = true

        await organisationApi.deleteOrganisationById(organisation.id)
          .then(() => {
            showForm.value = false
            alert(t('thingDeleted', { thing: t('organisation') }), 'positive')
            void reload()
          })
          .catch((e: Error) => alert(e.message))
          .finally(() => saving.value = false)
      }
    }
  }
})
</script>
