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
            <q-btn class="gt-sm" dense flat icon="search" :title="t('search')" />
          </template>
        </entity-search-input>
      </q-toolbar-title>

      <q-separator vertical />
      <q-btn stretch flat icon="filter_alt" :title="t('filter')">
        <q-menu class="filter-menu">
          <q-list dense>
            <q-item>
              <enum-select
                v-model:selected="filterEntityType"
                i18n-prefix="entityType"
                :options="entityTypeOptions"
                class="fit"
                dense
              />
            </q-item>
            <q-item v-if="!isConceptRepository">
              <enum-select
                v-model:selected="filterItemType"
                i18n-prefix="itemType"
                :enum="ItemType"
                class="fit"
                dense
              />
            </q-item>
            <q-item v-if="!isConceptRepository">
              <enum-select
                v-model:selected="filterDataType"
                i18n-prefix="dataType"
                :enum="DataType"
                class="fit"
                dense
              />
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>

    <q-separator />

    <q-scroll-area class="col">
      <q-tree
        ref="tree"
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
            <div
              :title="getDescriptions(node).join('\n')"
              :class="{ 'text-italic': !node.createdAt }"
              class="col ellipsis"
            >
              {{ getTitle(node) }}
            </div>
            <q-badge v-show="!node.createdAt" color="accent" class="q-ml-sm">{{
              t('new')
            }}</q-badge>
            <entity-tree-context-menu
              v-if="showContextMenu"
              :allowed-entity-types="allowedEntityTypes"
              :createable="createable"
              :deletable="deletable"
              :duplicatable="duplicatable"
              :entity="node"
              :importable="importable"
              @delete-entity-clicked="handleDelete"
              @create-entity-clicked="handleCreateEntityClicked"
              @duplicate-entity-clicked="handleEntityDuplication"
            >
              <slot name="entity-context-menu" :entity="node" />
            </entity-tree-context-menu>
          </div>
        </template>
      </q-tree>
      <entity-tree-context-menu
        v-if="showContextMenu"
        :allowed-entity-types="allowedEntityTypes"
        :createable="createable"
        :importable="importable"
        @create-entity-clicked="handleCreateEntityClicked"
      />
      <slot v-else name="empty-context-menu" />
    </q-scroll-area>
    <q-inner-loading :showing="loading" :label="t('pleaseWait') + '...'" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import EntityTreeContextMenu from 'src/components/EntityEditor/EntityTreeContextMenu.vue'
import EnumSelect from 'src/components/EnumSelect.vue'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import {
  Category,
  Concept,
  DataType,
  Entity,
  EntityType,
  ItemType,
  SingleConcept,
} from '@onto-med/top-api'
import { useEntityStore } from 'src/stores/entity-store'
import { storeToRefs } from 'pinia'
import useNotify from 'src/mixins/useNotify'
import { QTree } from 'quasar'

const props = defineProps({
  nodes: Array as () => Entity[],
  selected: Object as () => Entity,
  loading: {
    type: Boolean,
    default: false,
  },
  showContextMenu: {
    type: Boolean,
    default: false,
  },
  excludeTypeIfEmpty: {
    type: Array as () => EntityType[],
    default: () => [],
  },
  allowedEntityTypes: {
    type: Array as () => EntityType[],
    default: () => Object.values(EntityType),
  },
  isConceptRepository: {
    type: Boolean,
    default: false,
  },
  createable: {
    type: Boolean,
    default: true,
  },
  deletable: {
    type: Boolean,
    default: true,
  },
  duplicatable: {
    type: Boolean,
    default: true,
  },
  importable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:selected', 'deleteEntity', 'createEntity', 'duplicateEntity'])

const { t } = useI18n()
const { getIcon, getIconTooltip, getTitle, getDescriptions, isPhenotype, isRestricted, isConcept } =
  useEntityFormatter()
const entityStore = useEntityStore()
const { renderError } = useNotify()
const { organisationId, repositoryId } = storeToRefs(entityStore)
const tree = ref<QTree>()
const expansion = ref([] as string[])
const filterEntityType = ref(undefined as EntityType | undefined)
const filterDataType = ref(undefined as DataType | undefined)
const filterItemType = ref(undefined as ItemType | undefined)

const entityTypeOptions = computed((): EntityType[] => {
  if (props.isConceptRepository) return [EntityType.SingleConcept, EntityType.CompositeConcept]
  return [EntityType.SinglePhenotype, EntityType.CompositePhenotype]
})

const visibleNodes = computed((): Entity[] => {
  if (!props.nodes) return []
  return props.nodes.filter((n) => {
    if (!props.allowedEntityTypes.includes(n.entityType)) return false
    if (
      filterEntityType.value &&
      entityTypeOptions.value.includes(n.entityType) &&
      n.entityType !== filterEntityType.value
    )
      return false
    if (filterDataType.value) {
      if (isPhenotype(n) && n.dataType !== filterDataType.value) return false
    }
    if (filterItemType.value) {
      if (isPhenotype(n) && n.itemType !== filterItemType.value) return false
    }
    return true
  })
})

const treeNodes = computed((): TreeNode[] => {
  return toTree(visibleNodes.value, props.excludeTypeIfEmpty)
})

watch(
  () => props.selected,
  (entity: Entity | undefined) => expand(entity),
)

function expand(entity: Entity | undefined): void {
  if (!entity || !entity.id || !tree.value?.getNodeByKey(entity.id)) return
  if (!tree.value?.isExpanded(entity.id)) tree.value?.setExpanded(entity.id, true)

  if (isRestricted(entity)) expand(props.nodes?.find((n) => n.id === entity.superPhenotype?.id))
  else if (props.isConceptRepository)
    (entity as Concept).superConcepts?.forEach((c) =>
      expand(props.nodes?.find((n) => n.id === c.id)),
    )
  else
    (entity as Category).superCategories?.forEach((c) =>
      expand(props.nodes?.find((n) => n.id === c.id)),
    )
}

function removeEmptyNodes(nodes: TreeNode[], types: EntityType[]): TreeNode[] {
  const result = JSON.parse(JSON.stringify(nodes)) as TreeNode[]
  return result
    .map((n) => {
      if (n.children) n.children = removeEmptyNodes(n.children, types)
      return n
    })
    .filter((n) => !types.includes(n.entityType) || (n.children && n.children.length !== 0))
}

function toTree(list: Entity[], excludeTypeIfEmpty: EntityType[] = []): TreeNode[] {
  const map: Map<string, TreeNode> = new Map<string, TreeNode>()
  const treeNodes: TreeNode[] = []

  list
    .filter((e) => e.id)
    .forEach((e) => map.set(e.id as string, { ...e, children: [], lazy: true } as TreeNode))

  list
    .filter((e) => e.id)
    .sort((a, b) => {
      if (
        [EntityType.Category, EntityType.SingleConcept].includes(a.entityType) &&
        ![EntityType.Category, EntityType.SingleConcept].includes(b.entityType)
      )
        return -1
      if (
        ![EntityType.Category, EntityType.SingleConcept].includes(a.entityType) &&
        [EntityType.Category, EntityType.SingleConcept].includes(b.entityType)
      )
        return 1
      return getTitle(a).localeCompare(getTitle(b))
    })
    .forEach((e) => {
      let root = true

      if (
        !e.version ||
        ((isPhenotype(e) ||
          ((e as Category).subCategories && (e as Category).subCategories?.length === 0)) &&
          (e as Category).phenotypes &&
          (e as Category).phenotypes?.length === 0) ||
        (isConcept(e) &&
          (e.entityType === EntityType.CompositeConcept ||
            ((e as SingleConcept).subConcepts && (e as SingleConcept).subConcepts?.length === 0)))
      )
        (map.get(e.id as string) as TreeNode).lazy = false
      ;(e as Category).superCategories?.forEach((c) => {
        if (c.id) {
          root = false
          const parent = map.get(c.id)
          if (parent) parent.children.push(map.get(e.id as string) as TreeNode)
        }
      })
      ;(e as Concept).superConcepts?.forEach((c) => {
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

  return excludeTypeIfEmpty.length !== 0
    ? removeEmptyNodes(treeNodes, excludeTypeIfEmpty)
    : treeNodes
}

function handleEntityDuplication(entity: Entity) {
  emit('duplicateEntity', entity)
}

function handleSelectedChange(key: string): void {
  if (!key || !props.nodes) {
    emit('update:selected', undefined)
  } else {
    const node = props.nodes.find((n) => n.id === key)
    emit('update:selected', node)
  }
}

function handleCreateEntityClicked(t: EntityType, e?: string) {
  if (e) expansion.value.push(e)
  emit('createEntity', t, e)
}

async function onLazyLoad({ node, done, fail }: LazyLoadDetails) {
  await entityStore
    .loadChildren(node)
    .then(() => done([]))
    .catch((e: Error) => {
      renderError(e)
      fail()
    })
}

async function handleSearch(entity?: Entity) {
  if (!entity) return
  await entityStore.loadEntity(entity.id).then((e) => {
    emit('update:selected', e)
    void nextTick(() => expand(entity))
  })
}

async function handleDelete(entity: Entity, cascade?: boolean) {
  if (!cascade) {
    await entityStore.loadChildren(entity).then(() => emit('deleteEntity', entity, cascade))
  } else {
    emit('deleteEntity', entity, cascade)
  }
}

interface TreeNode extends Entity {
  children: TreeNode[]
  lazy?: boolean
}

interface LazyLoadDetails {
  node: TreeNode
  done: (children: TreeNode[]) => void
  fail: () => void
}
</script>

<style lang="scss">
.q-splitter__separator-area {
  left: 0px !important;
}
.filter-menu {
  min-width: 300px;
  max-width: 300px;
}
</style>
