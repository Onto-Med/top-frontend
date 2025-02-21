<template>
  <div class="row">
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
      :virtual-scroll-item-size="50"
      @filter="filterFn"
      @virtual-scroll="onScroll"
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
            <q-icon
              :name="getIcon(scope.opt)"
              :title="getIconTooltip(scope.opt)"
              :class="{ restriction: isRestricted(scope.opt) }"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label
              v-if="(!(repositoryId && organisationId) || fork) && scope.opt.repository"
              overline
            >
              {{ scope.opt.repository.name }}
            </q-item-label>
            <q-item-label>{{ getTitle(scope.opt, true) }}</q-item-label>
            <template v-if="showDetails">
              <q-item-label
                v-for="(description, index) in getDescriptions(scope.opt)"
                :key="index"
                caption
                class="ellipsis"
              >
                {{ description }}
              </q-item-label>
            </template>
          </q-item-section>
          <q-item-section
            v-show="
              isLoggedIn &&
              fork &&
              !implicitFork &&
              currentRepositoryId &&
              currentRepositoryId !== scope.opt.repository.id &&
              scope.opt.repository.primary
            "
            avatar
          >
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

    <fork-create-dialog
      v-model:show="showForkCreateDialog"
      :origin="forkOrigin"
      @create-fork="forkEntity(forkOrigin, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  EntityType,
  Entity,
  DataType,
  ItemType,
  EntityPage,
  ForkingInstruction,
} from '@onto-med/top-api'
import { EntityApiKey } from 'boot/axios'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { storeToRefs } from 'pinia'
import { useEntityStore } from 'src/stores/entity-store'
import { QSelect } from 'quasar'
import useNotify from 'src/mixins/useNotify'
import ForkCreateDialog from 'src/components/EntityEditor/Forking/ForkCreateDialog.vue'
import { ScrollDetails } from '../models'

const props = defineProps({
  label: String,
  minLength: {
    type: Number,
    default: 2,
  },
  icon: {
    type: String,
    default: 'close',
  },
  entityTypes: Array as () => EntityType[],
  dataType: String as () => DataType,
  itemType: String as () => ItemType,
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
  /** Whether search field supports forking from other repositories. */
  fork: Boolean,
  /** Whether fork is done by clicking a copy btn (default) or implicitly by selecting an entity. */
  implicitFork: Boolean,
})

const emit = defineEmits(['btnClicked', 'entitySelected', 'forkClicked'])

const { t } = useI18n()
const { getTitle, getIcon, getIconTooltip, getDescriptions, isRestricted } = useEntityFormatter()
const entityApi = inject(EntityApiKey)
const { notify, renderError } = useNotify()
const options = ref([] as Entity[])
const selection = ref(null)
const loading = ref(false)
const select = ref(null as unknown as QSelect)
const prevInput = ref(undefined as string | undefined)
const nextPage = ref(2)
const totalPages = ref(0)
const entityStore = useEntityStore()
const { keycloak, repositoryId: currentRepositoryId } = storeToRefs(entityStore)
const forkOrigin = ref<Entity>()
const showForkCreateDialog = ref(false)
const isLoggedIn = computed(() => !keycloak.value || keycloak.value.authenticated)

async function loadOptions(input: string | undefined, page = 1): Promise<EntityPage> {
  if (!entityApi) return Promise.reject({ message: 'Could not load data from the server.' })
  let repositoryIds = undefined
  if (props.organisationId && props.repositoryId) {
    repositoryIds = [props.repositoryId]
  }
  return entityApi
    .getEntities(
      undefined,
      input,
      props.entityTypes,
      props.dataType,
      props.itemType,
      repositoryIds,
      props.fork,
      page,
    )
    .then((r) => r.data)
}

function handleFork(entity: Entity) {
  select.value?.updateInputValue('')
  forkOrigin.value = entity
  showForkCreateDialog.value = true
}

function filterFn(input: string, update: (arg0: () => void) => void, abort: () => void) {
  if (input.length < props.minLength) {
    abort()
    return
  }
  prevInput.value = input
  loading.value = true
  nextPage.value = 2
  totalPages.value = 0
  loadOptions(input)
    .then((page) => {
      totalPages.value = page.totalPages
      update(() => (options.value = page.content))
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function onScroll({ to, direction, ref }: ScrollDetails) {
  const lastIndex = options.value.length - 1
  if (
    loading.value ||
    (!prevInput.value && props.minLength > 0) ||
    nextPage.value > totalPages.value ||
    to !== lastIndex ||
    direction === 'decrease'
  )
    return
  loading.value = true
  loadOptions(prevInput.value, nextPage.value)
    .then((page) => {
      totalPages.value = page.totalPages
      if (page.content.length > 0) {
        nextPage.value++
        options.value = options.value.concat(page.content)
        void nextTick(() => {
          ref.refresh()
          loading.value = false
        })
      }
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function handleSelectionChanged(entity: Entity) {
  if (props.clearOnSelect) {
    selection.value = null
  }
  if (
    isLoggedIn.value &&
    props.fork &&
    props.implicitFork &&
    currentRepositoryId.value !== entity.repository?.id &&
    entity.repository?.primary
  ) {
    handleFork(entity)
  } else {
    emit('entitySelected', entity)
  }
}

function forkEntity(entity: Entity | undefined, forkingInstruction: ForkingInstruction) {
  if (!entity) return
  entityStore
    .forkEntity(entity, forkingInstruction)
    .then((result) => {
      forkOrigin.value = undefined
      if (result.count) {
        notify(
          t('thingCreatedOrUpdated', { thing: `${result.count} ` + t('fork', result.count) }),
          'positive',
        )
        if (result.entity) emit('entitySelected', result.entity)
      } else {
        notify(t('forkCouldNotBeCreated'), 'warning')
      }
    })
    .catch((e: Error) => renderError(e))
}
</script>
