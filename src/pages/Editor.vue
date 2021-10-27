<template>
  <phenotype-editor :entityType="entityType" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PhenotypeEditor from 'src/components/PhenotypeEditor.vue'

export default defineComponent({
  name: 'Editor',
  components: {
    PhenotypeEditor
  },
  data () {
    return {
      showJson: false,
      entityType: 'unrestricted_single_phenotype'
    }
  }
})
</script>
