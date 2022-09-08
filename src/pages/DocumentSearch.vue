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
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'DocumentSearch',
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,
    }
  }
})
</script>
