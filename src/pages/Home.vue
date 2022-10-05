<template>
  <q-page class="q-pa-md q-gutter-md">
    <div class="row justify-between">
      <q-parallax src="https://cdn.quasar.dev/img/image-src.png">
        <div class="text-h3 text-white text-center">
          {{ productName }}
        </div>
        <div class="text-h6 text-grey-3 text-center">
          v{{ version }}
        </div>
        <br>
        <div v-t="'appSubtitle'" class="text-h5 text-white text-center" />
        <div v-t="'appDescription'" class="text-white text-center" />
      </q-parallax>
    </div>
    <div class="row text-center">
      <div class="col">
        <q-avatar icon="groups" size="8rem" />
        <div class="text-h6">
          {{ t('organisation', 2) }}
          <q-badge v-if="statistic" :label="statistic.organisations" />
        </div>
      </div>
      <div class="col">
        <q-avatar icon="tab" size="8rem" />
        <div class="text-h6">
          {{ t('repository', 2) }}
          <q-badge v-if="statistic" :label="statistic.repositories" />
        </div>
      </div>
      <div class="col">
        <q-avatar icon="folder" size="8rem" />
        <div class="text-h6">
          {{ t('category', 2) }}
          <q-badge v-if="statistic" :label="statistic.categories" />
        </div>
      </div>
      <div class="col">
        <q-avatar icon="category" size="8rem" />
        <div class="text-h6">
          {{ t('phenotype', 2) }}
          <q-badge v-if="statistic" :label="statistic.phenotypes" />
        </div>
      </div>
      <div class="col">
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
