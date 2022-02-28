<template>
  <q-menu context-menu>
    <q-list v-if="!entity || entity.entityType === EntityType.Category" dense>
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
    <q-list v-else-if="entity" dense>
      <q-item v-if="entity.entityType === EntityType.SinglePhenotype" v-close-popup clickable @click="$emit('createEntityClicked', EntityType.SingleRestriction, entity.id)">
        <q-item-section>{{ t('addThing', { thing: t(EntityType.SingleRestriction) }) }}</q-item-section>
      </q-item>
      <q-item v-if="entity.entityType === EntityType.DerivedPhenotype" v-close-popup clickable @click="$emit('createEntityClicked', EntityType.DerivedRestriction, entity.id)">
        <q-item-section>{{ t('addThing', { thing: t(EntityType.DerivedRestriction) }) }}</q-item-section>
      </q-item>
      <q-item v-if="entity.entityType === EntityType.CombinedPhenotype" v-close-popup clickable @click="$emit('createEntityClicked', EntityType.CombinedRestriction, entity.id)">
        <q-item-section>{{ t('addThing', { thing: t(EntityType.SingleRestriction) }) }}</q-item-section>
      </q-item>
    </q-list>
    <q-separator />
    <q-list v-if="entity" dense>
      <q-item v-close-popup clickable @click="$emit('deleteEntityClicked', entity.id)">
        <q-item-section v-t="'delete'" />
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
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

    return { t, EntityType }
  }
})
</script>
