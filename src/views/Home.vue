<template>
  <div class="home">
    <localized-text unique-langs v-model="phenotype.titles" :supported-langs="['de', 'en']" />
    <div>
      Describing metadata
      <localized-text v-model="phenotype.synonyms" :supported-langs="['de', 'en']" />
      <localized-text text-area rows="3" v-model="phenotype.descriptions" :supported-langs="['de', 'en']" />
    </div>

    <pre>{{ phenotype }}</pre>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import LocalizedText from '@/components/LocalizedText.vue'

@Options({
  components: {
    LocalizedText
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
