<template>
  <q-page class="q-pa-md q-gutter-md" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import packageInfo from '../../package.json'

export default defineComponent({
  name: 'DocumentSearch',
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,
      productName: packageInfo.productName,
      version: packageInfo.version
    }
  }
})
</script>
