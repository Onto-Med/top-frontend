<template>
  <q-page>
    <q-splitter v-model="splitterModel" style="min-height: inherit; height: 100px">
      <template #before>
        <entity-tree
          v-model:selected="selected"
          :nodes="entities"
          :loading="treeLoading"
          class="column fit"
          @refreshClicked="reloadEntities"
          @deleteEntity="handleEntityDeletion"
          @createEntity="handleEntityCreation"
        />
      </template>

      <template #after>
        <div class="column fit">
          <q-tabs
            :model-value="selected ? selected.id : undefined"
            dense
            no-caps
            align="left"
            class="bg-primary text-white shadow-2 entity-editor-tabs-bar"
            @update:model-value="selectTabByKey($event)"
          >
            <q-tab v-for="tab in tabs" :key="tab.id" :name="tab.id">
              <span class="no-wrap">
                <q-icon :name="tab.getIcon()" :class="{ restriction: tab.isRestriction() }" />
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
            <q-menu context-menu>
              <q-list>
                <q-item v-close-popup dense clickable @click="closeTab(tabs)">
                  <q-item-section v-t="'closeAll'" />
                </q-item>
              </q-list>
            </q-menu>
          </q-tabs>
          <q-tab-panels :model-value="selected ? selected.id : undefined" keep-alive class="col entity-editor-tab">
            <q-tab-panel v-for="(tab, index) in tabs" :key="tab.id" :name="tab.id" class="q-pa-none">
              <entity-editor
                v-if="tabs[index]"
                :entity="tabs[index]"
                :repository-id="repositoryId"
                :organisation-id="organisationId"
                @update:entity="handleEntityUpdate"
                @entity-clicked="selectTabByKey($event)"
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
import { defineComponent, ref, watch, onMounted, Ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import useAlert from 'src/mixins/useAlert'
import { useI18n } from 'vue-i18n'
import { FullEntity } from 'src/models/Entity'
import EntityEditor from 'src/components/EntityEditor/EntityEditor.vue'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import { Entity, EntityType } from '@onto-med/top-api'
import { EntityApiKey } from 'src/boot/axios'

export default defineComponent({
  name: 'Editor',
  components: { EntityEditor, EntityTree },
  props: {
    organisationId: {
      type: String,
      required: true
    },
    repositoryId: {
      type: String,
      required: true
    },
    entityId: String
  },
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }         = useI18n()
    const router        = useRouter()
    const { alert }     = useAlert()
    const entityApi     = inject(EntityApiKey)
    const showJson      = ref(false)
    const splitterModel = ref(25)
    const entities      = ref<FullEntity[]>([])
    const selected      = ref<FullEntity|undefined>(undefined)
    const tabs          = ref([] as FullEntity[])
    const treeLoading   = ref(false)

    const reloadEntities = async () => {
      if (!entityApi) return
      treeLoading.value = true
      await entityApi.getEntities(props.organisationId, props.repositoryId)
        .then(r => entities.value = r.data.map((e) => new FullEntity(e)))
        .finally(() => treeLoading.value = false)
    }
    const selectTabByKey = (key: string): void => {
      const index = tabs.value.map(t => t.id).indexOf(key)
      if (index !== -1)
        selected.value = tabs.value[index]
      else {
        const selection = getEntityById(key)
        selected.value = selection ? selection : undefined
      }
    }
    const closeTab = (tab: FullEntity|FullEntity[]): void => {
      if (tab instanceof FullEntity) {
        const index = tabs.value.map(t => t.id).indexOf(tab.id)
        tabs.value.splice(index, 1)
        if (selected.value && selected.value.id === tab.id)
          selected.value = tabs.value[tabs.value.length - 1] || undefined
      } else {
        tabs.value = []
        selected.value = undefined
      }
    }

    const getEntityById = (id: string|number|undefined): FullEntity|null => {
      const find = (result: unknown, node: unknown): unknown => {
        if (result || !node) {
          return result
        }
        if (Array.isArray(node) === true) {
          return [].reduce.call(Object(node), find, result)
        }
        if ((node as Record<string, unknown>).id === id) {
          return node
        }
        if ((node as Record<string, unknown>).subClasses) {
          return find(null, (node as Record<string, unknown>).subClasses)
        }
        return result
      }

      const result = find(null, entities.value)
      return result ? result as FullEntity : null
    }

    watch(
      selected as Ref<FullEntity|undefined>,
      (entity: FullEntity|undefined) => {
        let id = undefined
        if (entity) {
          id = entity.id
          if (!tabs.value.map(t => t.id).includes(entity.id))
            tabs.value.push(entity)
        }
        void router.push({
          name: 'editor',
          params: { organisationId: props.organisationId, repositoryId: props.repositoryId, entityId: id }
        })
      }
    )

    watch(
      () => props.entityId,
      (newVal) => {
        if (newVal) {
          if (!selected.value || newVal !== selected.value.id)
            selected.value = getEntityById(newVal) || undefined
        } else {
          selected.value = undefined
        }
      }
    )

    onMounted(async () => {
      await reloadEntities().then(() => {
        if (props.entityId)
          selected.value = getEntityById(props.entityId) || undefined
      })
    })

    return {
      t, showJson, splitterModel, entities, selected, tabs, treeLoading,
      reloadEntities, selectTabByKey, closeTab, alert,

      handleEntityDeletion (entityId: string): void {
        if (!entityId || !entityApi) return
        treeLoading.value = true

        entityApi
          .deleteEntityById(props.organisationId, props.repositoryId, entityId)
          .then(reloadEntities)
          .catch((e: Error) => alert(e.message))
          .finally(() => treeLoading.value = false)
      },
      handleEntityUpdate (entity: Entity) {
        if (!entity || !entityApi) return

        if (!entity.createdAt) {
          entityApi.createEntity(props.organisationId, props.repositoryId, entity)
            .then(response => tabs.value.find(t => t.id === response.data.id)?.apply(new FullEntity(response.data)))
            .catch((e: Error) => alert(e.message))
        } else {
          entityApi.updateEntityById(props.organisationId, props.repositoryId, entity.id as string, entity)
            .then(response => tabs.value.find(t => t.id === response.data.id)?.apply(new FullEntity(response.data)))
            .catch((e: Error) => alert(e.message))
        }
      },
      handleEntityCreation (entityType: EntityType, superClassId: string): void {
        const superClass = getEntityById(superClassId)
        const entity = new FullEntity({
          entityType: entityType,
          dataType: superClass?.dataType
        })
        if (superClass)
          superClass.subClasses?.push(entity)
        else
          entities.value.push(entity)
        selectTabByKey(entity.id)
      }
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