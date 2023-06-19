<template>
  <q-select
    v-model="locale"
    :options="localeOptions"
    label="Language"
    dense
    borderless
    emit-value
    map-options
    options-dense
    style="min-width: 150px"
  />
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  setup () {
    const $q = useQuasar()
    const { locale } = useI18n({ useScope: 'global' })

    watch(
      locale,
      (newVal) => $q.localStorage.set('language', newVal)
    )

    return {
      locale,
      localeOptions: [
        { value: 'en', label: 'English' },
        { value: 'de', label: 'Deutsch' }
      ]
    }
  }
}
</script>
