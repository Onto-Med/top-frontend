<template>
  <div>
    <div v-for="(title, index) in value.titles" :key="index">
      <label :for="'title' + index" />
      <input type="text" value="value.titles.title" />
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

@Options({
  props: {
    value: Object
  }
})
export default class PhenotypeEditor extends Vue {
}
</script>
