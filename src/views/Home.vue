<template>
  <div class="home">
    <phenotype-editor v-model="phenotype" />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import PhenotypeEditor from '@/components/PhenotypeEditor.vue'

@Options({
  components: {
    PhenotypeEditor
  }
})
export default class Home extends Vue {
  phenotype!: {
    title: {
      de: 'Größe',
      en: 'Height'
    }
  }
}
</script>
