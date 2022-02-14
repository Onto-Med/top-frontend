<template>
  <q-page>
    <organisation-table
      :organisations="organisations"
      :loading="loading"
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

export default defineComponent({
  name: 'Editor',
  components: {
    OrganisationTable
  },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }     = useI18n()
    const { alert } = useAlert()
    const loading   = ref(false)
    const organisationApi = inject(OrganisationApiKey)
    const organisations   = ref<Organisation[]>([])

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
      loading
    }
  }
})
</script>
