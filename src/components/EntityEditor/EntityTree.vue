<template>
  <div>
    <q-toolbar class="q-pr-none">
      <q-toolbar-title>
        <q-input v-model="filter" dense filled :label="t('filter')">
          <template #append>
            <q-icon v-show="filter !== ''" name="clear" class="cursor-pointer" @click="filter = ''" />
          </template>
        </q-input>
      </q-toolbar-title>

      <q-separator vertical />
      <q-btn stretch flat :icon="asList ? 'account_tree' : 'view_list'" :title="t('entityTree.listDescription')" @click="asList = !asList" />
      <q-separator vertical />
      <q-btn stretch flat icon="refresh" :title="t('reload')" @click="$emit('refreshClicked')" />
    </q-toolbar>

    <q-separator />

    <div class="col">
      <q-tree
        v-model:expanded="expansion"
        :selected="selected ? selected.id : ''"
        :nodes="treeNodes"
        :filter="filter"
        :filter-method="filterFn"
        :no-nodes-label="t('entityTree.noNodesLabel')"
        :no-results-label="t('entityTree.noResultsLabel')"
        no-selection-unset
        node-key="id"
        selected-color="primary"
        @update:selected="handleSelectedChange"
      >
        <template #default-header="{ node }">
          <div class="row items-center fit">
            <q-icon
              v-if="getIcon(node)"
              :name="getIcon(node)"
              :title="getIconTooltip(node)"
              :class="{ restriction: isRestricted(node) }"
              class="q-mr-sm"
            />
            <div :title="getDescriptions(node).join('\n')">
              {{ getTitle(node) }}
            </div>
            <entity-tree-context-menu
              :entity="node"
              @delete-entity-clicked="$emit('deleteEntity', $event)"
              @create-entity-clicked="handleCreateEntityClicked"
            />
          </div>
        </template>
      </q-tree>
      <entity-tree-context-menu @create-entity-clicked="handleCreateEntityClicked" />
    </div>
    <q-inner-loading
      :showing="loading"
      :label="t('pleaseWait') + '...'"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import EntityTreeContextMenu from 'src/components/EntityEditor/EntityTreeContextMenu.vue'
import { Category, EntityType, Entity } from '@onto-med/top-api'

export default defineComponent({
  name: 'EntityTree',
  components: { EntityTreeContextMenu },
  props: {
    nodes: Array as () => Entity[],
    selected: Object as () => Entity,
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:selected', 'refreshClicked', 'deleteEntity', 'createEntity'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }     = useI18n()
    const { getIcon, getIconTooltip, getTitle, getDescriptions, isRestricted } = useEntityFormatter()
    const expansion = ref([] as string[])
    const filter    = ref('')
    const asList    = ref(false)

    const visibleNodes = computed((): Entity[] => {
      if (!props.nodes) return []
      if (!asList.value) return props.nodes
      return props.nodes.filter(n => n.entityType !== EntityType.Category)
    })

    const toTree = (list: Entity[]): TreeNode[] => {
      const map: Map<string, TreeNode> = new Map<string, TreeNode>()
      const treeNodes: TreeNode[] = []

      list
        .filter(e => e.id)
        .forEach(e => map.set(e.id as string, { ...e, children: [] } as TreeNode))

      list
        .filter(e => e.id)
        .forEach(e => {
          let root = true;

          (e as Category).superCategories?.forEach(c => {
            if (c.id && map.get(c.id)) {
              (map.get(c.id) as TreeNode).children.push(map.get(e.id as string) as TreeNode)
              root = false
            }
          })
          if (isRestricted(e)) {
            if (e.superPhenotype && e.superPhenotype.id && map.get(e.superPhenotype.id)) {
              (map.get(e.superPhenotype.id) as TreeNode).children.push(map.get(e.id as string) as TreeNode)
              root = false
            }
          }

          if (root) {
            treeNodes.push(map.get(e.id as string) as TreeNode)
            return
          }
        })

      return treeNodes
    }

    return {
      t,
      expansion,
      asList,
      filter,
      EntityType,
      getIcon,
      getIconTooltip,
      getTitle,
      getDescriptions,
      isRestricted,

      treeNodes: computed((): TreeNode[] => {
        return toTree(visibleNodes.value)
      }),

      handleSelectedChange (key: string): void {
        if (!key || !props.nodes) {
          emit('update:selected', undefined)
        } else {
          const node = props.nodes.find(n => n.id === key)
          emit('update:selected', node)
        }
      },

      filterFn (node: Entity, filter: string): boolean {
        return getTitle(node).toLowerCase().includes(filter.toLowerCase())
      },

      handleCreateEntityClicked (t: EntityType, e?: string) {
        if (e) expansion.value.push(e)
        emit('createEntity', t, e)
      }
    }
  }
})

interface TreeNode extends Entity {
  children: TreeNode[]
}
</script>
