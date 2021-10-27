<template>
  <q-splitter v-model="splitterModel">
    <template #before>
      tree
    </template>
    <template #after>
      <phenotype-editor :entityType="entityType" />
    </template>
  </q-splitter>
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
      splitterModel: 25,
      entityType: EntityType.UnrestrictedSinglePhenotype
    }
  }
})
</script>
