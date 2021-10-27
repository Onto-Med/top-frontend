<template>
  <div class="home">
    <localized-text-input unique-langs v-model="phenotype.titles" :supported-langs="['de', 'en']" />
    <datatype-select v-model="phenotype.datatype" />
    <q-expansion-item expand-separator icon="description" label="Describing metadata">
      <localized-text-input v-model="phenotype.synonyms" :supported-langs="['de', 'en']" />
      <localized-text-input text-area rows="3" v-model="phenotype.descriptions" :supported-langs="['de', 'en']" />
    </q-expansion-item>

    <pre>{{ phenotype }}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import LocalizedTextInput from 'src/components/LocalizedTextInput.vue'
import DatatypeSelect from 'src/components/DatatypeSelect.vue'

export default defineComponent({
  name: 'Editor',
  components: {
    LocalizedTextInput,
    DatatypeSelect
  },
  data () {
    return {
      phenotype: {
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
  }
})
</script>

<style lang="scss">
.home {
  text-align: left;
}
</style>
