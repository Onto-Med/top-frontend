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
          v-model:selected="selected"
        />
      </div>
      <q-menu context-menu ref="treeContextMenu">
        <q-list dense>
          <q-item clickable v-close-popup>
            <q-item-section>Example Entry</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </template>
    <template #after>
      <q-tabs v-model="selected" dense align="left" class="bg-primary text-white shadow-2">
        <q-tab :name="tab.id" v-for="tab in tabs" :key="tab.id">
          <span class="no-wrap">
            {{ tab.label }}
            <q-btn flat dense rounded icon="close" size="xs" @click.prevent="closeTab(tab)" />
          </span>
        </q-tab>
      </q-tabs>
      <q-tab-panels keep-alive animated v-model="selected">
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
      selected: '' as string,
      tabs: [] as IPhenotypeTreeNode[]
    }
  },
  watch: {
    selected (key: string) {
      if (!key) return
      if (!this.tabs.map((t: IPhenotypeTreeNode) => t.id).includes(key)) {
        let tree = this.$refs.tree as QTree
        this.tabs.push(tree.getNodeByKey(key) as IPhenotypeTreeNode)
      }
    }
  },
  methods: {
    closeTab (tab: IPhenotypeTreeNode): void {
      this.tabs.splice(this.tabs.indexOf(tab.id), 1)
      if (this.selected === tab.id) this.selected = ''
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
