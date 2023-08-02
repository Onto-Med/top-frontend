<template>
  <q-menu context-menu>
    <q-list v-if="createable && (!entity || entity.createdAt && [EntityType.Category,EntityType.SingleConcept].includes(entity.entityType))" dense>
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
          v-if="entity.entityType === entry.phenotype && allowedEntityTypes.includes(entry.restriction)"
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

    <q-list v-if="duplicatable && entity && entity.createdAt" dense>
      <q-item
        v-close-popup
        clickable
        @click="emitDuplicateEntity(entity)"
      >
        <q-item-section>{{ t('duplicate') }}</q-item-section>
      </q-item>
    </q-list>
    <q-list v-if="importable && (!entity || entity.createdAt && [EntityType.Category,EntityType.SingleConcept].includes(entity.entityType))" dense>
      <q-item v-close-popup clickable @click="showTerminologyImportDialog">
        <q-item-section v-t="'terminologyImport.title'" />
      </q-item>
    </q-list>
    <q-list v-if="deletable && entity" dense>
      <q-item
        v-close-popup
        clickable
        @click="showDeleteDialog"
      >
        <q-item-section v-t="'delete'" />
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
import TerminologyImportDialog from './TerminologyImportDialog.vue'
import { storeToRefs } from 'pinia'
import { useEntity } from 'src/pinia/entity'

const props = defineProps({
  entity: Object as () => Entity,
  allowedEntityTypes: {
    type: Array as () => EntityType[],
    default: () => Object.values(EntityType)
  },
  deletable: {
    type: Boolean,
    default: true
  },
  duplicatable: {
    type: Boolean,
    default: true
  },
  importable: {
    type: Boolean,
    default: true
  },
  createable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'deleteEntityClicked', 'createEntityClicked', 'duplicateEntityClicked'
])

const { t } = useI18n()
const $q = useQuasar()
const { isPhenotype, isCategory, isConcept } = useEntityFormatter()
const { repository } = storeToRefs(useEntity())

const entries = [
  { phenotype: EntityType.SinglePhenotype, restriction: EntityType.SingleRestriction },
  { phenotype: EntityType.CompositePhenotype, restriction: EntityType.CompositeRestriction }
]

const abstractEntityTypes = computed(() =>
  [
    EntityType.Category, EntityType.SinglePhenotype, EntityType.CompositePhenotype,
    EntityType.SingleConcept, EntityType.CompositeConcept
  ].filter(e => props.allowedEntityTypes.includes(e))
)

function showDeleteDialog () {
  if (!props.entity) return
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('entityEditor.delete.confirm'),
      checkbox: isCategory(props.entity),
      checkboxLabel: t('entityEditor.delete.cascade')
    }
  }).onOk(cascade => {
    emit('deleteEntityClicked', props.entity, cascade)
  })
}

function showTerminologyImportDialog () {
  $q.dialog({
    component: TerminologyImportDialog,
    componentProps: {
      repositoryType: repository.value?.repositoryType
    }
  }).onOk((result: Entity) => {
    if (props.entity) {
      if (isCategory(result)) result.superCategories = [ props.entity ]
      if (isConcept(result)) result.superConcepts = [ props.entity ]
      if (isPhenotype(result)) result.superCategories = [ props.entity ]
    }
    emitDuplicateEntity(result)
  })
}

function emitCreateEntity (entityType: EntityType, entityId: string|undefined) {
  void setTimeout(() => emit('createEntityClicked', entityType, entityId), 50)
}

function emitDuplicateEntity (entity?: Entity) {
  if (!entity) return
  emit('duplicateEntityClicked', entity)
}
</script>
