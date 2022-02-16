<template>
  <q-page v-if="organisation && !loading" class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ organisation.name }}
        </div>
        <small>{{ t('createdAt') }}: {{ d(organisation.createdAt, 'long') }}</small>
      </q-card-section>
      <q-card-section>
        {{ organisation.description }}
      </q-card-section>
    </q-card>
  </q-page>
  <q-page else>
    <q-inner-loading showing :label="t('pleaseWait') + '...'" />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import useAlert from 'src/mixins/useAlert'
import { OrganisationApiKey } from 'src/boot/axios'

export default defineComponent({
  name: 'Editor',
  components: { },
  props: {
    organisationId: {
      type: String,
      required: true
    }
  },
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d }     = useI18n()
    const { alert } = useAlert()
    const router = useRouter()
    const loading   = ref(false)
    const organisationApi = inject(OrganisationApiKey)
    const organisation = ref(null)

    const reload = async () => {
      if (!organisationApi) return
      loading.value = true
      await organisationApi.getOrganisationById(props.organisationId)
        .then(r => organisation.value = r.data)
        .catch((e: Error) => {
          alert(e.message)
          void router.push({ name: 'organisations' })
        })
        .finally(() => loading.value = false)
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      d,
      alert,
      organisation,
      loading
    }
  }
})
</script>
