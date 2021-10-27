<template>
  <q-splitter v-model="splitterModel">
    <template #before>
      <div class="q-pa-md">
        <q-tree
        ref="tree"
          :nodes="phenotypeNodes"
          node-key="id"
          selected-color="primary"
          v-model:expanded="treeExpansion"
          v-model:selected="selectedNode"
        />
      </div>
    </template>
    <template #after>
      <q-tabs v-model="tabModel" dense align="left" class="bg-primary text-white shadow-2">
        <q-tab :name="tab.id" :label="tab.label" v-for="tab in tabs" :key="tab.id" />
      </q-tabs>
      <q-tab-panels keep-alive v-model="tabModel">
        <q-tab-panel :name="tab.id" v-for="tab in tabs" :key="tab.id">
          <phenotype-editor :entityType="entityType" :entityId="tab.id" />
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-splitter>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IPhenotypeTreeNode, EntityType } from 'src/components/models'
import { QTree } from 'quasar'
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
      entityType: EntityType.UnrestrictedSinglePhenotype,
      phenotypeNodes: [] as IPhenotypeTreeNode[],
      treeExpansion: [],
      selectedNode: String,
      tabModel: '',
      tabs: [] as IPhenotypeTreeNode[]
    }
  },
  watch: {
    selectedNode (key: string) {
      if (key && !this.tabs.map((t: IPhenotypeTreeNode) => t.id).includes(key)) {
        let tree = this.$refs.tree as QTree
        this.tabs.push(tree.getNodeByKey(key) as IPhenotypeTreeNode)
        this.tabModel = key
      }
    }
  },
  mounted () {
    // TODO: load phenotype nodes
    this.phenotypeNodes = [
      {
        id: 1,
        label: 'Anthropometry',
        children: [
          { id: 3, label: 'BMI', icon: 'calculate' },
          { id: 4, label: 'Height', icon: 'calculate' },
          {
            id: 5,
            label: 'Weight',
            icon: 'calculate',
            children: [
              { id: 6, label: '1500-2500g' },
              { id: 7, label: '>80kg' }
            ]
          }
        ]
      },
      { id: 2, label: 'Laboratory values' }
    ]
  }
})
</script>
