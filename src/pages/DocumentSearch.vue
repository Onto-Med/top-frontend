<template>
  <q-page class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('document', 2) }}
        </div>
      </q-card-section>
      <q-card-section>
        {{ t('documentPage.description') }}
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import {defineComponent, inject, onMounted, ref} from 'vue'
import { useI18n } from 'vue-i18n'
import {DocumentApiKey, OrganisationApiKey} from 'src/boot/axios'
import {Document} from "@onto-med/top-api";

export default defineComponent({
  name: 'DocumentSearch',
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const documentApi = inject(DocumentApiKey)
    const documents   = ref<Document[]>([])
    const loading   = ref(false)

    // I don't know why I don't see it in git...
    const reload = async () => {
      if (!documentApi) return
      loading.value = true
      await documentApi.getDocuments()
        .then(r => documents.value = r.data)
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
    }
  }
})
</script>
