<template>
  <q-page>
    <q-splitter v-model="splitterModel" style="min-height: inherit; height: 100px">
      <template #before>
        <div class="column fit">
          <div class="row items-center q-pl-sm bg-primary text-white shadow-2 entity-editor-tabs-bar">
            <q-icon name="tab" class="q-mr-sm q-tree__icon" />
            <div v-if="repository" class="col ellipsis" :title="repository.name || repository.id">
              {{ repository.name || repository.id }}
            </div>

            <div v-if="isPhenotypeRepository" class="gt-xs">
              <q-btn
                dense
                flat
                no-caps
                icon="manage_search"
                :label="t('buildQuery')"
                :to="{ name: 'queryBuilder' }"
              />
            </div>
          </div>

          <entity-tree
            v-model:selected="selected"
            :nodes="entities"
            :loading="treeLoading"
            :allowed-entity-types="allowedEntityTypes"
            class="col column"
            show-context-menu
            @refresh-clicked="reloadEntities"
            @delete-entity="deleteEntity"
            @create-entity="handleEntityCreation"
            @duplicate-entity="handleEntityDuplication"
            @export-entity="handleEntityExport"
            @dblclick="preserve()"
          />
        </div>
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
            <q-tab v-for="tab in tabs" :key="tab.entity.id" :name="tab.entity.id" @dblclick="tab.preserve = true">
              <span class="no-wrap" :class="{ 'text-italic': !tab.preserve }">
                <q-icon :name="getIcon(tab.entity)" :class="{ restriction: isRestricted(tab.entity) }" />
                {{ getTitle(tab.entity, true) }}
                <span v-show="tab.dirty" class="text-accent" :title="t('unsavedChanges')">*</span>
                <q-btn
                  flat
                  dense
                  rounded
                  icon="close"
                  size="xs"
                  @click.stop="closeTab(tab.entity)"
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
                  <q-item v-close-popup dense clickable @click="closeSavedTabs()">
                    <q-item-section v-t="'closeSaved'" />
                  </q-item>
                </q-list>
              </q-menu>
            </q-tab>
          </q-tabs>
          <q-tab-panels v-show="tabs.length !== 0" :model-value="selected ? selected.id : undefined" keep-alive class="col entity-editor-tab">
            <q-tab-panel v-for="tab in tabs" :key="tab.entity.id" :name="tab.entity.id" class="q-pa-none">
              <entity-tab
                v-if="repository"
                :version="tab.selectedVersion"
                :entity="tab.entity"
                :repository-id="repository.id"
                :organisation-id="organisationId"
                :hotkeys-enabled="selected?.id === tab.entity.id"
                @change="tab.dirty = $event; tab.preserve = tab.preserve || $event"
                @update:entity="saveEntity"
                @entity-clicked="selectTabByKey($event)"
                @reload-failed="closeTab(tab.entity); alert($event.message)"
                @restore-version="tab.selectedVersion = $event.version; restoreVersion($event)"
                @change-version="tab.selectedVersion = $event"
              />
            </q-tab-panel>
          </q-tab-panels>
          <div v-show="tabs.length === 0" class="col column entity-editor-tab text-grey gt-xs">
            <div class="col-3 row q-pa-md">
              <q-icon name="arrow_back_ios" size="xl" />
              <p>
                {{ t('entityEditor.emptyTab.tree.selection') }}
                <br>
                {{ t('entityEditor.emptyTab.tree.actions') }}
              </p>
            </div>

            <div class="col-6 column justify-center items-center q-gutter-md">
              <q-icon name="hub" size="xl" />
              <p v-t="'entityEditor.emptyTab.tab.description'" />
            </div>
          </div>
        </div>
      </template>
    </q-splitter>

    <export-dialog v-model:show="showExportDialog" :entity="exportEntity" />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch, onMounted, inject, nextTick, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import useAlert from 'src/mixins/useAlert'
import { useI18n } from 'vue-i18n'
import EntityTab from 'src/components/EntityEditor/EntityTab.vue'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import ExportDialog from 'src/components/EntityEditor/ExportDialog.vue'
import { Entity, EntityType, LocalisableText, Phenotype } from '@onto-med/top-api'
import { EntityApiKey } from 'src/boot/axios'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { RepositoryType } from '@onto-med/top-api'

export default defineComponent({
  name: 'Editor',
  components: { EntityTab, EntityTree, ExportDialog },
  props: {
    entityId: String,
    version: Number,
    hotkeysEnabled: {
      type: Boolean,
      default: true
    }
  },
  setup (props) {
    const { t, locale } = useI18n()
    const { getIcon, getTitle, isRestricted, isPhenotype } = useEntityFormatter()
    const router           = useRouter()
    const entityStore      = useEntity()
    const { alert }        = useAlert()
    const entityApi        = inject(EntityApiKey)
    const showJson         = ref(false)
    const splitterModel    = ref(25)
    const showExportDialog = ref(false)
    const exportEntity     = ref(undefined as Entity|undefined)
    const { entities, repository, organisationId } = storeToRefs(entityStore)
    const selected    = ref<Entity|undefined>(undefined)
    const tabs        = ref([] as EditorTab[])
    const treeLoading = ref(false)

    const reloadEntities = async () => {
      treeLoading.value = true
      await entityStore.reloadEntities()
        .then(() => tabs.value = tabs.value.filter(t => entities.value.findIndex(e => e.id === t.entity.id) !== -1))
        .catch((e: Error) => alert(e.message))
        .finally(() => treeLoading.value = false)
    }
    void entityStore.reloadFunctions()
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
        if (index !== -1) tabs.value.splice(index, 1)
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
        tabs.value
          .filter(t => !t.preserve && t.entity.id !== entity?.id)
          .forEach(t => closeTab(t.entity))
        if (entity) {
          let tab = tabs.value.find(t => t.entity.id === entity.id)
          if (!tab) {
            tabs.value.push({ selectedVersion: entity.version, entity: entity, dirty: false })
            tab = tabs.value[tabs.value.length - 1]
          }
          void router.push({
            name: 'editor',
            params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repository?.id, entityId: entity.id },
            query: tab.selectedVersion ? { version: tab.selectedVersion } : {}
          })
        } else {
          void router.push({
            name: 'editor',
            params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repository?.id, entityId: undefined }
          })
        }
      }
    )

    watch(
      () => props.entityId,
      (newVal) => {
        if (newVal) {
          if (!selected.value || newVal !== selected.value.id)
            entityStore.loadEntity(newVal)
              .then(entity => selected.value = entity)
              .catch((e: Error) => alert(e.message))
        } else {
          selected.value = undefined
        }
      }
    )

    const switchTab = (offset: number) => {
      var index = tabs.value.findIndex(t => selected.value?.id === t.entity.id)
      if (index === -1) return
      index += offset
      if (tabs.value[index] === undefined) return
      selectTabByKey(tabs.value[index].entity.id)
    }

    const keylistener = (e: KeyboardEvent) => {
      if (!props.hotkeysEnabled) return
      if (e.code === 'Delete' && (e.ctrlKey || e.metaKey)) {
        closeTab(selected.value)
      } if (e.code === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        switchTab(-1)
      } else if (e.code === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        switchTab(1)
      } else return
      e.preventDefault()
    }

    onMounted(async () => {
      document.addEventListener('keydown', keylistener)
      await reloadEntities().then(() => {
        if (!props.entityId) return
        entityStore
          .loadEntity(props.entityId)
          .then(entity => {
            if (!entity) return
            tabs.value = [ { selectedVersion: props.version, entity: entity, dirty: false }]
            selected.value = entity
          })
          .catch((e: Error) => {
            alert(e.message)
            void router.push({
              name: 'editor',
              params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repository?.id, entityId: undefined }
            })
          })
      })
    })

    return {
      t, showJson, splitterModel, entities, selected, tabs, treeLoading, showExportDialog, exportEntity,
      isRestricted, getTitle, getIcon,
      reloadEntities, selectTabByKey, closeTab, alert,
      organisationId,
      repository,

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
            if (index != -1) {
              tabs.value[index].entity = r
              tabs.value[index].selectedVersion = r.version
            }
            void router.push({
              name: 'editor',
              params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repository?.id, entityId: r.id },
              query: { version: r.version }
            })
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

      handleEntityDuplication (entity: Entity): void {
        const duplicate = entityStore.addDuplicate(entity)
        if (duplicate) selectTabByKey(duplicate.id)
      },

      handleEntityExport (entity: Entity): void {
        showExportDialog.value = true
        exportEntity.value = entity
      },

      closeOtherTabs (tab: EditorTab): void {
        tabs.value = [tab]
        selected.value = tab.entity
      },

      closeSavedTabs (): void {
        tabs.value.filter(t => !t.dirty).forEach(t => closeTab(t.entity))
      },

      preserve (): void {
        void nextTick(() => {
          if (selected.value) {
            const tab = tabs.value.find(t => t.entity.id === selected.value?.id)
            if (tab) tab.preserve = true
          }
        })
      },

      allowedEntityTypes: computed(() => {
        if (repository.value?.repositoryType === RepositoryType.ConceptRepository)
          return [EntityType.Category]
        if (repository.value?.repositoryType === RepositoryType.PhenotypeRepository)
          return undefined
        return []
      }),

      isPhenotypeRepository: computed(() =>
        repository.value && repository.value.repositoryType === RepositoryType.PhenotypeRepository
      )
    }
  }
})

interface EditorTab {
  entity: Entity,
  selectedVersion?: number,
  dirty: boolean,
  preserve?: boolean
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
