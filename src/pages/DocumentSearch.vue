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
        />
      </q-card>
    </q-page>
  </q-layout>
</template>

<script lang="ts">
import ConceptClusterForm from 'components/Documents/ConceptClusterForm.vue'
import SearchQueryForm from 'components/Documents/SearchQueryForm.vue'
import {useI18n} from 'vue-i18n'
import {computed, defineComponent, onMounted, ref} from 'vue'
import {useRoute} from 'vue-router'

export default defineComponent({
  components: {
    ConceptClusterForm,
    SearchQueryForm
  },
  setup() {
    const {t} = useI18n()
    const route = useRoute()
    const queryId = ref<string|undefined>(undefined)
    const organisationId = ref<string|undefined>(undefined)
    const repositoryId = ref<string|undefined>(undefined)
    const queryName = ref<string|undefined>(undefined)
    const searchType = ref('conceptCluster')
    const searchTypeOptions = computed(() => [
      {
        label: t('documentSearch.type.conceptCluster'),
        value: 'conceptCluster',
      },
      {
        label: t('documentSearch.type.searchQuery'),
        value: 'searchQuery',
      },
    ])

    const setSearchType = () => {
      organisationId.value = undefined
      repositoryId.value = undefined
      queryId.value = undefined
      queryName.value = undefined
      if (route.params.hasOwnProperty('organisationId') &&
        route.params.hasOwnProperty('repositoryId') &&
        route.params.hasOwnProperty('queryId')) {
        searchType.value = 'searchQuery'
        organisationId.value = route.params.organisationId.toString()
        repositoryId.value = route.params.repositoryId.toString()
        queryId.value = route.params.queryId.toString()
        queryName.value = route.query.queryName? route.query.queryName.toString(): 'Query'
      } else {
        if (route.query.redirect != null && route.query.redirect.toString().toLowerCase() === 'true') {
          searchType.value = 'searchQuery'
        } else {
          searchType.value = 'conceptCluster'
        }
      }
    }

    onMounted( () => {
      setSearchType()
    })

    return {
      t,
      searchType,
      searchTypeOptions,
      queryId,
      organisationId,
      repositoryId,
      queryName
    }
  }
})
</script>
