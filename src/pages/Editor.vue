<template>
  <q-page>
    <q-splitter v-model="splitterModel" style="min-height: inherit; height: 100px" :limits="[15, 50]">
      <template #before>
        <div class="column fit">
          <div v-if="repository" class="row items-center q-pl-sm bg-primary text-white shadow-2 entity-editor-tabs-bar">
            <div class="col ellipsis" :title="repository.name || repository.id">
              <q-icon
                :name="repositoryIcon(repository)"
                :title="t(repository.repositoryType || 'repository')"
                class="q-mr-sm q-tree__icon"
              />
              {{ repository.name || repository.id }}
            </div>

            <q-btn-group dense flat class="gt-xs">
              <q-btn :title="t('importAndExport')" @click="showExportDialog = true">
                <q-icon name="sync_alt" class="rotate-90" />
              </q-btn>
              <q-btn
                v-if="writable"
                :icon="isConceptRepository ? 'find_in_page' : 'manage_search'"
                :title="t('buildQuery')"
                :to="{ name: 'queryBuilder', params: { organisationId, repositoryId: repository.id } }"
              />
            </q-btn-group>

            <export-dialog v-model:show="showExportDialog" :repository="repository" @import="reloadEntities()" />
          </div>
          <entity-tree
            v-model:selected="selected"
            :nodes="entities"
            :loading="treeLoading"
            :allowed-entity-types="allowedEntityTypes"
            class="col column full-width"
            :show-context-menu="writable"
            :is-concept-repository="isConceptRepository"
            @delete-entity="deleteEntity"
            @create-entity="handleEntityCreation"
            @duplicate-entity="handleEntityDuplication"
            @dblclick="preserve()"
          />
          <q-expansion-item :label="t('concept_cluster')">
            content
          </q-expansion-item>
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
            <q-tab v-for="tab in tabs" :key="tab.state.id" :name="tab.state.id" @dblclick="tab.preserve = true">
              <span class="no-wrap" :class="{ 'text-italic': !tab.preserve }">
                <q-icon :name="getIcon(tab.state)" :class="{ restriction: isRestricted(tab.state) }" />
                {{ getTabTitle(tab) }}
                <span v-show="tab.dirty" class="text-accent" :title="t('unsavedChanges')">*</span>
                <q-btn
                  flat
                  dense
                  rounded
                  icon="close"
                  size="xs"
                  @click.stop="closeTab(tab.state)"
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
          <q-tab-panels v-if="tabs.length !== 0" :model-value="selected ? selected.id : undefined" class="col entity-editor-tab">
            <q-tab-panel v-for="tab in tabs" :key="tab.state.id" :name="tab.state.id" class="q-pa-none">
              <entity-tab
                v-if="repository && organisationId"
                :entity="tab.state"
                :version="tab.selectedVersion"
                :repository-id="repository.id"
                :organisation-id="organisationId"
                :hotkeys-enabled="selected?.id === tab.state.id"
                :dirty="tab.dirty"
                :readonly="!writable"
                @update:entity="handleTabUpdate(tab, $event)"
                @entity-clicked="selectTabByKey($event)"
                @reload-failed="closeTab(tab.state); notify($event.message)"
                @restore-version="tab.selectedVersion = $event.version; restoreVersion($event)"
                @change-version="tab.selectedVersion = $event"
                @save="saveEntity(tab.state)"
                @reset="reset(tab)"
              />
            </q-tab-panel>
          </q-tab-panels>
          <div v-else class="col column entity-editor-tab text-grey gt-xs">
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
  </q-page>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import { useI18n } from 'vue-i18n'
import EntityTab from 'src/components/EntityEditor/EntityTab.vue'
import EntityTree from 'src/components/EntityEditor/EntityTree.vue'
import ExportDialog from 'src/components/Repository/ImportExportDialog.vue'
import {
  Category, Entity, EntityType, LocalisableText, Phenotype, RepositoryType, Concept
} from '@onto-med/top-api'
import { EntityApiKey } from 'src/boot/axios'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useQuasar } from 'quasar'
import Dialog from 'src/components/Dialog.vue'

interface EditorTab {
  state: Entity,
  selectedVersion?: number,
  dirty: boolean,
  preserve?: boolean
}

const props = defineProps({
  entityId: String,
  version: Number,
  hotkeysEnabled: {
    type: Boolean,
    default: true
  }
})

const { t, locale } = useI18n()
const $q = useQuasar()
const {
  canWrite, getIcon, getTitle, isRestricted, isPhenotype, repositoryIcon, isConcept
} = useEntityFormatter()
const router = useRouter()
const { notify, renderError } = useNotify()
const entityStore = useEntity()
const {
  entities, isAuthenticated, repository, organisationId, organisation
} = storeToRefs(entityStore)
const entityApi = inject(EntityApiKey)
const splitterModel = ref($q.localStorage.getItem<number>('editorSplitterWidth') || 25)
const showExportDialog = ref(false)
const selected = ref<Entity>()
const tabs = ref<EditorTab[]>([])
const treeLoading = ref(false)

void entityStore.reloadFunctions()

const writable = computed(() => isAuthenticated.value && canWrite(organisation.value))

const allowedEntityTypes = computed(() => {
  if (repository.value?.repositoryType === RepositoryType.ConceptRepository)
    return [EntityType.SingleConcept, EntityType.CompositeConcept]
  if (repository.value?.repositoryType === RepositoryType.PhenotypeRepository)
    return [
      EntityType.SinglePhenotype,
      EntityType.SingleRestriction,
      EntityType.CompositePhenotype,
      EntityType.CompositeRestriction,
      EntityType.Category
    ]
  return []
})

const isConceptRepository = computed(() =>
  repository.value && repository.value.repositoryType === RepositoryType.ConceptRepository
)

const hasUnsavedTabs = computed(() => tabs.value.some(t => t.dirty || !t.state.version))

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  reloadEntities()
    .then(() => {
      if (!props.entityId) return
      return entityStore
        .loadEntity(props.entityId)
    })
    .then(entity => {
      if (!entity) return
      tabs.value = [ { selectedVersion: props.version, state: clone(entity), dirty: false }]
      selected.value = entity
    })
    .catch((e: Error) => {
      renderError(e)
      void router.push({
        name: 'editor',
        params: {
          organisationId: entityStore.organisationId,
          repositoryId: entityStore.repository?.id,
          entityId: undefined
        }
      })
    })
})

onBeforeRouteLeave(
  async () => await confirmCloseUnsavedTabs().then(() => true).catch(() => false)
)

watch(
  repository,
  newVal => {
    if (!newVal || !repository.value || newVal.id !== repository.value.id)
      closeTab(undefined)
  }
)

watch(
  selected,
  entity => {
    tabs.value
      .filter(t => !t.preserve && t.state.id !== entity?.id)
      .forEach(t => closeTab(t.state))
    if (entity) {
      let tab = getTab(entity)
      if (!tab) {
        tabs.value.push({ selectedVersion: entity.version, state: clone(entity), dirty: false })
        tab = tabs.value[tabs.value.length - 1]
      }
      void router.push({
        name: 'editor',
        params: {
          organisationId: entityStore.organisationId,
          repositoryId: entityStore.repository?.id,
          entityId: entity.id
        },
        query: tab.selectedVersion ? { version: tab.selectedVersion } : {}
      })
    } else if (entityStore.repository) {
      void router.push({
        name: 'editor',
        params: {
          organisationId: entityStore.organisationId,
          repositoryId: entityStore.repository.id,
          entityId: undefined
        }
      })
    }
  }
)

watch(
  () => props.entityId,
  newVal => {
    if (newVal) {
      if (!selected.value || newVal !== selected.value.id)
        entityStore.loadEntity(newVal)
          .then(entity => selected.value = entity)
          .catch((e: Error) => renderError(e))
    } else {
      selected.value = undefined
    }
  }
)

watch(
  splitterModel,
  newVal => $q.localStorage.set('editorSplitterWidth', newVal)
)

function clone(value: Category|Phenotype|Concept) {
  return JSON.parse(JSON.stringify(value)) as Category|Phenotype|Concept
}

function equals(expected: unknown, actual: unknown) {
  return JSON.stringify(expected) === JSON.stringify(actual)
}

async function reloadEntities() {
  treeLoading.value = true
  return entityStore.reloadEntities()
    .then(() => tabs.value = tabs.value.filter(t => entities.value.findIndex(e => e.id === t.state.id) !== -1))
    .catch((e: Error) => renderError(e))
    .finally(() => treeLoading.value = false)
}

function selectTabByKey(key?: string) {
  const selection = entityStore.getEntity(key)
  selected.value = selection ? selection : undefined
}

function closeTab(entity?: Entity) {
  if (entity === undefined) {
    tabs.value = []
    selected.value = undefined
  } else {
    const id = entity.id
    const index = tabs.value.map(t => t.state.id).indexOf(id)
    if (index !== -1) tabs.value.splice(index, 1)
    if (selected.value && selected.value.id === id) {
      if (tabs.value[tabs.value.length - 1])
        selected.value = entityStore.getEntity(tabs.value[tabs.value.length - 1].state.id)
      else selected.value = undefined
    }
  }
}

function handleTabUpdate(tab: EditorTab, entity: Entity) {
  tab.state = entity
  tab.dirty = !tab.state.version || !equals(tab.state, entityStore.getEntity(tab.state.id))
  tab.preserve = tab.preserve || tab.dirty
}

function switchTab(offset: number) {
  var index = tabs.value.findIndex(t => selected.value?.id === t.state.id)
  if (index === -1) return
  index += offset
  if (tabs.value[index] === undefined) return
  selectTabByKey(tabs.value[index].state.id)
}

function onKeydown (e: KeyboardEvent) {
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

function deleteEntity(entity: Entity, cascade?: boolean) {
  if (!entity || !entityApi) return
  treeLoading.value = true

  entityStore.deleteEntity(entity, cascade)
    .then(() => {
      notify(t('thingDeleted', { thing: t('entity') }), 'positive')
      closeTab(entity)
      if (isPhenotype(entity))
        tabs.value
          .filter(t => (t.state as Phenotype).superPhenotype?.id === entity.id)
          .forEach(t => closeTab(t.state))
      if (isConcept(entity))
        tabs.value
          .filter(t => (t.state as Concept).superConcepts?.filter(c => c.id === entity.id))
          .forEach(t => closeTab(t.state))
    })
    .catch((e: Error) => renderError(e))
    .finally(() => treeLoading.value = false)
}

function saveEntity(entity: Entity) {
  entityStore.saveEntity(entity)
    .then((r) => {
      notify(t('thingSaved', { thing: t(entity.entityType) }), 'positive')
      const tab = getTab(r)
      if (tab) {
        tab.state = clone(r)
        tab.dirty = false
        tab.selectedVersion = r.version
      }
      void router.push({
        name: 'editor',
        params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repository?.id, entityId: r.id },
        query: { version: r.version }
      })
    })
    .catch((e: Error) => renderError(e))
}

function restoreVersion(entity: Entity) {
  entityStore.restoreVersion(entity)
    .then(() => {
      notify(t('thingRestored', { thing: t('version') }), 'positive')
      const index = tabs.value.findIndex(t => t.state.id == entity.id)
      if (index !== -1) tabs.value[index].state = entity
    })
    .catch((e: Error) => renderError(e))
}

function handleEntityCreation(entityType: EntityType, superClassId: string) {
  const entity = entityStore.addEntity(entityType, superClassId)
  entity.titles = [ { lang: locale.value } as LocalisableText ]
  if (entity) selectTabByKey(entity.id)
}

function handleEntityDuplication(entity: Entity) {
  const duplicate = entityStore.addDuplicate(entity)
  if (duplicate) selectTabByKey(duplicate.id)
}

function closeOtherTabs(tab: EditorTab) {
  tabs.value = [tab]
  selected.value = tab.state
}

function closeSavedTabs() {
  tabs.value.filter(t => !t.dirty && !!t.selectedVersion).forEach(t => closeTab(t.state))
}

function preserve() {
  void nextTick(() => {
    if (selected.value) {
      const tab = tabs.value.find(t => t.state.id === selected.value?.id)
      if (tab) tab.preserve = true
    }
  })
}

function getTab(entity?: Entity) {
  return tabs.value.find(t => t.state.id === entity?.id)
}

function reset(tab: EditorTab) {
  const entity = entityStore.getEntity(tab.state.id)
  if (entity) {
    void router.replace({
      name: 'editor',
      params: {
        organisationId: organisationId.value,
        repositoryId: entityStore.repositoryId,
        entityId: entity.id
      },
      query: { version: entity.version }
    })
    handleTabUpdate(tab, clone(entity))
  } else {
    closeTab(tab.state)
  }
}

function getTabTitle(tab: EditorTab) {
  return getTitle(entityStore.getEntity(tab.state.id), true)
}

/**
 * Shows a confirmation dialog if the provided tab is unsaved.
 * @param {EntityTab|undefined} tab - The tab to check for unsaved changes, if undefined all tabs are checked.
 */
async function confirmCloseUnsavedTabs(tab?: EditorTab) {
  return new Promise<void>((resolve, reject) => {
    console.log(tabs.value)
    if (tab && !tab.dirty && !!tab.selectedVersion || !hasUnsavedTabs.value)
      return resolve()
    $q.dialog({
      component: Dialog,
      componentProps: {
        message: t('confirmUnsavedChanges')
      }
    })
    .onOk(() => resolve())
    .onCancel(() => reject())
    .onDismiss(() => reject())
  })
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
