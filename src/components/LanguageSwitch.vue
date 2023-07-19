<template>
  <q-select
    v-model="locale"
    :options="languages"
    label="Language"
    dense
    borderless
    emit-value
    map-options
    options-dense
    style="min-width: 150px"
  />
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { languages } from 'src/config'

const $q = useQuasar()
const { locale } = useI18n()

watch(
  locale,
  (newVal) => $q.localStorage.set('language', newVal)
)
</script>
