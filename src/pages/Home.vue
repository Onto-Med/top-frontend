<template>
  <q-page class="q-pa-md q-gutter-md">
    <div class="row justify-between">
      <q-img src="/images/framework_overview.svg" fit="cover" height="400px">
        <span class="absolute-bottom-right text-h6 text-grey-4 q-pr-sm">
          v{{ version }}
        </span>
        <span class="absolute-bottom text-grey-4 text-center">
          <div v-t="'appDescription'" class="text-h6" />
          <div v-t="'projectState'" />
        </span>
      </q-img>
    </div>
    <div class="row text-center">
      <div class="col-sm-3 col-6">
        <q-avatar icon="groups" size="8rem" />
        <div class="text-h6">
          {{ t('organisation', 2) }}
          <q-badge v-if="statistic" :label="statistic.organisations" />
        </div>
      </div>
      <div class="col-sm-3 col-6">
        <q-avatar icon="tab" size="8rem" />
        <div class="text-h6">
          {{ t('repository', 2) }}
          <q-badge v-if="statistic" :label="statistic.repositories" />
        </div>
      </div>
      <div class="col-sm-3 col-6">
        <q-avatar icon="category" size="8rem" />
        <div class="text-h6">
          {{ t('phenotype', 2) }}
          <q-badge v-if="statistic" :label="statistic.phenotypes" />
        </div>
      </div>
      <div class="col-sm-3 col-6">
        <q-avatar icon="article" size="8rem" />
        <div class="text-h6">
          {{ t('document', 2) }}
          <q-badge v-if="statistic" :label="statistic.documents" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Statistic } from '@onto-med/top-api'
import { DefaultApiKey } from 'src/boot/axios'
import { defineComponent, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import packageInfo from '../../package.json'

export default defineComponent({
  name: 'Home',
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const defaultApi = inject(DefaultApiKey)
    const statistic = ref(undefined as Statistic|undefined)

    onMounted(() => defaultApi?.getStatistics().then(r => statistic.value = r.data))

    return {
      t,
      statistic,
      productName: packageInfo.productName,
      version: packageInfo.version
    }
  }
})
</script>
