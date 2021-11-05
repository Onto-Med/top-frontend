<template>
  <q-chip
    v-if="loading || !entity"
    :label="t('loading') + '...'"
  />

  <q-chip
    v-else
    clickable
    :label="entity.getTitle()"
    :icon="entity.getIcon()"
    :title="entity.getDescriptions().join('\n')"
    :class="{ restriction: entity.isRestriction() }"
    class="truncate"
  >
    <q-menu>
      <q-list dense>
        <q-item v-close-popup clickable @click="$emit('entityClicked', entity.id)">
          <q-item-section v-t="'show'" />
        </q-item>
        <q-separator />
        <q-item v-close-popup clickable @click="$emit('removeClicked', entity.id)">
          <q-item-section v-t="'remove'" />
        </q-item>
      </q-list>
    </q-menu>
  </q-chip>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchEntity } from 'src/api/entityRepository'
import { Entity } from 'src/models/Entity'

export default defineComponent({
  name: 'EntityChip',
  props: {
    entityId: {
      type: [String, Number],
      required: true
    }
  },
  emits: ['entityClicked', 'removeClicked'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    const loading = ref(false)
    const entity = ref(undefined as unknown as Entity)

    const reload = () => {
      loading.value = true
      fetchEntity(props.entityId)
        .then(r => entity.value = r)
        .catch(() => entity.value = new Entity({ id: props.entityId }))
        .finally(() => loading.value = false)
    }

    onMounted(reload)
    return { t, entity, loading };
  },
});
</script>
