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
            @click="showForm = true"
          />
        </div>
      </q-card-section>
      <q-card-section v-t="'organisation.description'" />
    </q-card>

    <organisation-table
      :organisations="organisations"
      :loading="loading"
      @row-clicked="organisation = $event; showForm = true"
    />

    <organisation-form
      v-model="organisation"
      v-model:show="showForm"
      :loading="saving"
      @update:model-value="saveOrganisation($event)"
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
    const organisation    = ref(null)

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
      async saveOrganisation (organisation: Organisation) {
        console.log(organisation)
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
      }
    }
  }
})
</script>
