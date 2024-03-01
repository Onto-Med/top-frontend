<template>
  <q-chip v-if="loading" :dense="dense" :square="dense" :label="t('loading') + '...'" />

  <template v-else-if="!state">
    <span
      v-if="dense"
      class="dense-chip"
    >[{{ label }}]<!--
      --><q-popup-edit ref="popup" :model-value="null" :cover="false" class="q-pa-none">
        <entity-search-input
          v-if="!disable"
          autofocus
          dense
          :label="label"
          :entity-types="entityTypes"
          :data-type="dataType"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          :fork="includePrimaryRepositories"
          implicit-fork
          class="q-px-sm"
          @entity-selected="setEntity($event)"
          @btn-clicked="popup.cancel()"
        />
        <q-item v-if="includePrimary" dense>
          <q-item-section>
            <q-checkbox
              v-model="includePrimaryRepositories"
              dense
              size="xs"
              class="text-caption"
              :label="t('includePrimaryRepositories')"
              :title="t('includePrimaryRepositoriesDescription')"
            />
          </q-item-section>
        </q-item>
        <q-separator v-if="includePrimary" />
        <q-list dense>
          <slot name="additionalOptions" />
          <q-item v-if="!disable && removeable" v-close-popup clickable @click="$emit('removeClicked')">
            <q-item-section v-t="'remove'" />
          </q-item>
        </q-list>
      </q-popup-edit>
    </span>

    <q-chip
      v-else
      :dense="dense"
      :square="dense"
      :clickable="!dense"
      :label="label"
      icon="create"
      :class="{ 'dense-chip': dense }"
      class="truncate"
    >
      <q-popup-edit ref="popup" :model-value="null" :cover="false">
        <entity-search-input
          v-if="!disable"
          autofocus
          dense
          :label="label"
          :entity-types="entityTypes"
          :data-type="dataType"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          :include-primary="includePrimaryRepositories"
          @entity-selected="setEntity($event)"
          @btn-clicked="popup.cancel()"
        />
        <q-list dense>
          <q-item v-if="includePrimary" dense>
            <q-item-section>
              <q-checkbox
                v-model="includePrimaryRepositories"
                dense
                size="xs"
                class="text-caption"
                :label="t('includePrimaryRepositories')"
                :title="t('includePrimaryRepositoriesDescription')"
              />
            </q-item-section>
          </q-item>
          <q-separator v-if="includePrimary" />
          <slot name="additionalOptions" />
          <q-item v-if="!disable && removeable" v-close-popup clickable @click="$emit('removeClicked')">
            <q-item-section v-t="'remove'" />
          </q-item>
        </q-list>
      </q-popup-edit>
    </q-chip>
  </template>

  <q-chip
    v-else
    :dense="dense"
    :square="dense"
    :clickable="!dense"
    color="grey-4"
    :label="getTitle(state, true)"
    :icon="getIcon(state)"
    :title="getDescriptions(state).join('\n')"
    :class="{ restriction: isRestricted(state), 'dense-chip': dense }"
    class="truncate text-dark"
  >
    <q-menu>
      <q-list dense>
        <q-item v-close-popup clickable @click="$emit('entityClicked', state?.id)">
          <q-item-section v-t="'show'" />
        </q-item>
        <q-separator />
        <slot name="additionalOptions" />
        <q-item v-if="changeable && state" v-close-popup clickable @click="setEntity(undefined)">
          <q-item-section v-t="'change'" />
        </q-item>
        <q-item v-if="!disable && removeable" v-close-popup clickable @click="$emit('removeClicked')">
          <q-item-section v-t="'remove'" />
        </q-item>
      </q-list>
    </q-menu>
  </q-chip>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataType, Entity, EntityType } from '@onto-med/top-api'
import { useEntity } from 'src/pinia/entity'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import { QPopupEdit } from 'quasar'
import useNotify from 'src/mixins/useNotify'

const props = defineProps<{
  entityId?: string
  label?: string
  entity?: Entity
  entityTypes?: EntityType[]
  dataType?: DataType
  organisationId?: string
  repositoryId?: string
  disable?: boolean
  changeable?: boolean
  removeable?: boolean
  dense?: boolean
  includePrimary?: boolean
}>()

const emit = defineEmits(['entityClicked', 'entitySet', 'removeClicked'])

const { t } = useI18n()
const { renderError } = useNotify()
const popup = ref(null as unknown as QPopupEdit)
const loading = ref(false)
const entityStore = useEntity()
const { getIcon, getTitle, getDescriptions, isRestricted } = useEntityFormatter()
const state = ref(undefined as unknown as Entity | undefined)

const includePrimaryRepositories = ref(false)

onMounted(() => {
  if (props.entity) state.value = props.entity
  else reload()
})

watch(
  () => props.entityId,
  (newVal, oldVal) => {
    if (newVal !== oldVal) reload()
  }
)

function reload() {
  if (!props.entityId) {
    void nextTick(() => popup.value?.show())
    return
  }
  loading.value = true
  if (props.entityId) {
    entityStore
      .loadEntity(props.entityId)
      .then((e) => {
        state.value = e
        loading.value = false
      })
      .catch((e: Error) => renderError(e))
      .finally(() => (loading.value = false))
  }
}

function setEntity(entity: Entity | undefined) {
  state.value = entity
  emit('entitySet', entity)
}
</script>

<style lang="sass" scoped>
.hover
  color: var(--q-primary)
  font-weight: 900

.dense-chip
  margin: 0
  &:hover
    cursor: pointer
    @extend .hover
</style>
