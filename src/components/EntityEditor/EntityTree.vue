<template>
  <div>
    <q-toolbar class="q-px-none q-gutter-y-sm">
      <q-toolbar-title class="q-px-none">
        <q-input v-model="filter" dense filled :label="t('filter')">
          <template #append>
            <q-icon v-show="filter !== ''" name="clear" class="cursor-pointer" @click="filter = ''" />
          </template>
        </q-input>
      </q-toolbar-title>

      <q-separator vertical />
      <q-btn stretch flat :icon="asList ? 'account_tree' : 'view_list'" :title="t('entityTree.listDescription')" @click="asList = !asList" />
      <q-separator vertical />
      <q-btn stretch flat icon="refresh" :title="t('reload')" @click="handleRefreshClick" />
    </q-toolbar>

    <q-separator />

    <q-scroll-area class="col">
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
          <div class="row items-center fit non-selectable">
            <q-icon
              v-if="getIcon(node)"
              :name="getIcon(node)"
              :title="getIconTooltip(node)"
              :class="{ restriction: isRestricted(node) }"
              class="q-mr-sm"
            />
            <div :title="getDescriptions(node).join('\n')" :class="{ 'text-italic': !node.createdAt }" class="col ellipsis">
              {{ getTitle(node) }}
            </div>
            <q-badge v-show="!node.createdAt" v-t="'new'" color="accent" class="q-ml-sm" />
            <entity-tree-context-menu
              v-if="showContextMenu"
              :entity="node"
              @delete-entity-clicked="$emit('deleteEntity', $event)"
              @create-entity-clicked="handleCreateEntityClicked"
              @duplicate-entity-clicked="$emit('duplicateEntity', $event)"
              @export-clicked="$emit('exportEntity', $event)"
            />
          </div>
        </template>
      </q-tree>
      <entity-tree-context-menu v-if="showContextMenu" @create-entity-clicked="handleCreateEntityClicked" />
    </q-scroll-area>
    <q-inner-loading
      :showing="loading"
      :label="t('pleaseWait') + '...'"
    />

    <q-dialog v-model="showRefreshDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-item>
            <q-item-section avatar>
              <q-avatar icon="warning_amber" color="warning" text-color="white" />
            </q-item-section>
            <q-item-section v-t="'entityEditor.confirmRefreshTree'" />
          </q-item>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
          <q-btn v-close-popup flat :label="t('ok')" color="primary" @click="$emit('refreshClicked')" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
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
    },
    showContextMenu: {
      type: Boolean,
      default: false
    },
    excludeTypeIfEmpty: {
      type: Array as () => EntityType[],
      default: () => []
    }
  },
  emits: ['update:selected', 'refreshClicked', 'deleteEntity', 'createEntity', 'duplicateEntity', 'exportEntity'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }     = useI18n()
    const { getIcon, getIconTooltip, getTitle, getDescriptions, isRestricted } = useEntityFormatter()
    const expansion = ref([] as string[])
    const filter    = ref('')
    const asList    = ref(false)
    const showRefreshDialog = ref(false)

    const visibleNodes = computed((): Entity[] => {
      if (!props.nodes) return []
      if (!asList.value) return props.nodes
      return props.nodes.filter(n => n.entityType !== EntityType.Category)
    })

    const expand = (entity: Entity|undefined): void => {
      if (!entity || !entity.id) return
      if (!expansion.value.includes(entity.id))
        expansion.value.push(entity.id)

      if (isRestricted(entity))
        expand(props.nodes?.find(n => n.id === entity.superPhenotype?.id))
      else
        (entity as Category).superCategories?.forEach(c =>
          expand(props.nodes?.find(n => n.id === c.id)))
    }

    watch(
      () => props.selected,
      (entity: Entity|undefined) => expand(entity)
    )

    const newNodes = computed((): boolean => {
      return props.nodes?.findIndex(n => !n.createdAt) !== -1
    })

    const removeEmptyNodes = (nodes: TreeNode[], types: EntityType[]): TreeNode[] => {
      const result = JSON.parse(JSON.stringify(nodes)) as TreeNode[]
      return result.map(n => {
        if (n.children) n.children = removeEmptyNodes(n.children, types)
        return n
      }).filter(n => !types.includes(n.entityType) || n.children && n.children.length !== 0)
    }

    const toTree = (list: Entity[], excludeTypeIfEmpty: EntityType[] = []): TreeNode[] => {
      const map: Map<string, TreeNode> = new Map<string, TreeNode>()
      const treeNodes: TreeNode[] = []

      list
        .filter(e => e.id)
        .forEach(e => map.set(e.id as string, { ...e, children: [] } as TreeNode))

      list
        .filter(e => e.id)
        .sort((a, b) => {
          if (a.entityType === EntityType.Category && b.entityType !== EntityType.Category) return -1
          if (a.entityType !== EntityType.Category && b.entityType === EntityType.Category) return 1
          return getTitle(a).localeCompare(getTitle(b))
        })
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

      return excludeTypeIfEmpty.length !== 0 ? removeEmptyNodes(treeNodes, excludeTypeIfEmpty) : treeNodes
    }

    return {
      t,
      expansion,
      asList,
      filter,
      EntityType,
      showRefreshDialog,
      getIcon,
      getIconTooltip,
      getTitle,
      getDescriptions,
      isRestricted,

      treeNodes: computed((): TreeNode[] => {
        return toTree(visibleNodes.value, props.excludeTypeIfEmpty)
      }),

      handleRefreshClick (): void {
        if (newNodes.value)
          showRefreshDialog.value = true
        else
          emit('refreshClicked')
      },

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

<style lang="sass">
.q-splitter__separator-area
  left: 0px !important
</style>
