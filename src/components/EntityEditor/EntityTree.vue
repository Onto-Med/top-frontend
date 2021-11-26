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
        ref="tree"
        v-model:expanded="expansion"
        :selected="selected ? selected.id : ''"
        :nodes="visibleNodes"
        :filter="filter"
        :filter-method="filterFn"
        :no-nodes-label="t('entityTree.noNodesLabel')"
        :no-results-label="t('entityTree.noResultsLabel')"
        node-key="id"
        children-key="subClasses"
        selected-color="primary"
        @update:selected="handleSelectedChange"
      >
        <template #default-header="{ node }">
          <div class="row items-center fit">
            <q-icon
              v-if="node.getIcon()"
              :name="node.getIcon()"
              :title="node.getIconTooltip()"
              :class="{ restriction: node.isRestriction() }"
              class="q-mr-sm"
            />
            <div :title="node.getDescriptions().join('\n')">
              {{ node.getTitle() }}
            </div>
            <entity-tree-context-menu :entity="node" @delete-entity-clicked="$emit('deleteEntity', $event)" @create-entity-clicked="handleCreateEntityClicked" />
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
import { QTree } from 'quasar'
import { FullEntity } from 'src/models/Entity'
import EntityTreeContextMenu from 'src/components/EntityEditor/EntityTreeContextMenu.vue'
import { EntityType } from '@onto-med/top-api'

export default defineComponent({
  name: 'EntityTree',
  components: { EntityTreeContextMenu },
  props: {
    nodes: Array as () => FullEntity[],
    selected: undefined as unknown as () => FullEntity,
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:selected', 'refreshClicked', 'deleteEntity', 'createEntity'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }     = useI18n()
    const tree      = ref(null as unknown as QTree)
    const expansion = ref([] as string[])
    const filter    = ref('')
    const asList    = ref(false)

    const visibleNodes = computed((): FullEntity[] => {
      if (!props.nodes) return []
      if (!asList.value) return props.nodes
      return props.nodes.flatMap(
        function loop (e: FullEntity): FullEntity[] {
          if (e.entityType === EntityType.Category && e.subClasses)
            return e.subClasses.flatMap(loop)
          else return [e]
        }
      )
    })

    const handleSelectedChange = (key: string): void => {
      if (!key)
        emit('update:selected', undefined)
      else if (tree.value)
        emit('update:selected', tree.value.getNodeByKey(key))
    }

    const filterFn = (node: FullEntity, filter: string): boolean =>
      node.getTitle().toLowerCase().includes(filter.toLowerCase())

    return {
      t, tree, visibleNodes, expansion, filter, asList, handleSelectedChange, filterFn, EntityType,
      handleCreateEntityClicked (t: EntityType, e?: string) {
        if (e) expansion.value.push(e)
        emit('createEntity', t, e)
      }
    }
  }
})
</script>
