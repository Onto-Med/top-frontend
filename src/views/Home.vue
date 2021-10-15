<template>
  <div class="home">
    <localized-text v-model="phenotype.titles" :supportedLangs="['de', 'en']" :uniqueLangs="true" />
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
    ]
  };
}
</script>
