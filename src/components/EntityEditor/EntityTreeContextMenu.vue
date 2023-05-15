<template>
  <q-menu context-menu>
    <q-list v-if="!entity || entity.createdAt && entity.entityType === EntityType.Category" dense>
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
    <q-list v-else-if="entity && entity.createdAt" dense>
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
    <q-list v-if="duplicatable && entity && entity.createdAt" dense>
      <q-item
        v-close-popup
        clickable
        @click="emitDuplicateEntity(entity)"
      >
        <q-item-section>{{ t('duplicate') }}</q-item-section>
      </q-item>
    </q-list>
    <q-separator />
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

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, Entity } from '@onto-med/top-api'
import Dialog from 'src/components/Dialog.vue'
import { useQuasar } from 'quasar'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

export default defineComponent({
  name: 'EntityTreeContextMenu',
  props: {
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
    }
  },
  emits: ['deleteEntityClicked', 'createEntityClicked', 'duplicateEntityClicked'],
  setup (props, { emit }) {
    const { t } = useI18n()
    const $q = useQuasar()
    const { isCategory } = useEntityFormatter()

    return {
      t,

      entries: [
        { phenotype: EntityType.SinglePhenotype, restriction: EntityType.SingleRestriction },
        { phenotype: EntityType.CompositePhenotype, restriction: EntityType.CompositeRestriction }
      ],

      abstractEntityTypes: computed(() =>
        [EntityType.Category, EntityType.SinglePhenotype, EntityType.CompositePhenotype]
          .filter(e => props.allowedEntityTypes.includes(e))
      ),

      EntityType,

      showDeleteDialog () {
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
      },

      emitCreateEntity: (entityType: EntityType, entityId: string|undefined) => {
        void setTimeout(() => emit('createEntityClicked', entityType, entityId), 50)
      },

      emitDuplicateEntity: (entity?: Entity) => {
        if (!entity) return
        emit('duplicateEntityClicked', entity)
      }
    }
  }
})
</script>
