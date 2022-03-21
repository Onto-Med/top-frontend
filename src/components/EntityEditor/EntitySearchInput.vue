<template>
  <q-select
    v-model="selection"
    :rounded="rounded"
    :outlined="outlined"
    :dense="dense"
    hide-bottom-space
    hide-dropdown-icon
    use-input
    emit-value
    :autofocus="autofocus"
    class="inline entity-search-input-field"
    :placeholder="selection ? '' : label || t('selectThing', { thing: t('entity') })"
    :options="options"
    :loading="loading"
    :title="t('entitySearchInput.description', { minLength: minLength, types: t('entity', 2) })"
    @filter="filterFn"
    @update:model-value="handleSelectionChanged"
  >
    <template #append>
      <q-btn
        v-show="!loading"
        round
        dense
        flat
        :icon="icon"
        :title="t('remove')"
        @click="$emit('btnClicked')"
      />
    </template>
    <template #selected>
      <span v-if="selection">
        <q-icon :name="getIcon(selection)" />
        {{ getTitle(selection) }}
      </span>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-icon :name="getIcon(scope.opt)" :title="getIconTooltip(scope.opt)" :class="{ restriction: isRestricted(scope.opt) }" />
        </q-item-section>
        <q-item-section>
          <q-item-label v-if="!(repositoryId && organisationId) && scope.opt.repository" overline>
            {{ scope.opt.repository.name }}
          </q-item-label>
          <q-item-label>{{ getTitle(scope.opt) }}</q-item-label>
          <q-item-label v-for="(description, index) in getDescriptions(scope.opt)" :key="index" caption>
            {{ description }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section>
          {{ t('entitySearchInput.emptyResult', { types: t('entity', 2) }) }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import useAlert from 'src/mixins/useAlert'
import { EntityType, Entity } from '@onto-med/top-api'
import { EntityApiKey } from 'boot/axios'
import { AxiosResponse } from 'axios'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

export default defineComponent({
  name: 'EntitySearchInput',
  props: {
    label: String,
    minLength: {
      type: Number,
      default: 2
    },
    icon: {
      type: String,
      default: 'close'
    },
    entityTypes: Array as () => EntityType[],
    clearOnSelect: {
      type: Boolean,
      default: false
    },
    rounded: Boolean,
    outlined: Boolean,
    dense: Boolean,
    autofocus: Boolean,
    organisationId: String,
    repositoryId: String
  },
  emits: ['btnClicked', 'entitySelected'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const { getTitle, getIcon, getIconTooltip, getSynonyms, getDescriptions, isRestricted } = useEntityFormatter()
    const entityApi = inject(EntityApiKey)
    const { alert } = useAlert()
    const options = ref([] as Entity[])
    const selection = ref(null)
    const loading = ref(false)

    return {
      t, getTitle, getIcon, getIconTooltip, getSynonyms, getDescriptions, isRestricted,
      options, selection, loading,
      async filterFn (val: string, update: (arg0: () => void) => void, abort: () => void) {
        if (val.length < props.minLength || !entityApi) {
          abort()
          return
        }

        loading.value = true
        let promise: Promise<AxiosResponse<Entity[]>>
        if (props.organisationId && props.repositoryId) {
          promise = entityApi.getEntitiesByRepositoryId(props.organisationId, props.repositoryId, undefined, val, props.entityTypes)
        } else {
          promise = entityApi.getEntities(undefined, val, props.entityTypes)
        }
        await promise
          .then((r) => update(() => options.value = r.data))
          .catch((e: Error) => alert(e.message))
          .finally(() => loading.value = false)
      },
      handleSelectionChanged (entity: Entity) {
        if (props.clearOnSelect) selection.value = null
        emit('entitySelected', entity)
      }
    }
  },
});
</script>
