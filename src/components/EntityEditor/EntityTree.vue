<template>
  <div>
    <q-toolbar class="q-px-none q-gutter-y-sm">
      <q-toolbar-title class="q-px-none">
        <entity-search-input
          v-if="repositoryId"
          :label="t('searchThing', { thing: t('entity') }) + '...'"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          dense
          filled
          square
          clear-on-select
          @entity-selected="handleSearch"
        >
          <template #append>
            <q-btn dense flat icon="search" :title="t('search')" />
          </template>
        </entity-search-input>
      </q-toolbar-title>

      <q-separator vertical />
      <q-btn stretch flat icon="filter_alt" :title="t('filter')">
        <q-menu class="filter-menu">
          <q-list dense>
            <q-item>
              <entity-type-select v-model="filterEntityType" :options="entityTypeOptions" class="fit" dense />
            </q-item>
            <q-item>
              <item-type-select v-model="filterItemType" class="fit" dense />
            </q-item>
            <q-item>
              <data-type-select v-model="filterDataType" class="fit" dense />
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>

    <q-separator />

    <q-scroll-area class="col">
      <q-tree
        v-model:expanded="expansion"
        :selected="selected ? selected.id : ''"
        :nodes="treeNodes"
        :no-nodes-label="t('entityTree.noNodesLabel')"
        :no-results-label="t('entityTree.noResultsLabel')"
        no-selection-unset
        node-key="id"
        selected-color="primary"
        no-transition
        @update:selected="handleSelectedChange"
        @lazy-load="onLazyLoad"
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
              :allowed-entity-types="allowedEntityTypes"
              @delete-entity-clicked="$emit('deleteEntity', $event)"
              @create-entity-clicked="handleCreateEntityClicked"
              @duplicate-entity-clicked="$emit('duplicateEntity', $event)"
              @export-clicked="$emit('exportEntity', $event)"
            />
            <slot v-else name="entity-context-menu" :entity="node" />
          </div>
        </template>
      </q-tree>
      <entity-tree-context-menu
        v-if="showContextMenu"
        :allowed-entity-types="allowedEntityTypes"
        @create-entity-clicked="handleCreateEntityClicked"
      />
      <slot v-else name="empty-context-menu" />
    </q-scroll-area>
    <q-inner-loading
      :showing="loading"
      :label="t('pleaseWait') + '...'"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import EntityTreeContextMenu from 'src/components/EntityEditor/EntityTreeContextMenu.vue'
import EntityTypeSelect from 'src/components/EntityEditor/EntityTypeSelect.vue'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import DataTypeSelect from 'src/components/EntityEditor/DataTypeSelect.vue'
import ItemTypeSelect from 'src/components/EntityEditor/ItemTypeSelect.vue'
import { Category, EntityType, Entity, DataType, ItemType } from '@onto-med/top-api'
import { useEntity } from 'src/pinia/entity'
import { storeToRefs } from 'pinia'

export default defineComponent({
  name: 'EntityTree',
  components: {
    DataTypeSelect,
    ItemTypeSelect,
    EntitySearchInput,
    EntityTreeContextMenu,
    EntityTypeSelect
  },
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
    },
    allowedEntityTypes: {
      type: Array as () => EntityType[],
      default: () => Object.values(EntityType)
    }
  },
  emits: ['update:selected', 'deleteEntity', 'createEntity', 'duplicateEntity', 'exportEntity'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const { getIcon, getIconTooltip, getTitle, getDescriptions, isPhenotype, isRestricted } = useEntityFormatter()
    const entityStore = useEntity()
    const { organisationId, repositoryId } = storeToRefs(entityStore)
    const expansion         = ref([] as string[])
    const filterEntityType  = ref(undefined as EntityType|undefined)
    const filterDataType    = ref(undefined as DataType|undefined)
    const filterItemType    = ref(undefined as ItemType|undefined)
    const entityTypeOptions = [EntityType.SinglePhenotype, EntityType.CompositePhenotype]

    const visibleNodes = computed((): Entity[] => {
      if (!props.nodes) return []
      if (!filterEntityType.value && !filterDataType.value && !filterItemType.value) return props.nodes
      return props.nodes.filter(n => {
        if (!props.allowedEntityTypes.includes(n.entityType)) return false
        if (filterEntityType.value && entityTypeOptions.includes(n.entityType) && n.entityType !== filterEntityType.value) return false
        if (filterDataType.value) {
          if (isPhenotype(n) && n.dataType !== filterDataType.value) return false
        }
        if (filterItemType.value) {
          if (isPhenotype(n) && n.itemType !== filterItemType.value) return false
        }
        return true
      })
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
        .forEach(e => map.set(e.id as string, { ...e, children: [], lazy: true } as TreeNode))

      list
        .filter(e => e.id)
        .sort((a, b) => {
          if (a.entityType === EntityType.Category && b.entityType !== EntityType.Category) return -1
          if (a.entityType !== EntityType.Category && b.entityType === EntityType.Category) return 1
          return getTitle(a).localeCompare(getTitle(b))
        })
        .forEach(e => {
          let root = true;

            if (
              !e.version
              || (
                (isPhenotype(e) || (e as Category).subCategories && (e as Category).subCategories?.length === 0)
                && (e as Category).phenotypes && (e as Category).phenotypes?.length === 0
              )
            ) (map.get(e.id as string) as TreeNode).lazy = false;

          (e as Category).superCategories?.forEach(c => {
            if (c.id) {
              root = false
              const parent = map.get(c.id)
              if (parent) parent.children.push(map.get(e.id as string) as TreeNode)
            }
          })
          if (isRestricted(e)) {
            root = false
            const node = map.get(e.id as string)
            if (node) {
              node.lazy = false
              if (e.superPhenotype && e.superPhenotype.id) {
                const parent = map.get(e.superPhenotype.id)
                if (parent) parent.children.push(node)
              }
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
      filterDataType,
      filterItemType,
      filterEntityType,
      EntityType,
      entityTypeOptions,
      repositoryId,
      organisationId,
      getIcon,
      getIconTooltip,
      getTitle,
      getDescriptions,
      isRestricted,

      treeNodes: computed((): TreeNode[] => {
        return toTree(visibleNodes.value, props.excludeTypeIfEmpty)
      }),

      handleSelectedChange (key: string): void {
        if (!key || !props.nodes) {
          emit('update:selected', undefined)
        } else {
          const node = props.nodes.find(n => n.id === key)
          emit('update:selected', node)
        }
      },

      handleCreateEntityClicked (t: EntityType, e?: string) {
        if (e) expansion.value.push(e)
        emit('createEntity', t, e)
      },

      async onLazyLoad ({ node, done, fail }: LazyLoadDetails) {
        await entityStore.loadChildren(node)
          .then(() => done([]))
          .catch((e: Error) => {
            alert(e.message)
            fail()
          })
      },

      async handleSearch (entity?: Entity) {
        if (!entity) return
        await entityStore.loadEntity(entity.id)
          .then((e) => {
            emit('update:selected', e)
            void nextTick(() => expand(entity))
          })
      }
    }
  }
})

interface TreeNode extends Entity {
  children: TreeNode[],
  lazy?: boolean
}

interface LazyLoadDetails {
  node: TreeNode,
  done: (children: TreeNode[]) => void,
  fail: () => void
}
</script>

<style lang="sass">
.q-splitter__separator-area
  left: 0px !important
.filter-menu
  min-width: 300px
  max-width: 300px
</style>
