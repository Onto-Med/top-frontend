<template>
  <q-menu context-menu>
    <q-list
      v-if="
        createable &&
        (!entity ||
          (entity.createdAt &&
            [EntityType.Category, EntityType.SingleConcept].includes(entity.entityType)))
      "
      dense
    >
      <q-item
        v-for="entityType in abstractEntityTypes"
        :key="entityType"
        v-close-popup
        clickable
        @click="emitCreateEntity(entityType, entity ? entity.id : undefined)"
      >
        <q-item-section>{{ t('addThing', { thing: t(entityType) }) }}</q-item-section>
      </q-item>
    </q-list>
    <q-list v-else-if="entity && createable && entity.createdAt" dense>
      <template v-for="entry in entries" :key="entry.phenotype">
        <q-item
          v-if="
            entity.entityType === entry.phenotype && allowedEntityTypes.includes(entry.restriction)
          "
          v-close-popup
          clickable
          @click="emitCreateEntity(entry.restriction, entity?.id)"
        >
          <q-item-section>{{ t('addThing', { thing: t(entry.restriction) }) }}</q-item-section>
        </q-item>
      </template>
    </q-list>

    <slot />

    <q-separator />

    <q-list v-if="createable && entity && entity.createdAt && !isRestricted(entity)" dense>
      <q-item v-close-popup clickable @click="showMoveDialog">
        <q-item-section>{{ t('moveTo') }}</q-item-section>
      </q-item>
    </q-list>

    <q-list v-if="duplicatable && entity && entity.createdAt" dense>
      <q-item v-close-popup clickable @click="emitDuplicateEntity(entity)">
        <q-item-section>{{ t('duplicate') }}</q-item-section>
      </q-item>
    </q-list>
    <q-list
      v-if="
        importable &&
        (!entity ||
          (entity.createdAt &&
            [EntityType.Category, EntityType.SingleConcept].includes(entity.entityType)))
      "
      dense
    >
      <q-item clickable>
        <q-item-section>{{ t('entityImport.title') }}</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right" />
        </q-item-section>
          <q-menu anchor="top end" self="top start">
            <q-list>
              <q-item v-close-popup clickable @click="showTerminologyImportDialog">
                <q-item-section>{{ t('entityImport.terminology.titleAdd') }}</q-item-section>
              </q-item>
              <!-- This doesnt show up when clicking in editor and not on an entity; don't know why -->
              <q-item v-if="isConceptRepository" v-close-popup clickable @click="showConceptImportDialog">
                <q-item-section>{{ t('entityImport.concept.titleAdd') }}</q-item-section>
              </q-item>
            </q-list>
        </q-menu>
      </q-item>
    </q-list>
    <q-list v-if="deletable && entity" dense>
      <q-item v-close-popup clickable @click="showDeleteDialog">
        <q-item-section>{{ t('delete') }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Entity, EntityType } from '@onto-med/top-api'
import Dialog from 'src/components/Dialog.vue'
import { useQuasar } from 'quasar'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import EntityMoveDialog from './EntityMoveDialog.vue'
import TerminologyImportDialog from './TerminologyImportDialog.vue'
import { storeToRefs } from 'pinia'
import { useEntityStore } from 'src/stores/entity-store'
import ConceptListImportDialog from 'components/EntityEditor/ConceptListImportDialog.vue'

const props = defineProps({
  entity: Object as () => Entity,
  allowedEntityTypes: {
    type: Array as () => EntityType[],
    default: () => Object.values(EntityType),
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
  createable: {
    type: Boolean,
    default: true,
  },
  isConceptRepository: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['createEntityClicked', 'deleteEntityClicked', 'duplicateEntityClicked'])

const { t } = useI18n()
const $q = useQuasar()
const { isCategory, isRestricted } = useEntityFormatter()
const { repository } = storeToRefs(useEntityStore())

const entries = [
  { phenotype: EntityType.SinglePhenotype, restriction: EntityType.SingleRestriction },
  { phenotype: EntityType.CompositePhenotype, restriction: EntityType.CompositeRestriction },
]

const abstractEntityTypes = computed(() =>
  [
    EntityType.Category,
    EntityType.SinglePhenotype,
    EntityType.CompositePhenotype,
    EntityType.SingleConcept,
    EntityType.CompositeConcept,
  ].filter((e) => props.allowedEntityTypes.includes(e)),
)

function showDeleteDialog() {
  if (!props.entity) return
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('entityEditor.delete.confirm'),
      checkbox: isCategory(props.entity),
      checkboxLabel: t('entityEditor.delete.cascade'),
    },
  }).onOk((cascade) => {
    emit('deleteEntityClicked', props.entity, cascade)
  })
}

function showMoveDialog() {
  if (!props.entity) return
  $q.dialog({
    component: EntityMoveDialog,
    componentProps: { entity: props.entity },
  })
}

function showTerminologyImportDialog() {
  $q.dialog({
    component: TerminologyImportDialog,
    componentProps: {
      repositoryType: repository.value?.repositoryType,
      superEntity: props.entity,
    },
  })
}

function showConceptImportDialog() {
  $q.dialog({
    component: ConceptListImportDialog,
    componentProps: {
      repositoryType: repository.value?.repositoryType,
      superEntity: props.entity,
    },
  })
}

function emitCreateEntity(entityType: EntityType, entityId: string | undefined) {
  void setTimeout(() => emit('createEntityClicked', entityType, entityId), 50)
}

function emitDuplicateEntity(entity?: Entity) {
  if (!entity) return
  emit('duplicateEntityClicked', entity)
}
</script>
