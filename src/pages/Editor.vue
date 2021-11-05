<template>
  <q-page>
    <q-splitter v-model="splitterModel" style="min-height: inherit; height: 100px">
      <template #before>
        <div class="column fit">
          <q-toolbar class="q-pr-none">
            <q-toolbar-title>
              <q-input v-model="treeFilter" dense filled :label="t('filter')">
                <template #append>
                  <q-icon v-show="treeFilter !== ''" name="clear" class="cursor-pointer" @click="treeFilter = ''" />
                </template>
              </q-input>
            </q-toolbar-title>

            <q-separator vertical />
            <q-btn stretch flat :icon="list ? 'account_tree' : 'view_list'" :title="t('entityTree.listDescription')" @click="list = !list" />
            <q-separator vertical />
            <q-btn stretch flat icon="refresh" :title="t('reload')" @click="refreshTree()" />
          </q-toolbar>

          <q-separator />

          <div class="col">
            <q-tree
              ref="tree"
              v-model:expanded="treeExpansion"
              v-model:selected="selected"
              :nodes="visibleEntityNodes"
              :filter="treeFilter"
              node-key="id"
              children-key="subClasses"
              selected-color="primary"
            >
              <template #default-header="prop">
                <div class="row items-center">
                  <q-icon
                    v-if="prop.node.getIcon()"
                    :name="prop.node.getIcon()"
                    :title="prop.node.getIconTooltip()"
                    class="q-mr-sm"
                  />
                  {{ prop.node.getTitle() }}
                </div>
              </template>
            </q-tree>
            <q-inner-loading
              :showing="treeLoading"
              :label="t('pleaseWait') + '...'"
            />
            <q-menu context-menu>
              <q-list dense>
                <q-item v-close-popup clickable>
                  <q-item-section>Example Entry</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </div>
      </template>

      <template #after>
        <div class="column fit">
          <q-tabs v-model="selected" dense no-caps align="left" class="bg-primary text-white shadow-2 entity-editor-tabs-bar">
            <q-tab v-for="tab in tabs" :key="tab.id" :name="tab.id">
              <span class="no-wrap">
                {{ tab.getTitle() }}
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
          <q-tab-panels v-model="selected" keep-alive animated class="col entity-editor-tab">
            <q-tab-panel v-for="tab in tabs" :key="tab.id" :name="tab.id" class="q-pa-none">
              <entity-editor
                :entity-type="entityType"
                :entity-id="tab.id"
                @entity-clicked="selected = $event"
                @reload-failed="closeTab(tab); alert($event.message)"
              />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </template>
    </q-splitter>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType } from 'src/components/models'
import { Entity } from 'src/models/Entity'
import { QTree, Notify } from 'quasar'
import EntityEditor from 'src/components/EntityEditor.vue'
import { fetchEntityTree } from 'src/api/entityRepository'

export default defineComponent({
  name: 'Editor',
  components: {
    EntityEditor
  },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return { t }
  },
  data () {
    return {
      showJson: false,
      splitterModel: 25,
      entityType: EntityType.SinglePhenotype,
      entityNodes: [] as Entity[],
      treeExpansion: [],
      treeFilter: '',
      selected: '' as string|number,
      tabs: [] as Entity[],
      list: false,
      treeLoading: false
    }
  },
  computed: {
    visibleEntityNodes (): Entity[] {
      if (!this.list) return this.entityNodes as Entity[]
      return (this.entityNodes as Entity[]).flatMap(
        function loop (e: Entity): Entity[] {
          if (e.entityType === EntityType.Category && e.subClasses)
            return e.subClasses.flatMap(loop)
          else return [e]
        }
      )
    }
  },
  watch: {
    selected (key: string) {
      if (!key) return
      if (!this.tabs.map(t => t.id).includes(key)) {
        let tree = this.$refs.tree as QTree
        this.tabs.push(tree.getNodeByKey(key) as Entity)
      }
    }
  },
  mounted () {
    this.refreshTree()
  },
  methods: {
    refreshTree (): void {
      this.treeLoading = true
      fetchEntityTree()
        .then(r => this.entityNodes = r)
        .finally(() => this.treeLoading = false)
    },
    closeTab (tab: Entity): void {
      const tabIds = this.tabs.map(t => t.id)
      const index = tabIds.indexOf(tab.id)
      this.tabs.splice(index, 1)
      tabIds.splice(index, 1)
      if (this.selected === tab.id)
        this.selected = tabIds.pop() || ''
    },
    alert (msg: string): void {
      Notify.create({
        type: 'warning',
        message: msg,
        progress: true,
        multiLine: true,
        actions: [ { label: this.t('dismiss'), color: 'black' } ]
      })
    }
  }
})
</script>

<style lang="sass" scoped>
.entity-editor-tabs-bar
  width: 100%
.entity-editor-tab
  height: 100%
  width: 100%
</style>