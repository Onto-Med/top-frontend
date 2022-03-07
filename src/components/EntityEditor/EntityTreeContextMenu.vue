<template>
  <q-menu context-menu>
    <q-list v-if="!entity || entity.createdAt && entity.entityType === EntityType.Category" dense>
      <q-item
        v-for="entityType in [EntityType.Category, EntityType.SinglePhenotype, EntityType.DerivedPhenotype, EntityType.CombinedPhenotype]"
        :key="entityType"
        v-close-popup
        clickable
        @click="$emit('createEntityClicked', entityType, entity ? entity.id : null)"
      >
        <q-item-section>{{ t('addThing', { thing: t(entityType) }) }}</q-item-section>
      </q-item>
    </q-list>
    <q-list v-else-if="entity && entity.createdAt" dense>
      <template v-for="entry in entries" :key="entry.phenotype">
        <q-item
          v-if="entity.entityType === entry.phenotype"
          v-close-popup
          clickable
          @click="$emit('createEntityClicked',entry.restriction, entity.id)"
        >
          <q-item-section>{{ t('addThing', { thing: t(entry.restriction) }) }}</q-item-section>
        </q-item>
      </template>
    </q-list>
    <q-separator />
    <q-list v-if="entity" dense>
      <q-item clickable @click="showDeleteDialog = true">
        <q-item-section v-t="'delete'" />
      </q-item>
    </q-list>

    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-item>
            <q-item-section avatar>
              <q-avatar icon="warning_amber" color="warning" text-color="white" />
            </q-item-section>
            <q-item-section v-t="'entityEditor.confirmDelete'" />
          </q-item>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
          <q-btn v-close-popup flat :label="t('ok')" color="primary" @click="$emit('deleteEntityClicked', entity)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-menu>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, Entity } from '@onto-med/top-api'

export default defineComponent({
  name: 'EntityTreeContextMenu',
  props: {
    entity: Object as () => Entity
  },
  emits: ['deleteEntityClicked', 'createEntityClicked'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,

      entries: [
        { phenotype: EntityType.SinglePhenotype, restriction: EntityType.SingleRestriction },
        { phenotype: EntityType.DerivedPhenotype, restriction: EntityType.DerivedRestriction },
        { phenotype: EntityType.CombinedPhenotype, restriction: EntityType.CombinedRestriction },
      ],

      EntityType,

      showDeleteDialog: ref(false)
    }
  }
})
</script>
