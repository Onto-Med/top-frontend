<template>
  <div class="home">
    <localized-text-input unique-langs v-model="phenotype.titles" :supported-langs="['de', 'en']" />
    <datatype-select v-model="phenotype.datatype" />
    <div>
      Describing metadata
      <localized-text-input v-model="phenotype.synonyms" :supported-langs="['de', 'en']" />
      <localized-text-input text-area rows="3" v-model="phenotype.descriptions" :supported-langs="['de', 'en']" />
    </div>

    <pre>{{ phenotype }}</pre>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import LocalizedTextInput from '@/components/LocalizedTextInput.vue'
import DatatypeSelect from '@/components/DatatypeSelect.vue'

@Options({
  components: {
    LocalizedTextInput,
    DatatypeSelect
  }
})
export default class Home extends Vue {
  phenotype = {
    titles: [
      { lang: 'de', text: 'Größe' },
      { lang: 'en', text: 'Height' }
    ],
    synonyms: [],
    descriptions: [
      { lang: 'de', text: 'Beispielbeschreibung' },
      { lang: 'en', text: 'Example description' }
    ]
  };
}
</script>

<style lang="scss">
.home {
  text-align: left;
}
</style>
