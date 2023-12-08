<template>
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

      <q-card-section class="q-pa-none">
        <concept-cluster-form
          v-if="searchType === SearchTypesEnum.CONCEPT_CLUSTER"
        />
        <search-query-form
          v-if="searchType === SearchTypesEnum.SEARCH_QUERY"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          :query-id="queryId"
          :query-name="queryName"
          @clear-query-results="clearQueryResults"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import ConceptClusterForm from 'components/Documents/ConceptClusterForm.vue'
import SearchQueryForm from 'components/Documents/SearchQueryForm.vue'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SearchTypesEnum } from 'src/config'
import { watch } from 'vue'

const props = defineProps({
  initialSearchType: {
    type: String as () => SearchTypesEnum,
    default: SearchTypesEnum.CONCEPT_CLUSTER
  }
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const queryId = ref<string|undefined>(undefined)
const organisationId = ref<string|undefined>(undefined)
const repositoryId = ref<string|undefined>(undefined)
const queryName = ref<string|undefined>(undefined)
const searchType = ref(props.initialSearchType)
const searchTypeOptions = computed(() => 
  Object.values(SearchTypesEnum)
    .map(st => ({ label: t(st), value: st }))
)

void setSearchTypeInRouteQuery(searchType.value)

watch(
  searchType,
  async (newValue) => await setSearchTypeInRouteQuery(newValue)
)

async function setSearchTypeInRouteQuery(searchType: SearchTypesEnum) {
  await router.replace({ name: 'documentSearch', query: { searchType } })
}

function setSearchType(set?: SearchTypesEnum) {
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
    queryName.value = route.query.queryName ? route.query.queryName.toString() : 'Query'
    searchType.value = SearchTypesEnum.SEARCH_QUERY
  } else {
    searchType.value = SearchTypesEnum.CONCEPT_CLUSTER
  }
}

function clearQueryResults() {
  setSearchType(SearchTypesEnum.SEARCH_QUERY)
}
</script>
