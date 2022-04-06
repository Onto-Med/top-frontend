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
        <div v-t="'appDescription'" class="text-h5 text-white text-center" />
      </q-parallax>
    </div>
    <div class="row text-center">
      <div class="col">
        <q-avatar icon="groups" size="8rem" />
        <div class="text-h6">
          {{ t('organisation', 2) }}
          <q-badge label="xx" />
        </div>
      </div>
      <div class="col">
        <q-avatar icon="tab" size="8rem" />
        <div class="text-h6">
          {{ t('repository', 2) }}
          <q-badge label="xx" />
        </div>
      </div>
      <div class="col">
        <q-avatar icon="category" size="8rem" />
        <div class="text-h6">
          {{ t('phenotype', 2) }}
          <q-badge label="xx" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import packageInfo from '../../package.json'

export default defineComponent({
  name: 'Home',
  components: {
  },
  props: {
  },
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
