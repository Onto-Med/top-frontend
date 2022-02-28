<template>
  <q-chip
    v-if="loading || !state"
    :label="t('loading') + '...'"
  />

  <q-chip
    v-else
    clickable
    :label="state.getTitle()"
    :icon="state.getIcon()"
    :title="state.getDescriptions().join('\n')"
    :class="{ restriction: state.isRestriction() }"
    class="truncate"
  >
    <q-menu>
      <q-list dense>
        <q-item v-close-popup clickable @click="$emit('entityClicked', state.id)">
          <q-item-section v-t="'show'" />
        </q-item>
        <q-separator />
        <q-item v-close-popup clickable @click="$emit('removeClicked', state.id)">
          <q-item-section v-t="'remove'" />
        </q-item>
      </q-list>
    </q-menu>
  </q-chip>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, Entity } from '@onto-med/top-api';
import { EntityApiKey } from 'src/boot/axios';

export default defineComponent({
  name: 'EntityChip',
  props: {
    entityId: String,
    entity: Object as () => Entity,
    organisationId: String,
    repositoryId: String
  },
  emits: ['entityClicked', 'removeClicked'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    const loading = ref(false)
    const entityApi = inject(EntityApiKey)
    const state = ref(undefined as unknown as Entity)

    const reload = () => {
      loading.value = true
      if (entityApi && props.organisationId && props.repositoryId && props.entityId)
        entityApi.getEntityById(props.organisationId, props.repositoryId, props.entityId)
          .then(r => state.value = r.data)
          .catch(() => state.value = { id: props.entityId as string, entityType: EntityType.Category })
          .finally(() => loading.value = false)
    }

    onMounted(() => {
      if (props.entity)
        state.value = props.entity
      else reload()
    })

    return { t, state, loading };
  },
});
</script>
