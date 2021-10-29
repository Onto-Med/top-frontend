<template>
  <q-splitter v-model="splitterModel">
    <template #before>
      <div class="q-pa-md">
        <q-tree
          ref="tree"
          v-model:expanded="treeExpansion"
          v-model:selected="selected"
          :nodes="entityNodes"
          node-key="id"
          selected-color="primary"
        />
      </div>
      <q-menu ref="treeContextMenu" context-menu>
        <q-list dense>
          <q-item v-close-popup clickable>
            <q-item-section>Example Entry</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </template>
    <template #after>
      <q-tabs v-model="selected" dense align="left" class="bg-primary text-white shadow-2">
        <q-tab v-for="tab in tabs" :key="tab.id" :name="tab.id">
          <span class="no-wrap">
            {{ tab.label }}
            <q-btn
              flat
              dense
              rounded
              icon="close"
              size="xs"
              @click.prevent="closeTab(tab)"
            />
          </span>
        </q-tab>
      </q-tabs>
      <q-tab-panels v-model="selected" keep-alive animated>
        <q-tab-panel v-for="tab in tabs" :key="tab.id" :name="tab.id">
          <entity-editor :entity-type="entityType" :entity-id="tab.id" />
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-splitter>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IEntityTreeNode, EntityType } from 'src/components/models'
import { QTree } from 'quasar'
import EntityEditor from 'src/components/EntityEditor.vue'

export default defineComponent({
  name: 'Editor',
  components: {
    EntityEditor
  },
  data () {
    return {
      showJson: false,
      splitterModel: 25,
      entityType: EntityType.SinglePhenotype,
      entityNodes: [] as IEntityTreeNode[],
      treeExpansion: [],
      selected: '' as string,
      tabs: [] as IEntityTreeNode[]
    }
  },
  watch: {
    selected (key: string) {
      if (!key) return
      if (!this.tabs.map((t: IEntityTreeNode) => t.id).includes(key)) {
        let tree = this.$refs.tree as QTree
        this.tabs.push(tree.getNodeByKey(key) as IEntityTreeNode)
      }
    }
  },
  mounted () {
    // TODO: load entity nodes
    this.entityNodes = [
      {
        id: 'anthropometry',
        label: 'Anthropometry',
        children: [
          { id: 'bmi', label: 'BMI', icon: 'calculate' },
          { id: 'height', label: 'Height', icon: 'calculate' },
          {
            id: 'weight',
            label: 'Weight',
            icon: 'calculate',
            children: [
              { id: 'weight_1500_to_2500g', label: '1500-2500g' },
              { id: 'weight_gt_80kg', label: '>80kg' }
            ]
          }
        ]
      },
      { id: 'laboratory_values', label: 'Laboratory values' }
    ]
  },
  methods: {
    closeTab (tab: IEntityTreeNode): void {
      this.tabs.splice(this.tabs.map(t => t.id).indexOf(tab.id), 1)
      if (this.selected === tab.id) this.selected = ''
    }
  }
})
</script>
