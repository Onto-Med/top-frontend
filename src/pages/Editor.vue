<template>
  <q-page>
    <q-splitter v-model="splitterModel" style="min-height: inherit; height: 100px">
      <template #before>
        <div class="column fit q-pa-md">
          <q-tree
            ref="tree"
            v-model:expanded="treeExpansion"
            v-model:selected="selected"
            :nodes="entityNodes"
            node-key="id"
            selected-color="primary"
          />
          <q-menu context-menu>
            <q-list dense>
              <q-item v-close-popup clickable>
                <q-item-section>Example Entry</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </template>

      <template #after>
        <div class="column fit">
          <q-tabs v-model="selected" dense align="left" class="bg-primary text-white shadow-2 col-auto">
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
          <q-tab-panels v-model="selected" keep-alive animated class="col">
            <q-tab-panel v-for="tab in tabs" :key="tab.id" :name="tab.id">
              <entity-editor :entity-type="entityType" :entity-id="tab.id" @entity-clicked="selected = $event" />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </template>
    </q-splitter>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IEntityTreeNode, EntityType } from 'src/components/models'
import { QTree } from 'quasar'
import EntityEditor from 'src/components/EntityEditor.vue'
import { fetchEntityTree } from 'src/api/entityRepository'

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
      selected: '' as string|number,
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
    this.entityNodes = fetchEntityTree()
  },
  methods: {
    closeTab (tab: IEntityTreeNode): void {
      const tabIds = this.tabs.map(t => t.id)
      const index = tabIds.indexOf(tab.id)
      this.tabs.splice(index, 1)
      tabIds.splice(index, 1)
      if (this.selected === tab.id)
        this.selected = tabIds.pop() || ''
    }
  }
})
</script>
