<template>
  <q-page>
    <q-splitter v-model="splitterModel" style="min-height: inherit; height: 100px">
      <template #before>
        <entity-tree
          v-model:selected="selected"
          :nodes="entities"
          :loading="treeLoading"
          class="column fit"
          @refresh-clicked="reloadEntities"
          @delete-entity="deleteEntity"
          @create-entity="handleEntityCreation"
        />
      </template>

      <template #after>
        <div class="column fit">
          <q-tabs
            :model-value="selected ? selected.id : undefined"
            dense
            no-caps
            outside-arrows
            align="left"
            class="bg-primary text-white shadow-2 entity-editor-tabs-bar"
            @update:model-value="selectTabByKey($event)"
          >
            <q-tab v-for="tab in tabs" :key="tab.entity.id" :name="tab.entity.id">
              <span class="no-wrap">
                <q-icon :name="getIcon(tab.entity)" :class="{ restriction: isRestricted(tab.entity) }" />
                {{ getTitle(tab.entity) }}
                <span v-show="tab.dirty" class="text-accent" :title="t('unsavedChanges')">*</span>
                <q-btn
                  flat
                  dense
                  rounded
                  icon="close"
                  size="xs"
                  @click.prevent="closeTab(tab.entity)"
                />
              </span>
              <q-menu context-menu>
                <q-list>
                  <q-item v-close-popup dense clickable @click="closeTab(undefined)">
                    <q-item-section v-t="'closeAll'" />
                  </q-item>
                  <q-item v-close-popup dense clickable @click="closeOtherTabs(tab)">
                    <q-item-section v-t="'closeOthers'" />
                  </q-item>
                </q-list>
              </q-menu>
            </q-tab>
          </q-tabs>
          <q-tab-panels :model-value="selected ? selected.id : undefined" keep-alive class="col entity-editor-tab">
            <q-tab-panel v-for="(tab, index) in tabs" :key="tab.entity.id" :name="tab.entity.id" class="q-pa-none">
              <entity-editor
                v-if="tabs[index]"
                :version="tab.selectedVersion"
                :entity="tab.entity"
                :repository-id="repositoryId"
                :organisation-id="organisationId"
                @change="tab.dirty = $event"
                @update:entity="saveEntity"
                @entity-clicked="selectTabByKey($event)"
                @reload-failed="closeTab(tab.entity); alert($event.message)"
                @restore-version="tab.selectedVersion = $event.version; restoreVersion($event)"
                @change-version="tab.selectedVersion = $event"
              />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </template>
    </q-splitter>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, Ref, inject, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import useAlert from 'src/mixins/useAlert'
import { useI18n } from 'vue-i18n'
import EntityEditor from 'src/components/EntityEditor/EntityEditor.vue'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import { Entity, EntityType, LocalisableText, Phenotype } from '@onto-med/top-api'
import { EntityApiKey } from 'src/boot/axios'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

export default defineComponent({
  name: 'Editor',
  components: { EntityEditor, EntityTree },
  props: {
    entityId: String,
    version: Number
  },
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, locale }         = useI18n()
    const { getIcon, getTitle, isRestricted, isPhenotype } = useEntityFormatter()
    const router        = useRouter()
    const entityStore   = useEntity()
    const { alert }     = useAlert()
    const entityApi     = inject(EntityApiKey)
    const showJson      = ref(false)
    const splitterModel = ref(25)
    const { entities }  = storeToRefs(entityStore)
    const selected      = ref<Entity|undefined>(undefined)
    const tabs          = ref([] as EditorTab[])
    const treeLoading   = ref(false)

    const reloadEntities = async () => {
      treeLoading.value = true
      await entityStore.reloadEntities()
        .then(() => tabs.value = tabs.value.filter(t => entities.value.findIndex(e => e.id === t.entity.id) !== -1))
        .catch((e: Error) => alert(e.message))
        .finally(() => treeLoading.value = false)
    }
    void entityStore.reloadOperators()
    const selectTabByKey = (key: string|undefined): void => {
      const index = tabs.value.map(t => t.entity.id).indexOf(key)
      if (index !== -1)
        selected.value = tabs.value[index].entity
      else {
        const selection = entityStore.getEntity(key)
        selected.value = selection ? selection : undefined
      }
    }
    const closeTab = (entity: Entity|undefined): void => {
      if (entity === undefined) {
        tabs.value = []
        selected.value = undefined
      } else {
        const id = entity.id
        const index = tabs.value.map(t => t.entity.id).indexOf(id)
        tabs.value.splice(index, 1)
        if (selected.value && selected.value.id === id) {
          if (tabs.value[tabs.value.length - 1])
            selected.value = tabs.value[tabs.value.length - 1].entity || undefined
          else selected.value = undefined
        }
      }
    }

    watch(
      selected as Ref<Entity|undefined>,
      (entity: Entity|undefined) => {
        let id = undefined
        if (entity) {
          id = entity.id
          if (!tabs.value.map(t => t.entity.id).includes(entity.id)) {
            selected.value = undefined
            tabs.value.push({ selectedVersion: entity.version, entity: entity, dirty: false })
            void nextTick(() => selected.value = entity)
          }
        }
        void router.push({
          name: 'editor',
          params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repositoryId, entityId: id }
        })
      }
    )

    watch(
      () => props.entityId,
      (newVal) => {
        if (newVal) {
          if (!selected.value || newVal !== selected.value.id)
            selected.value = entityStore.getEntity(newVal)
        } else {
          selected.value = undefined
        }
      }
    )

    onMounted(async () => {
      await reloadEntities().then(() => {
        if (!props.entityId) return
        const entity = entityStore.getEntity(props.entityId)
        if (entity) {
          tabs.value = [ { selectedVersion: props.version, entity: entity, dirty: false }]
          selected.value = entity
        }
      })
    })

    return {
      t, showJson, splitterModel, entities, selected, tabs, treeLoading,
      isRestricted, getTitle, getIcon,
      reloadEntities, selectTabByKey, closeTab, alert,
      organisationId: entityStore.organisationId,
      repositoryId: entityStore.repositoryId,

      deleteEntity (entity: Entity): void {
        if (!entity || !entityApi) return
        treeLoading.value = true

        entityStore.deleteEntity(entity)
          .then(() => {
            alert(t('thingDeleted', { thing: t('entity') }), 'positive')
            closeTab(entity)
            if (isPhenotype(entity))
              tabs.value
                .filter(t => (t.entity as Phenotype).superPhenotype?.id === entity.id)
                .forEach(t => closeTab(t.entity))
          })
          .catch((e: Error) => alert(t(e.message)))
          .finally(() => treeLoading.value = false)
      },

      saveEntity (entity: Entity) {
        entityStore.saveEntity(entity)
          .then((r) => {
            alert(t('thingSaved', { thing: t(entity.entityType) }), 'positive')
            const index = tabs.value.findIndex(t => t.entity.id === r.id)
            if (index != -1) tabs.value[index].entity = r
          })
          .catch((e: Error) => alert(t(e.message)))
      },

      restoreVersion (entity: Entity) {
        entityStore.restoreVersion(entity)
          .then(() => {
            alert(t('thingRestored', { thing: t('version') }), 'positive')
            const index = tabs.value.findIndex(t => t.entity.id == entity.id)
            if (index !== -1) Object.assign(tabs.value[index].entity, entity)
          })
          .catch((e: Error) => alert(e.message))
      },

      handleEntityCreation (entityType: EntityType, superClassId: string): void {
        const entity = entityStore.addEntity(entityType, superClassId)
        entity.titles = [ { lang: locale.value } as LocalisableText ]
        if (entity) selectTabByKey(entity.id)
      },

      closeOtherTabs (tab: EditorTab): void {
        tabs.value = [tab]
        selected.value = tab.entity
      }
    }
  }
})

interface EditorTab {
  entity: Entity,
  selectedVersion?: number,
  dirty: boolean
}
</script>

<style lang="sass" scoped>
.entity-editor-tabs-bar
  width: 100%
  height: 36px
.entity-editor-tab
  height: 100%
  width: 100%
</style>