<template>
  <q-chip
    v-if="loading"
    :label="t('loading') + '...'"
  />

  <q-chip
    v-else-if="!state"
    clickable
    :label="label"
    icon="create"
    class="truncate"
  >
    <q-popup-edit ref="popup" :model-value="null" :cover="false">
      <entity-search-input
        v-if="!disable"
        autofocus
        dense
        :label="label"
        :entity-types="entityTypes"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        @entity-selected="setEntity($event)"
        @btn-clicked="popup.cancel()"
      />
      <q-list dense>
        <slot name="additionalOptions" />
        <q-item v-if="!disable" v-close-popup clickable @click="$emit('removeClicked')">
          <q-item-section v-t="'remove'" />
        </q-item>
      </q-list>
    </q-popup-edit>
  </q-chip>

  <q-chip
    v-else
    clickable
    color="grey-4"
    :label="getTitle(state, true)"
    :icon="getIcon(state)"
    :title="getDescriptions(state).join('\n')"
    :class="{ restriction: isRestricted(state) }"
    class="truncate text-dark"
  >
    <q-menu>
      <q-list dense>
        <q-item v-close-popup clickable @click="$emit('entityClicked', state.id)">
          <q-item-section v-t="'show'" />
        </q-item>
        <q-separator />
        <slot name="additionalOptions" />
        <q-item v-if="showChange && state" v-close-popup clickable @click="setEntity(undefined)">
          <q-item-section v-t="'change'" />
        </q-item>
        <q-item v-if="!disable" v-close-popup clickable @click="$emit('removeClicked')">
          <q-item-section v-t="'remove'" />
        </q-item>
      </q-list>
    </q-menu>
  </q-chip>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Entity, EntityType } from '@onto-med/top-api'
import { useEntity } from 'src/pinia/entity'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import { QPopupEdit } from 'quasar'

export default defineComponent({
  name: 'EntityChip',
  components: {
    EntitySearchInput
  },
  props: {
    entityId: String,
    label: String,
    entity: Object as () => Entity,
    entityTypes: Array as () => EntityType[],
    organisationId: String,
    repositoryId: String,
    disable: Boolean,
    showChange: {
      type: Boolean,
      default: false
    }
  },
  emits: ['entityClicked', 'entitySet', 'removeClicked'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const popup = ref(null as unknown as QPopupEdit)
    const loading = ref(false)
    const entityStore = useEntity()
    const { getIcon, getTitle, getDescriptions, isRestricted } = useEntityFormatter()
    const state = ref(undefined as unknown as Entity|undefined)

    const reload = () => {
      if (!props.entityId) {
        void nextTick(() => popup.value?.show())
        return
      }
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

    watch(
      () => props.entityId,
      (newVal, oldVal) => {
        if (newVal !== oldVal) reload()
      }
    )

    return {
      t,
      getIcon,
      getTitle,
      getDescriptions,
      isRestricted,
      popup,
      state,
      loading,

      setEntity: (entity: Entity|undefined) => {
        state.value = entity
        emit('entitySet', entity)
      }
    };
  },
});
</script>
