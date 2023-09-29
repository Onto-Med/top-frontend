<template>
  <q-layout>
    <q-page class="q-pa-md q-gutter-md">
      <q-card>
        <q-card-section>
          <div class="text-h6">
            {{ t('documentSearch.title') }}
          </div>
          <span class="q-pt-md">{{ t('documentSearch.description') }}</span>
          <div class="row q-gutter-md">
            <q-btn-toggle
              v-model="searchType"
              :options="searchTypeOptions"
              no-caps
              rounded
            />
          </div>
        </q-card-section>

        <q-separator />

        <concept-cluster-form
          v-if="searchType === 'conceptCluster'"
        />
        <search-query-form
          v-if="searchType === 'searchQuery'"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          :query-id="queryId"
          :query-name="queryName"
          @clear-query-results="clearQueryResults"
        />
      </q-card>
    </q-page>
  </q-layout>
</template>

<script lang="ts">
import ConceptClusterForm from 'components/Documents/ConceptClusterForm.vue'
import SearchQueryForm from 'components/Documents/SearchQueryForm.vue'
import { useI18n } from 'vue-i18n'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  components: {
    ConceptClusterForm,
    SearchQueryForm
  },
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const queryId = ref<string|undefined>(undefined)
    const organisationId = ref<string|undefined>(undefined)
    const repositoryId = ref<string|undefined>(undefined)
    const queryName = ref<string|undefined>(undefined)
    const SearchTypesEnum = Object.freeze({
      CONCEPT_CLUSTER: 'conceptCluster',
      SEARCH_QUERY: 'searchQuery'
    })
    const searchType = ref(SearchTypesEnum.CONCEPT_CLUSTER.toString())
    const searchTypeOptions = computed(() => [
      {
        label: t('documentSearch.type.conceptCluster'),
        value: SearchTypesEnum.CONCEPT_CLUSTER,
      },
      {
        label: t('documentSearch.type.searchQuery'),
        value: SearchTypesEnum.SEARCH_QUERY,
      },
    ])

    const setSearchType = (set: string|undefined) => {
      organisationId.value = undefined
      repositoryId.value = undefined
      queryId.value = undefined
      queryName.value = undefined

      if (set) {
        searchType.value = set
        return
      }

      if (
        route.params.hasOwnProperty('organisationId')
        && route.params.hasOwnProperty('repositoryId')
        && route.params.hasOwnProperty('queryId')
      ) {

        organisationId.value = route.params.organisationId.toString()
        repositoryId.value = route.params.repositoryId.toString()
        queryId.value = route.params.queryId.toString()
        queryName.value = route.query.queryName? route.query.queryName.toString(): 'Query'

        searchType.value = SearchTypesEnum.SEARCH_QUERY
      } else {
        searchType.value = SearchTypesEnum.CONCEPT_CLUSTER
      }
    }

    onMounted(() => {
      setSearchType(undefined)
    })

    return {
      t,
      searchType,
      searchTypeOptions,
      queryId,
      organisationId,
      repositoryId,
      queryName,
      async clearQueryResults() {
        await router.replace('/document')
          .then(() => setSearchType(SearchTypesEnum.SEARCH_QUERY))
      },
    }
  }
})
</script>
