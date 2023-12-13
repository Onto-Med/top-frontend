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
import {useI18n} from 'vue-i18n'
import {computed, ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import {SearchTypesEnum} from 'src/config'

const props = defineProps({
  initialSearchType: {
    type: String as () => SearchTypesEnum,
    default: SearchTypesEnum.CONCEPT_CLUSTER
  },
  organisationId: {
    type: String,
    default: undefined
  },
  repositoryId: {
    type: String,
    default: undefined
  },
  queryId: {
    type: String,
    default: undefined
  },
  queryName: {
    type: String,
    default: undefined
  },
})

const { t } = useI18n()
const router = useRouter()
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

async function clearQueryResults() {
  await router.replace(
    {
      name: 'documentSearch',
      query: { searchType: SearchTypesEnum.SEARCH_QUERY },
    })
}
</script>
