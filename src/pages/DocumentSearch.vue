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
        />
      </q-card>
    </q-page>
  </q-layout>
</template>

<script setup lang="ts">
import ConceptClusterForm from 'components/Documents/ConceptClusterForm.vue';
import SearchQueryForm from 'components/Documents/SearchQueryForm.vue';
import {useI18n} from 'vue-i18n';
import {computed, ref} from 'vue';

const { t } = useI18n()

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
</script>
