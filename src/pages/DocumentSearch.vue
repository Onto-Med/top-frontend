<template>
  <q-page class="q-pa-md q-gutter-md">
    <q-card>
      <q-card-section class="row no-wrap justify-between">
        <div>
          <div class="text-h6">
            {{ t('documentSearch.title') }}
          </div>
          <span class="q-pt-md">{{ t('documentSearch.description') }}</span>
          <q-select
            v-model="dataSource"
            :options="dataSources"
            :label="t('dataSource')"
            :error="!dataSource"
            hide-bottom-space
          />
        </div>
      </q-card-section>
      <q-separator />

      <q-card-section class="q-pa-none">
        <concept-cluster-form
          :data-source="dataSource"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import ConceptClusterForm from 'components/Documents/ConceptClusterForm.vue'
import { useI18n } from 'vue-i18n'
import { inject, onMounted, ref } from 'vue'
import { SearchTypesEnum } from 'src/config'
import { DataSource, QueryType } from '@onto-med/top-api'
import { QueryApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'

defineProps({
  initialSearchType: {
    type: String as () => SearchTypesEnum,
    default: SearchTypesEnum.CONCEPT_CLUSTER
  },
  organisationId: String,
  repositoryId: String,
  queryId: String,
  queryName: String
})

const { t } = useI18n()
const { renderError } = useNotify()
const dataSource = ref<DataSource>()
const dataSources = ref<DataSource[]>([])
const queryApi = inject(QueryApiKey)

onMounted(() => reloadDataSources())

function reloadDataSources() {
  queryApi
    ?.getDataSources(QueryType.Concept)
    .then((r) => (dataSources.value = r.data))
    .catch((e: Error) => renderError(e))
}
</script>
