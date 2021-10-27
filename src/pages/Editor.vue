<template>
  <phenotype-editor :entityType="entityType" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { EntityType } from 'src/components/models';
import PhenotypeEditor from 'src/components/PhenotypeEditor.vue'

export default defineComponent({
  name: 'Editor',
  components: {
    PhenotypeEditor
  },
  data () {
    return {
      showJson: false,
      entityType: EntityType.UnrestrictedSinglePhenotype
    }
  }
})
</script>
