<template>
  <div v-cloak>
    <q-toolbar>
      <q-toolbar-title class="text-subtitle1">
        <q-breadcrumbs>
          <!-- TODO: add super classes and super phenotypes -->
          <q-breadcrumbs-el :label="phenotype.title" />
        </q-breadcrumbs>
      </q-toolbar-title>
      <q-btn flat round dense icon="raw_on" color="primary" title="Show phenotype data as JSON" @click="showJson = true" />
    </q-toolbar>

    <div class="q-gutter-md q-pa-md">
      <localized-text-input unique-langs v-model="phenotype.titles" :supported-langs="['de', 'en']" />
      <datatype-select v-model="phenotype.datatype" />
      <q-expansion-item expand-separator icon="description" label="Describing metadata">
        <div class="q-gutter-md">
          <localized-text-input v-model="phenotype.synonyms" :supported-langs="['de', 'en']" label="Synonyms" />
          <localized-text-input text-area rows="3" v-model="phenotype.descriptions" :supported-langs="['de', 'en']" label="Descriptions" />
        </div>
      </q-expansion-item>
    </div>

    <q-dialog v-model="showJson">
      <q-card>
        <q-card-section>
          <div class="text-h6">Current state of the phenotype</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <pre>{{ phenotype }}</pre>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IPhenotype, EntityType } from './models';
import LocalizedTextInput from 'src/components/LocalizedTextInput.vue'
import DatatypeSelect from 'src/components/DatatypeSelect.vue'

export default defineComponent({
  name: 'PhenotypeEditor',
  components: {
    LocalizedTextInput,
    DatatypeSelect
  },
  props: {
    entityType: {
      type: String as () => EntityType,
      required: true
    }
  },
  data () {
    return {
      showJson: false,
      phenotype: null as IPhenotype
    }
  },
  created () {
    // TODO: load phenotype from API
    this.phenotype = {
      title: 'Example Phenotype',
      titles: [
        { lang: 'de', text: 'Größe' },
        { lang: 'en', text: 'Height' }
      ],
      datatype: 'numeric',
      synonyms: [],
      descriptions: [
        { lang: 'de', text: 'Beispielbeschreibung' },
        { lang: 'en', text: 'Example description' }
      ]
    }
  }
})
</script>
