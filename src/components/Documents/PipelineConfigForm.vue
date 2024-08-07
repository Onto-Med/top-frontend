<template>
  <q-dialog ref="dialogRef">
    <q-card class="content">
      <q-card-section class="row items-center q-gutter-sm">
        <div class="col text-h6">
          {{ t('configurationOfPipeline') }}
        </div>
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-separator />
      <q-card-section class="q-pa-none">
        <JsonEditorVue
          v-model="jsonConfig"
          v-bind="{/* local props & attrs */}"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import JsonEditorVue from 'json-editor-vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const jsonConfig = ref({
  'data': {
    'spacy_model': 'de_dep_news_trf',
    'n_process': 1,
    'file_extension': 'txt',
    'file_encoding': 'utf-8',
    'use_lemma': false,
    'prepend_head': false,
    'head_only': false,
    'case_sensitive': false,
    'tfidf_filter': {
      'enabled': false,
      'min_df': 1,
      'max_df': 1.0,
      'stop': false
    },
    'disable': null,
    'negspacy': {
      'enabled': true,
      'configuration': {
        'chunk_prefix': ['kein', 'keine', 'keinen'],
        'neg_termset_file': './conf/negex_files/negex_trigger_german_biotxtm_2016_extended.txt',
        'scope': 1,
        'language': 'de',
        'feat_of_interest': 'NC'
      }
    }
  },
  'embedding': {
    'model': 'Sahajtomar/German-semantic',
    'n_process': 1
  },
  'clustering': {
    'algorithm': 'kmeans',
    'downscale': 'umap',
    'missing_as_recommended': true,
    'scaling': {

    },
    'clustering': {

    },
    'kelbow': {

    }
  },
  'graph': {
    'cluster': {
      'distance': 0.7,
      'min_size': 4
    },
    'graph': {
      'cosine_weight': 0.6,
      'merge_threshold': 0.95,
      'graph_weight_cut_off': 0.5,
      'unroll': false,
      'simplify': 0.5,
      'simplify_alg': 'significance',
      'sub_clustering': false
    },
    'restrict_to_cluster': true
  }
})
</script>

<style scoped lang="sass">

</style>
