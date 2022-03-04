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
                <q-icon :name="getIcon(tab)" :class="{ restriction: isRestricted(tab) }" />
                {{ getTitle(tab) }}
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
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import useAlert from 'src/mixins/useAlert'
import { useI18n } from 'vue-i18n'
import EntityEditor from 'src/components/EntityEditor/EntityEditor.vue'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import { Entity, EntityType, Phenotype, Category } from '@onto-med/top-api'
import { EntityApiKey } from 'src/boot/axios'
import { AxiosResponse } from 'axios'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { v4 as uuidv4 } from 'uuid'

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
    const { getIcon, getTitle, isRestricted, isPhenotype } = useEntityFormatter()
    const router        = useRouter()
    const entityStore   = useEntity()
    const { alert }     = useAlert()
    const entityApi     = inject(EntityApiKey)
    const showJson      = ref(false)
    const splitterModel = ref(25)
    const { entities }  = storeToRefs(entityStore)
    const selected      = ref<Entity|undefined>(undefined)
    const tabs          = ref([] as Entity[])
    const treeLoading   = ref(false)

    const reloadEntities = async () => {
      treeLoading.value = true
      await entityStore.reloadEntities(props.organisationId, props.repositoryId)
        .catch((e: Error) => alert(e.message))
        .finally(() => treeLoading.value = false)
    }
    const selectTabByKey = (key: string|undefined): void => {
      const index = tabs.value.map(t => t.id).indexOf(key)
      if (index !== -1)
        selected.value = tabs.value[index]
      else {
        const selection = getEntityById(key)
        selected.value = selection ? selection : undefined
      }
    }
    const closeTab = (tab: Entity|Entity[]): void => {
      if (Array.isArray(tab)) {
        const id = (tab as unknown as Entity).id
        const index = tabs.value.map(t => t.id).indexOf(id)
        tabs.value.splice(index, 1)
        if (selected.value && selected.value.id === id)
          selected.value = tabs.value[tabs.value.length - 1] || undefined
      } else {
        tabs.value = []
        selected.value = undefined
      }
    }

    const getEntityById = (id: string|number|undefined): Entity|null => {
      const find = (result: unknown, node: unknown): unknown => {
        if (result || !node) return result
        if (Array.isArray(node) === true)
          return [].reduce.call(Object(node), find, result)
        if ((node as Record<string, unknown>).id === id)
          return node
        if ((node as Record<string, unknown>).subCategories)
          result = find(null, (node as Record<string, unknown>).subCategories)
        if (result) return result
        if ((node as Record<string, unknown>).phenotypes)
          return find(null, (node as Record<string, unknown>).phenotypes)
        return result
      }

      const result = find(null, entities.value)
      return result ? result as Entity : null
    }

    watch(
      selected as Ref<Entity|undefined>,
      (entity: Entity|undefined) => {
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
      isRestricted, getTitle, getIcon,
      reloadEntities, selectTabByKey, closeTab, alert,

      handleEntityDeletion (entity: Entity): void {
        if (!entity || !entityApi) return
        treeLoading.value = true

        entityStore.deleteEntity(entity)
          .then(() => {
            alert(t('thingDeleted', { thing: t('entity') }), 'positive')
          })
          .catch((e: Error) => alert(t(e.message)))
          .finally(() => treeLoading.value = false)
      },
      handleEntityUpdate (entity: Entity) {
        if (!entity || !entityApi) return

        let promise: Promise<AxiosResponse<Entity>>
        if (!entity.createdAt) {
          promise = entityApi.createEntity(props.organisationId, props.repositoryId, entity)
        } else {
          promise = entityApi.updateEntityById(props.organisationId, props.repositoryId, entity.id as string, entity)
        }
        promise
          .then(response => {
            alert(t('thingSaved', { thing: t(entity.entityType) }), 'positive')
            const index = tabs.value.findIndex(t => t.id === response.data.id)
            if (index != -1)
              tabs.value[index] = response.data
          })
          .catch((e: Error) => alert(e.message))
      },
      handleEntityCreation (entityType: EntityType, superClassId: string): void {
        const entity = { id: (uuidv4 as () => string)(), entityType: entityType } as Entity

        const superClass = getEntityById(superClassId)
        if (superClass && superClass.entityType === EntityType.SinglePhenotype)
          (entity as Phenotype).dataType = (superClass as Phenotype).dataType

        if (superClass) {
          const short = { id: superClass.id, entityType: superClass.entityType } as Entity
          if (isPhenotype(superClass)) {
            (entity as Phenotype).superPhenotype = short
          } else {
            (entity as Category).superCategories = [ short ]
          }
          if (isPhenotype(entity)) {
            if (!(superClass as Category).phenotypes)
              (superClass as Category).phenotypes = [] as Entity[]
            (superClass as Category).phenotypes?.push(entity)
          } else {
            if (!(superClass as Category).subCategories)
              (superClass as Category).subCategories = [] as Entity[]
            (superClass as Category).subCategories?.push(entity)
          }
        } else {
          entityStore.addEntity(entity)
        }
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