<template>
  <q-input
    v-model="filterTitle"
    :dense="dense"
    hide-bottom-space
    :outlined="outlined"
    :autofocus="autofocus"
    class="fit"
    :debounce="500"
    :placeholder="placeholder || (t('searchThing', { thing: t('entity') }) + '...')"
    @update:model-value="filterFn"
    @focus="showMenu = true"
  >
    <template #append>
      <q-icon dense flat name="search" :title="t('search')" />
    </template>
  </q-input>

  <q-menu
    ref="menu"
    v-model="showMenu"
    fit
    no-focus
    no-refocus
    no-parent-event
    separate-close-popup
    anchor="bottom middle"
    self="top middle"
    @hide="reset"
  >
    <div>
      <div class="row q-pa-sm q-gutter-sm items-center">
        <div class="col-auto text-bold text-grey non-selectable">
          {{ t('filterBy') }}:
        </div>
        <repository-select-field
          v-model="filterRepository"
          dense
          class="inline col"
          @update:model-value="filterFn"
        />
        <item-type-select
          v-model="filterItemType"
          dense
          class="inline col"
          @update:model-value="filterFn"
        />
        <data-type-select
          v-model="filterDataType"
          dense
          class="inline col"
          @update:model-value="filterFn"
        />
      </div>

      <q-separator />

      <div>
        <div
          v-if="!options || !options.length"
          v-t="'entitySearchDescription'"
          class="self-center text-italic ellipsis q-pa-sm"
        />

        <q-virtual-scroll
          v-else
          ref="virtualScroll"
          v-slot="{ item }"
          class="entity-search-result q-py-sm"
          :items="options"
          :virtual-scroll-item-size="50"
          @virtual-scroll="onScroll"
        >
          <q-item :key="item.id" clickable dense @click="$emit('entitySelected', item)">
            <q-item-section avatar>
              <q-icon :name="getIcon(item)" :title="getIconTooltip(item)" :class="{ restriction: isRestricted(item) }" />
            </q-item-section>
            <q-item-section>
              <q-item-label v-if="item.repository" overline class="ellipsis">
                {{ item.repository.name }}
              </q-item-label>
              <q-item-label class="ellipsis">
                {{ getTitle(item, true) }}
              </q-item-label>
              <template v-if="showDetails">
                <q-item-label v-for="(description, index) in getDescriptions(item)" :key="index" caption class="ellipsis">
                  {{ description }}
                </q-item-label>
              </template>
            </q-item-section>
            <q-item-section
              v-show="isLoggedIn && fork && repositoryId && repositoryId !== item.repository.id && item.repository.primary"
              avatar
            >
              <q-btn
                v-close-popup
                flat
                round
                icon="content_copy"
                :title="t('forkToCurrentRepository')"
                @click.stop="handleFork(item)"
              />
            </q-item-section>
          </q-item>
        </q-virtual-scroll>
      </div>

      <q-inner-loading :showing="loading" />
    </div>

    <q-separator />

    <div class="row justify-end">
      <q-btn v-close-popup no-caps flat :label="t('dismiss')" />
    </div>
  </q-menu>

  <fork-create-dialog
    v-model:show="showForkCreateDialog"
    :origin="forkOrigin"
    @create-fork="forkEntity(forkOrigin, $event)"
  />
</template>

<script lang="ts">
import { defineComponent, ref, inject, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, Entity, Repository, DataType, ItemType, EntityPage, ForkingInstruction } from '@onto-med/top-api'
import { EntityApiKey } from 'boot/axios'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { VScrollDetails } from 'src/mixins/ScrollDetails'
import RepositorySelectField from 'src/components/Repository/RepositorySelectField.vue'
import { storeToRefs } from 'pinia'
import { useEntity } from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import ForkCreateDialog from 'src/components/EntityEditor/Forking/ForkCreateDialog.vue'
import ItemTypeSelect from './ItemTypeSelect.vue'
import DataTypeSelect from './DataTypeSelect.vue'
import { QMenu, QVirtualScroll } from 'quasar'

/**
 * This component can be used as a more user-friendly search field for entities.
 * Users can filter by typing text and/or selecting a repository, data type, and item type.
 * 
 * As there is a filter for repositories, this component is not bound to a single repository.
 * In such cases, use EntitySearchInput instead.
 */
export default defineComponent({
  components: {
    RepositorySelectField,
    ForkCreateDialog,
    ItemTypeSelect,
    DataTypeSelect
  },
  props: {
    /** Placeholder to be displayed if the field is empty, default is 'Search Entity...' (gets localised). */
    placeholder: String,
    /**
     * Restrict resultset to specific entity types provided as Array. Set to undefined to apply no restrictions.
     * The default is to exclude categories.
     */
    entityTypes: {
      type: Array as () => EntityType[],
      default: () => [
        EntityType.SingleConcept, EntityType.SinglePhenotype, EntityType.SingleRestriction,
        EntityType.CompositeConcept, EntityType.CompositePhenotype, EntityType.CompositeRestriction
      ]
    },
    /** Show additional information for search results, such as descriptions, default is true. */
    showDetails: {
      type: Boolean,
      default: true
    },
    /** Use 'outlined' design for this field, default is true. */
    outlined: {
      type: Boolean,
      default: true
    },
    /** Use dense mode, default is true. */
    dense: {
      type: Boolean,
      default: true
    },
    /** Focus field on initial component render. */
    autofocus: Boolean,
    /** Whether search field supports forking from other repositories. */
    fork: Boolean
  },
  emits: ['entitySelected'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { getTitle, getIcon, getIconTooltip, getSynonyms, getDescriptions, isRestricted } = useEntityFormatter()
    const { notify, renderError } = useNotify()

    const menu          = ref<QMenu>()
    const virtualScroll = ref<QVirtualScroll>()

    const entityApi   = inject(EntityApiKey)
    const entityStore = useEntity()

    const options    = ref([] as Entity[])
    const loading    = ref(false)
    const nextPage   = ref(2)
    const totalPages = ref(0)

    const { keycloak, repositoryId } = storeToRefs(entityStore)
    const forkOrigin = ref<Entity>()
    const showForkCreateDialog = ref(false)
    const isLoggedIn = computed(() => !keycloak.value || keycloak.value.authenticated)

    const filterTitle      = ref<string>()
    const filterRepository = ref<Repository>()
    const filterItemType   = ref<ItemType>()
    const filterDataType   = ref<DataType>()

    const isValid = computed(() =>
      filterTitle.value || filterDataType.value || filterItemType.value || filterRepository.value
    )

    const emptyPage = {
      content: [],
      size: 0,
      number: 1,
      totalElements: 0,
      totalPages: 1,
      type: 'entity'
    } as EntityPage

    const loadOptions = async (page = 1): Promise<EntityPage> => {
      if (!entityApi)
        return Promise.reject({ message: t('fetchDataFailed') })
      if (!isValid.value)
        return Promise.resolve(emptyPage)

      const repositoryIds = filterRepository.value ? [filterRepository.value.id] : undefined
      return entityApi.getEntities(
        undefined, filterTitle.value, props.entityTypes, filterDataType.value, filterItemType.value, repositoryIds, props.fork, page
      ).then((r) => r.data)
    }

    const handleFork = (entity: Entity) => {
      forkOrigin.value = entity
      showForkCreateDialog.value = true
    }

    return {
      t,
      getTitle,
      getIcon,
      getIconTooltip,
      getSynonyms,
      getDescriptions,
      isRestricted,
      handleFork,

      menu,
      virtualScroll,
      showMenu: ref(false),
      showForkCreateDialog,
      repositoryId,
      forkOrigin,
      isLoggedIn,
      filterTitle,
      filterRepository,
      filterItemType,
      filterDataType,
      options,
      loading,

      filterFn () {
        loading.value = true
        nextPage.value = 2
        totalPages.value = 0
        loadOptions()
          .then(async page => {
            totalPages.value = page.totalPages
            options.value = page.content
            await nextTick()
              .then(() => virtualScroll.value?.refresh())
              .then(() => menu.value?.updatePosition())
          })
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      },

      onScroll (details: VScrollDetails) {
        const lastIndex = options.value.length - 1
        if (loading.value || nextPage.value > totalPages.value || details.to !== lastIndex || details.direction === 'decrease')
          return
        loading.value = true
        loadOptions(nextPage.value)
          .then(async page => {
            totalPages.value = page.totalPages
            if (page.content.length > 0) {
              nextPage.value++
              options.value = options.value.concat(page.content)
              await nextTick()
                .then(() => details.ref.refresh())
                .then(() => menu.value?.updatePosition())
            }
          })
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      },

      forkEntity (entity: Entity|undefined, forkingInstruction: ForkingInstruction) {
        if (!entity) return
        entityStore.forkEntity(entity, forkingInstruction)
          .then(result => {
            forkOrigin.value = undefined
            if (result.count) {
              notify(t('thingCreatedOrUpdated', { thing: `${result.count} ` + t('fork', result.count) }), 'positive')
              if (result.entity) emit('entitySelected', result.entity)
            } else {
              notify(t('forkCouldNotBeCreated'), 'warning')
            }
          })
          .catch((e: Error) => renderError(e))
      },

      reset () {
        options.value          = []
        filterTitle.value      = undefined
        filterRepository.value = undefined
        filterItemType.value   = undefined
        filterDataType.value   = undefined
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.entity-search-result
  max-height: 50vh
  max-width: 50vw
</style>
