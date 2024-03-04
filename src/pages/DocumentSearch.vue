<template>
  <q-page class="q-pa-md q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('documentSearch.title') }}
        </div>
        <div v-if="query">
          {{ t('dataOfQuery', { thing: query.name || query.id }) }}
        </div>
        <q-select
          v-else
          v-model="dataSource"
          :options="dataSources"
          :label="t('dataSource')"
          :error="!dataSource"
          dense
          hide-bottom-space
          class="data-source-select"
        />
      </q-card-section>
      <q-separator />

      <q-card-section class="q-pa-none">
        <concept-cluster-form :data-source="dataSource" class="cluster-form" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import ConceptClusterForm from 'components/Documents/ConceptClusterForm.vue'
import { useI18n } from 'vue-i18n'
import { inject, onMounted, ref, watch } from 'vue'
import { SearchTypesEnum } from 'src/config'
import { DataSource, Query, QueryType } from '@onto-med/top-api'
import { QueryApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'

const props = defineProps({
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
const query = ref<Query>()

watch(
  () => props.queryId,
  () => loadQuery()
)

onMounted(() => {
  loadQuery()
  reloadDataSources()
})

function reloadDataSources() {
  queryApi
    ?.getDataSources(QueryType.Concept)
    .then((r) => (dataSources.value = r.data))
    .catch((e: Error) => renderError(e))
}

function loadQuery() {
  if (props.organisationId && props.repositoryId && props.queryId)
    queryApi
      ?.getQueryById(props.organisationId, props.repositoryId, props.queryId)
      .then((r) => (query.value = r.data))
      .catch((e: Error) => renderError(e))
}
</script>

<style lang="sass" scoped>
.data-source-select
  min-width: 50px
  max-width: 500px
</style>
