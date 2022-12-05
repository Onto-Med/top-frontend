<template>
  <div class="row">
    <repository-select-field
      v-if="repositoryFilter"
      v-model="repository"
      :show-details="showDetails"
      :rounded="rounded"
      :outlined="outlined"
      :dense="dense"
      :organisation-id="organisationId"
      :label="t('repository')"
      class="inline col-3 q-mr-xs"
    />
    <q-select
      ref="select"
      v-model="selection"
      :rounded="rounded"
      :outlined="outlined"
      :dense="dense"
      :filled="filled"
      :square="square"
      hide-bottom-space
      hide-dropdown-icon
      use-input
      emit-value
      :autofocus="autofocus"
      class="inline entity-search-input-field col"
      :placeholder="selection ? '' : label || t('selectThing', { thing: t('entity') })"
      :options="options"
      :loading="loading"
      :title="t('entitySearchInput.description', { minLength: minLength, types: t('entity', 2) })"
      @filter="filterFn"
      @update:model-value="handleSelectionChanged"
    >
      <template #append>
        <slot name="append">
          <q-btn
            v-show="!loading"
            round
            dense
            flat
            :icon="icon"
            :title="t('remove')"
            @click="$emit('btnClicked')"
          />
        </slot>
      </template>
      <template #selected>
        <span v-if="selection">
          <q-icon :name="getIcon(selection)" />
          {{ getTitle(selection, true) }}
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
            <q-item-label>{{ getTitle(scope.opt, true) }}</q-item-label>
            <template v-if="showDetails">
              <q-item-label v-for="(description, index) in getDescriptions(scope.opt)" :key="index" caption class="ellipsis">
                {{ description }}
              </q-item-label>
            </template>
          </q-item-section>
          <q-item-section v-show="fork && repositoryId && repositoryId !== scope.opt.repository.id && scope.opt.repository.primary" avatar>
            <q-btn
              v-close-popup
              flat
              round
              icon="content_copy"
              :title="t('forkToCurrentRepository')"
              @click.stop="handleFork(scope.opt)"
            />
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import useAlert from 'src/mixins/useAlert'
import { EntityType, Entity, Repository, DataType } from '@onto-med/top-api'
import { EntityApiKey } from 'boot/axios'
import { AxiosResponse } from 'axios'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import RepositorySelectField from 'src/components/Repository/RepositorySelectField.vue'
import { QSelect } from 'quasar'

export default defineComponent({
  name: 'EntitySearchInput',
  components: {
    RepositorySelectField
  },
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
    dataType: String as () => DataType,
    clearOnSelect: Boolean,
    showDetails: Boolean,
    rounded: Boolean,
    outlined: Boolean,
    dense: Boolean,
    filled: Boolean,
    square: Boolean,
    autofocus: Boolean,
    organisationId: String,
    repositoryId: String,
    fork: Boolean,
    repositoryFilter: Boolean
  },
  emits: ['btnClicked', 'entitySelected', 'forkClicked'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { getTitle, getIcon, getIconTooltip, getSynonyms, getDescriptions, isRestricted } = useEntityFormatter()
    const entityApi = inject(EntityApiKey)
    const { alert } = useAlert()
    const options = ref([] as Entity[])
    const selection = ref(null)
    const loading = ref(false)
    const repository = ref(undefined as (Repository|undefined))
    const select = ref(null as unknown as QSelect)

    return {
      t, getTitle, getIcon, getIconTooltip, getSynonyms, getDescriptions, isRestricted,
      select, repository, options, selection, loading,
      async filterFn (val: string, update: (arg0: () => void) => void, abort: () => void) {
        if (val.length < props.minLength || !entityApi) {
          abort()
          return
        }

        loading.value = true
        let promise: Promise<AxiosResponse<Entity[]>>
        if (props.organisationId && props.repositoryId) {
          promise = entityApi.getEntitiesByRepositoryId(props.organisationId, props.repositoryId, undefined, val, props.entityTypes, props.dataType)
        } else if (repository.value && repository.value.organisation) {
          promise = entityApi.getEntitiesByRepositoryId(repository.value.organisation.id, repository.value.id, undefined, val, props.entityTypes, props.dataType)
        } else {
          promise = entityApi.getEntities(undefined, val, props.entityTypes, props.dataType)
        }
        await promise
          .then((r) => update(() => options.value = r.data))
          .catch((e: Error) => alert(e.message))
          .finally(() => loading.value = false)
      },
      handleSelectionChanged (entity: Entity) {
        if (props.clearOnSelect) {
          selection.value = null
          repository.value = undefined
        }
        emit('entitySelected', entity)
      },
      handleFork (entity: Entity) {
        select.value?.updateInputValue('')
        emit('forkClicked', entity)
      }
    }
  },
});
</script>
