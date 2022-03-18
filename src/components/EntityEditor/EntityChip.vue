<template>
  <q-chip
    v-if="loading || !state"
    :label="t('loading') + '...'"
  />

  <q-chip
    v-else
    clickable
    :label="getTitle(state)"
    :icon="getIcon(state)"
    :title="getDescriptions(state).join('\n')"
    :class="{ restriction: isRestricted(state) }"
    class="truncate"
  >
    <q-menu>
      <q-list dense>
        <q-item v-close-popup clickable @click="$emit('entityClicked', state.id)">
          <q-item-section v-t="'show'" />
        </q-item>
        <q-separator />
        <slot name="additionalOptions" />
        <q-item v-if="!disable" v-close-popup clickable @click="$emit('removeClicked', state.id)">
          <q-item-section v-t="'remove'" />
        </q-item>
      </q-list>
    </q-menu>
  </q-chip>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Entity } from '@onto-med/top-api'
import { useEntity } from 'src/pinia/entity';
import useEntityFormatter from 'src/mixins/useEntityFormatter';

export default defineComponent({
  name: 'EntityChip',
  props: {
    entityId: String,
    entity: Object as () => Entity,
    disable: Boolean
  },
  emits: ['entityClicked', 'removeClicked'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    const loading = ref(false)
    const entityStore = useEntity()
    const { getIcon, getTitle, getDescriptions, isRestricted } = useEntityFormatter()
    const state = ref(undefined as unknown as Entity)

    const reload = () => {
      loading.value = true
      if (props.entityId) {
        const entity = entityStore.getEntity(props.entityId)
        if (entity) state.value = entity
        loading.value = false
      }
    }

    onMounted(() => {
      if (props.entity)
        state.value = props.entity
      else reload()
    })

    return { t, getIcon, getTitle, getDescriptions, isRestricted, state, loading };
  },
});
</script>
