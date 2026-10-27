<template>
  <q-dialog ref="dialogRef" :persistent="protectGeneratedWork" @hide="onDialogHide">
    <q-card class="query-expansion-dialog">
      <q-stepper
        ref="stepper"
        v-model="step"
        active-icon="none"
        active-color="primary"
        animated
        class="query-expansion-stepper"
      >
        <q-step :name="1" :title="t('queryExpansion.steps.source')" :done="step > 1" icon="search">
          <div class="text-body2 q-mb-md">
            {{ t('queryExpansion.placeholder.description') }}
          </div>

          <q-banner rounded class="bg-grey-2 text-grey-9 q-mb-md">
            {{ t('queryExpansion.placeholder.partiallyConnected') }}
          </q-banner>

          <q-input
            :model-value="conceptTitle"
            :label="t('queryExpansion.sourceConcept')"
            readonly
            outlined
            dense
            class="q-mb-md"
          />

          <q-select
            v-model="selectedDataSourceId"
            :options="dataSourceOptions"
            :label="t('dataSource')"
            :loading="loadingDataSources"
            :disable="loadingDataSources || dataSourceOptions.length === 0"
            emit-value
            map-options
            outlined
            dense
          />

          <q-banner v-if="dataSourceLoadError" rounded class="bg-negative text-white q-mt-md">
            {{ dataSourceLoadError }}
          </q-banner>
          <q-banner
            v-else-if="!loadingDataSources && !hasQueryExpansionCapableDataSource"
            rounded
            class="bg-grey-2 text-grey-9 q-mt-md"
          >
            {{ t('queryExpansion.noConfiguredDataSources') }}
          </q-banner>
        </q-step>

        <q-step
          :name="2"
          :title="t('queryExpansion.steps.semanticReview')"
          :done="step > 2"
          icon="fact_check"
        >
          <q-select
            v-model="selectedProfileName"
            :options="profileOptions"
            :label="t('queryExpansion.profile')"
            :loading="loadingProfiles"
            :disable="loadingProfiles"
            emit-value
            map-options
            outlined
            dense
            class="q-mb-sm"
            @update:model-value="(value) => loadProfile(value)"
          />

          <q-banner v-if="profileLoadError" rounded class="bg-negative text-white q-mb-md">
            {{ profileLoadError }}
          </q-banner>

          <q-banner v-if="expansionError" rounded class="bg-negative text-white q-mb-md">
            {{ expansionError }}
          </q-banner>

          <q-banner
            v-else-if="!loadingProfiles && profiles.length === 0"
            rounded
            class="bg-grey-2 text-grey-9 q-mb-md"
          >
            {{ t('queryExpansion.noProfiles') }}
          </q-banner>

<!--          <q-card v-if="selectedProfile" flat bordered class="q-mb-md">-->
<!--            <q-card-section>-->
<!--              <div class="text-subtitle2">{{ selectedProfile.name }}</div>-->
<!--              <div v-if="selectedProfile.languageName" class="text-caption text-grey-7">-->
<!--                {{ t('language') }}: {{ selectedProfile.languageName }}-->
<!--              </div>-->
<!--            </q-card-section>-->
<!--          </q-card>-->

          <div class="semantic-review-panels">
            <div class="semantic-catalog-row row q-col-gutter-x-md">
              <div class="col-12 col-md-6">
                <q-list bordered separator dense class="semantic-catalog-scroll-box">
                <q-item-label header class="q-py-sm">
                  {{ t('queryExpansion.relations') }}
                </q-item-label>
                <q-item v-if="loadingProfile">
                  <q-item-section><q-spinner size="sm" /></q-item-section>
                </q-item>
                <q-item v-else-if="!selectedProfile?.relations?.length">
                  <q-item-section>
                    <q-item-label caption>{{ t('queryExpansion.noRelations') }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  v-for="relation in selectedProfile?.relations"
                  :key="relation.id"
                  clickable
                  dense
                  draggable="true"
                  class="relation-review-item q-ma-xs"
                  :class="{
                    'relation-review-item--mapped': relationMappingCount(relation.id) > 0,
                    'relation-review-item--inactive': relationMappingCount(relation.id) === 0,
                  }"
                  @dragstart="startRelationDrag(relation.id)"
                  @click="addRelationMapping(relation.id)"
                >
                  <q-item-section>
                    <q-item-label>{{ relation.label || relation.id }}</q-item-label>
                    <q-item-label caption>{{ relation.description }}</q-item-label>
                    <q-item-label caption>
                      {{ t('mapping', 2) }}: {{ relationMappingCount(relation.id) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="add" />
                  </q-item-section>
                </q-item>
                </q-list>
              </div>

            <div class="col-12 col-md-6">
              <q-list bordered separator dense class="semantic-catalog-scroll-box">
                <q-item-label header class="q-py-sm">
                  {{ t('category', 2) }}
                </q-item-label>
                <q-item v-if="loadingProfile">
                  <q-item-section><q-spinner size="sm" /></q-item-section>
                </q-item>
                <q-item v-else-if="!selectedProfile?.categories?.length">
                  <q-item-section>
                    <q-item-label caption>{{ t('queryExpansion.noCategories') }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item
                  v-for="category in selectedProfile?.categories"
                  :key="category.id"
                  clickable
                  dense
                  draggable="true"
                  class="category-review-item q-ma-xs"
                  :class="{
                    'category-review-item--mapped': categoryMappingCount(category.id) > 0,
                    'category-review-item--selected': selectedCategoryIds.includes(category.id) && categoryMappingCount(category.id) === 0,
                    'category-review-item--inactive': !selectedCategoryIds.includes(category.id),
                  }"
                  @dragstart="startCategoryDrag(category.id)"
                  @click="toggleCategory(category.id)"
                >
                  <q-item-section avatar>
                    <q-checkbox
                      :model-value="selectedCategoryIds.includes(category.id)"
                      color="primary"
                      dense
                      @click.stop
                      @update:model-value="toggleCategory(category.id, $event)"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="row items-center q-gutter-xs">
                      <span class="text-weight-medium">{{ categoryLabel(category.id) }}</span>
                      <q-badge v-if="isDefaultCategory(category.id)" color="primary" outline>
                        {{ t('queryExpansion.defaultCategory') }}
                      </q-badge>
                    </q-item-label>
                    <q-item-label caption>
                      <span class="text-weight-medium">{{ category.id }}</span>
                      <span v-if="category.description"> — {{ category.description }}</span>
                    </q-item-label>
                    <q-item-label caption class="category-review-status">
                      <template v-if="categoryMappingCount(category.id) > 0">
                        {{ categoryMappingCount(category.id) }} {{ t('mapping', categoryMappingCount(category.id)) }}
                      </template>
                      <template v-else-if="selectedCategoryIds.includes(category.id)">
                        {{ t('queryExpansion.selectedCategory') }}
                      </template>
                      <template v-else>
                        {{ t('queryExpansion.inactiveCategory') }}
                      </template>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="drag_indicator" color="grey-7">
                      <q-tooltip>{{ t('queryExpansion.dragCategoryToMapping') }}</q-tooltip>
                    </q-icon>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            </div>

            <div class="semantic-mapping-row q-mt-md">
              <q-card
                flat
                bordered
                class="mapping-drop-zone"
                @dragover.prevent
                @drop="dropRelationMapping"
              >
                <q-card-section class="mapping-carousel-section q-pa-sm">
                  <div class="row items-center justify-between q-mb-xs">
                    <div class="text-subtitle2">{{ t('mapping', 2) }}</div>
                    <div class="text-caption text-grey-7">
                      {{ relationMappings.length }} {{ t('mapping', relationMappings.length) }}
                    </div>
                  </div>

                  <q-banner v-if="relationMappings.length === 0" rounded class="bg-grey-2 text-grey-9">
                    {{ t('queryExpansion.noMappings') }}
                  </q-banner>

                  <q-carousel
                    v-if="relationMappings.length > 0"
                    v-model="activeMappingId"
                    animated
                    arrows
                    navigation
                    swipeable
                    control-color="primary"
                    class="mapping-carousel"
                    @wheel.stop.prevent="changeMappingWithWheel"
                  >
                    <q-carousel-slide
                      v-for="mapping in relationMappings"
                      :key="mapping.id"
                      :name="mapping.id"
                      class="mapping-carousel-slide q-pa-sm"
                    >
                      <q-card flat bordered>
                        <q-card-section class="q-pa-sm">
                      <div class="row items-start justify-between q-mb-xs">
                        <div>
                          <div class="text-subtitle2">{{ relationLabel(mapping.relationId) }}</div>
                          <div class="text-caption text-grey-7">{{ mapping.relationId }}</div>
                        </div>
                        <q-btn
                          flat
                          dense
                          round
                          icon="delete"
                          :title="t('delete')"
                          @click="removeRelationMapping(mapping.id)"
                        />
                      </div>

                      <div class="row q-col-gutter-sm">
                        <div class="col-12 col-sm-6">
                          <div
                            class="relation-role-drop-zone source-zone"
                            @dragover.prevent
                            @drop="dropCategory(mapping.id, 'source')"
                          >
                            <div class="text-caption text-bold q-mb-xs">
                              {{ t('queryExpansion.sourceCategories') }}
                            </div>
                            <q-chip
                              v-for="categoryId in mapping.sourceCategoryIds"
                              :key="`${mapping.id}-source-${categoryId}`"
                              dense
                              removable
                              :color="getMappingCategoryColor(mapping, 'source', categoryId, 'secondary')"
                              text-color="white"
                              @remove="removeMappingCategory(mapping.id, 'source', categoryId)"
                            >
                              <q-icon
                                v-if="!isMappingCategoryAllowed(mapping, 'source', categoryId)"
                                name="warning"
                                size="xs"
                                class="q-mr-xs"
                              />
                              {{ categoryLabel(categoryId) }}
                              <q-tooltip v-if="!isMappingCategoryAllowed(mapping, 'source', categoryId)">
                                {{ t('queryExpansion.unsupportedMappingCategory') }}
                              </q-tooltip>
                            </q-chip>
                            <div v-if="mapping.sourceCategoryIds.length === 0" class="text-caption text-grey-7">
                              {{ t('queryExpansion.dropSourceCategories') }}
                            </div>
                          </div>
                        </div>

                        <div class="col-12 col-sm-6">
                          <div
                            class="relation-role-drop-zone target-zone"
                            @dragover.prevent
                            @drop="dropCategory(mapping.id, 'target')"
                          >
                            <div class="text-caption text-bold q-mb-xs">
                              {{ t('queryExpansion.targetCategories') }}
                            </div>
                            <q-chip
                              v-for="categoryId in mapping.targetCategoryIds"
                              :key="`${mapping.id}-target-${categoryId}`"
                              dense
                              removable
                              :color="getMappingCategoryColor(mapping, 'target', categoryId, 'accent')"
                              text-color="white"
                              @remove="removeMappingCategory(mapping.id, 'target', categoryId)"
                            >
                              <q-icon
                                v-if="!isMappingCategoryAllowed(mapping, 'target', categoryId)"
                                name="warning"
                                size="xs"
                                class="q-mr-xs"
                              />
                              {{ categoryLabel(categoryId) }}
                              <q-tooltip v-if="!isMappingCategoryAllowed(mapping, 'target', categoryId)">
                                {{ t('queryExpansion.unsupportedMappingCategory') }}
                              </q-tooltip>
                            </q-chip>
                            <div v-if="mapping.targetCategoryIds.length === 0" class="text-caption text-grey-7">
                              {{ t('queryExpansion.dropTargetCategories') }}
                            </div>
                          </div>
                        </div>
                      </div>
                        </q-card-section>
                      </q-card>
                    </q-carousel-slide>
                  </q-carousel>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-step>

        <q-step :name="3" :title="t('queryExpansion.steps.preview')" icon="account_tree">
          <q-banner v-if="expansionError" rounded class="bg-negative text-white q-mb-md">
            {{ expansionError }}
          </q-banner>

          <q-banner v-else rounded class="bg-grey-2 text-grey-9 q-mb-md">
            {{ t('queryExpansion.placeholder.generatedEntitiesCaption') }}
          </q-banner>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">
                    {{ t('queryExpansion.preview.singleConcepts') }}
                  </div>
                  <q-list dense separator class="preview-scroll-box">
                    <q-item>
                      <q-item-section side>
                        <q-icon name="article" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ conceptTitle }}</q-item-label>
                        <q-item-label caption>{{ t('queryExpansion.preview.sourceConcept') }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-expansion-item
                      v-for="group in previewSingleConceptGroups"
                      :key="group.id"
                      :label="group.title"
                      icon="folder"
                      dense
                      default-opened
                    >
                      <q-item v-for="concept in group.concepts" :key="concept.id" dense>
                        <q-item-section side>
                          <q-checkbox
                            :model-value="isDraftSelected(concept.id)"
                            dense
                            @update:model-value="toggleDraftSelection(concept.id, $event)"
                          />
                        </q-item-section>
                        <q-item-section side>
                          <q-icon name="label" color="secondary" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ concept.title }}</q-item-label>
                          <q-item-label v-if="concept.description" caption>{{ concept.description }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-expansion-item>
                    <q-item v-if="previewSingleConceptGroups.length === 0">
                      <q-item-section>
                        <q-item-label caption>{{ t('queryExpansion.preview.noSingleConcepts') }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-7">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">
                    {{ t('queryExpansion.preview.compositeConcepts') }}
                  </div>
                  <q-list dense separator class="preview-scroll-box">
                    <q-expansion-item
                      v-for="group in previewCompositeConceptGroups"
                      :key="group.id"
                      :label="group.title"
                      icon="account_tree"
                      dense
                      default-opened
                    >
                      <q-item v-for="composite in group.concepts" :key="composite.id" dense>
                        <q-item-section side top>
                          <q-checkbox
                            :model-value="isDraftSelected(composite.id)"
                            dense
                            @update:model-value="toggleDraftSelection(composite.id, $event)"
                          />
                        </q-item-section>
                        <q-item-section side top>
                          <q-icon name="account_tree" color="accent" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ composite.title }}</q-item-label>
                          <q-item-label v-if="composite.description && composite.description !== composite.title" caption>{{ composite.description }}</q-item-label>
                          <div class="q-mt-xs">
                            <q-chip
                              v-for="source in composite.sourceCategoryIds"
                              :key="`${composite.id}-source-${source}`"
                              dense
                              size="sm"
                              color="secondary"
                              text-color="white"
                            >
                              {{ t('queryExpansion.source') }}: {{ categoryLabel(source) }}
                            </q-chip>
                            <q-chip
                              v-for="target in composite.targetCategoryIds"
                              :key="`${composite.id}-target-${target}`"
                              dense
                              size="sm"
                              color="accent"
                              text-color="white"
                            >
                              {{ t('queryExpansion.target') }}: {{ categoryLabel(target) }}
                            </q-chip>
                          </div>
                        </q-item-section>
                      </q-item>
                    </q-expansion-item>
                    <q-item v-if="previewCompositeConceptGroups.length === 0">
                      <q-item-section>
                        <q-item-label caption>
                          {{ t('queryExpansion.preview.noCompositeConcepts') }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-step>

        <template #navigation>
          <q-separator />
          <q-stepper-navigation class="compact-stepper-navigation row items-center">
            <q-btn
              flat
              dense
              :label="backButtonLabel"
              color="primary"
              @click="onCancelClick"
            />
            <q-space />
            <q-btn
              v-if="step === 3"
              flat
              dense
              color="primary"
              :disable="expanding || saving"
              :label="t('close')"
              @click="requestDialogCancel"
            />
            <q-btn
              flat
              dense
              color="primary"
              :disable="expanding || saving || !selectedDataSourceId || (step === 2 && !selectedProfile)"
              :label="step < 3 ? t('continue') : t('save')"
              @click="onContinueClick"
            />
          </q-stepper-navigation>
        </template>
      </q-stepper>
      <q-inner-loading :showing="expanding || saving" :label="expanding ? t('queryExpansion.expanding') : t('pleaseWait')" />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { QStepper, useDialogPluginComponent, useQuasar } from 'quasar'
import {
  EntityType,
  QueryType,
  type CompositeConcept,
  type DataSource,
  type Entity,
  type QueryExpansionCandidate,
  type QueryExpansionConcept,
  type QueryExpansionProfile,
  type QueryExpansionRelation,
  type Expression,
  type QueryExpansionRequest,
  type QueryExpansionResponse,
  type SingleConcept,
} from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { QueryApiKey, QueryExpansionApiKey } from 'src/boot/axios'
import { useEntityStore } from 'stores/entity-store'

interface RelationMapping {
  id: string
  relationId: string
  sourceCategoryIds: string[]
  targetCategoryIds: string[]
}

interface QueryExpansionDataSourceCapability {
  source: DataSource
  capable: boolean
  reason?: string
}

type QueryExpansionProfileWithDefaults = QueryExpansionProfile & {
  defaultCategories?: string[]
  default_categories?: string[]
  defaultRelations?: string[]
  default_relations?: string[]
}

type QueryExpansionRequestWithMappings = QueryExpansionRequest & {
  sourceConceptId?: string
  profileName?: string
  relationMappings?: Array<{
    relationId: string
    sourceCategoryIds: string[]
    targetCategoryIds: string[]
  }>
}

type QueryExpansionResponseWithDrafts = QueryExpansionResponse & {
  generatedEntityDrafts?: {
    singleConcepts?: SingleConcept[]
    compositeConcepts?: CompositeConcept[]
  }
}

interface PreviewSingleConcept {
  id: string
  title: string
  description: string
}

interface PreviewCompositeConcept {
  id: string
  title: string
  description: string
  sourceCategoryIds: string[]
  targetCategoryIds: string[]
}

interface PreviewGroup<T> {
  id: string
  title: string
  concepts: T[]
}

const props = defineProps({
  concept: {
    type: Object as () => SingleConcept,
    required: true,
  },
})

defineEmits(['hide', 'ok'])

const { t, locale } = useI18n()
const $q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { getTitle } = useEntityFormatter()
const entityStore = useEntityStore()
const queryApi = inject(QueryApiKey)
const queryExpansionApi = inject(QueryExpansionApiKey)
const stepper = ref<QStepper>()
const step = ref(1)
const profiles = ref<QueryExpansionProfile[]>([])
const selectedProfile = ref<QueryExpansionProfile>()
const selectedProfileName = ref<string>()
const loadingProfiles = ref(false)
const loadingProfile = ref(false)
const loadingDataSources = ref(false)
const expanding = ref(false)
const saving = ref(false)
const profileLoadError = ref<string>()
const dataSourceLoadError = ref<string>()
const expansionError = ref<string>()
const dataSourceCapabilities = ref<QueryExpansionDataSourceCapability[]>([])
const selectedDataSourceId = ref<string>()
const expansionResponse = ref<QueryExpansionResponseWithDrafts>()
const selectedDraftIds = ref<string[]>([])
const selectedCategoryIds = ref<string[]>([])
const relationMappings = ref<RelationMapping[]>([])
const activeMappingId = ref('')
const draggedRelationId = ref<string>()
const draggedCategoryId = ref<string>()
let mappingCounter = 0
let mappingWheelUnlockTimer: ReturnType<typeof setTimeout> | undefined

const conceptTitle = computed(() => getTitle(props.concept))
const profileOptions = computed(() =>
  profiles.value.map((profile) => ({
    label: profile.languageName ? `${profile.name} (${profile.languageName})` : profile.name,
    value: profile.name,
  })),
)
const dataSourceOptions = computed(() =>
  dataSourceCapabilities.value.map(({ source, capable, reason }) => ({
    label: getDataSourceOptionLabel(source, capable, reason),
    value: source.id,
    disable: !capable,
  })),
)
const hasQueryExpansionCapableDataSource = computed(() =>
  dataSourceCapabilities.value.some(({ capable }) => capable),
)
const expansionCandidates = computed<QueryExpansionCandidate[]>(() =>
  Object.values(expansionResponse.value?.expansions || {}).flat(),
)
const synonymPreviewConcepts = computed<PreviewSingleConcept[]>(() => getSynonymPreviewConcepts())
const rawGeneratedSingleConceptDrafts = computed(
  () => expansionResponse.value?.generatedEntityDrafts?.singleConcepts || [],
)
const generatedSynonymConceptDraftIds = computed(() =>
  getGeneratedSynonymConceptDraftIds(rawGeneratedSingleConceptDrafts.value),
)
const generatedSingleConceptDrafts = computed(() =>
  rawGeneratedSingleConceptDrafts.value.filter(
    (draft) => !draft.id || !generatedSynonymConceptDraftIds.value.has(draft.id),
  ),
)
const generatedCompositeConceptDrafts = computed(() =>
  (expansionResponse.value?.generatedEntityDrafts?.compositeConcepts || []).filter(
    (draft) =>
      !collectExpressionEntityIds(draft.expression).some((id) => generatedSynonymConceptDraftIds.value.has(id)),
  ),
)
const previewSingleConcepts = computed<PreviewSingleConcept[]>(() => {
  if (generatedSingleConceptDrafts.value.length > 0) {
    return generatedSingleConceptDrafts.value.map((concept) => ({
      id: concept.id || getTitle(concept),
      title: getTitle(concept),
      description: concept.descriptions?.map(({ text }) => text).join(' — ') || '',
    }))
  }
  if (expansionResponse.value?.expansions)
    return expansionCandidates.value
      .filter((candidate) => !isSynonymCategory(candidate.category))
      .map(toPreviewSingleConcept)
  return selectedCategoryIds.value.map((categoryId) => {
    const category = selectedProfile.value?.categories?.find(({ id }) => id === categoryId)
    return {
      id: categoryId,
      title: `${conceptTitle.value} — ${categoryId}`,
      description: category?.description || t('queryExpansion.preview.categoryConcept'),
    }
  })
})
const previewSingleConceptGroups = computed<PreviewGroup<PreviewSingleConcept>[]>(() => {
  const synonymGroup = {
    id: 'synonyms',
    title: t('synonym', 2),
    concepts: synonymPreviewConcepts.value,
  }
  if (generatedSingleConceptDrafts.value.length === 0) {
    return [
      synonymGroup,
      {
        id: 'selected',
        title: t('category', 2),
        concepts: previewSingleConcepts.value,
      },
    ].filter((group) => group.concepts.length > 0)
  }

  const groups = generatedSingleConceptDrafts.value
    .filter((concept) => concept.superConcepts?.some((superConcept) => superConcept.id === props.concept.id))
    .map((categoryConcept) => ({
      id: categoryConcept.id || getTitle(categoryConcept),
      title: getTitle(categoryConcept),
      concepts: generatedSingleConceptDrafts.value
        .filter((concept) => concept.superConcepts?.some((superConcept) => superConcept.id === categoryConcept.id))
        .map(toPreviewSingleConceptDraft),
    }))
    .filter((group) => group.concepts.length > 0)

  const categoryConceptIds = new Set(groups.map((group) => group.id))
  const groupedConceptIds = new Set(groups.flatMap((group) => group.concepts.map((concept) => concept.id)))
  const ungrouped = generatedSingleConceptDrafts.value
    .filter((concept) => !categoryConceptIds.has(concept.id || getTitle(concept)))
    .filter((concept) => !groupedConceptIds.has(concept.id || getTitle(concept)))
    .map(toPreviewSingleConceptDraft)
  if (ungrouped.length > 0) {
    groups.push({ id: 'ungrouped', title: t('queryExpansion.preview.singleConcepts'), concepts: ungrouped })
  }
  return [synonymGroup, ...groups].filter((group) => group.concepts.length > 0)
})

const previewCompositeConcepts = computed<PreviewCompositeConcept[]>(() => {
  if (generatedCompositeConceptDrafts.value.length > 0) {
    return generatedCompositeConceptDrafts.value.map((concept) => ({
      id: concept.id || getTitle(concept),
      title: getTitle(concept),
      description: concept.descriptions?.map(({ text }) => text).join(' — ') || '',
      sourceCategoryIds: [],
      targetCategoryIds: [],
    }))
  }
  return relationMappings.value
    .map((mapping, index) => {
      const relation = getRelation(mapping.relationId)
      return {
        id: mapping.id,
        title: `${conceptTitle.value} — ${relation?.label || mapping.relationId} #${index + 1}`,
        description: relation?.description || t('queryExpansion.preview.relationConcept'),
        sourceCategoryIds: mapping.sourceCategoryIds,
        targetCategoryIds: mapping.targetCategoryIds,
      }
    })
    .filter(
      ({ sourceCategoryIds, targetCategoryIds }) =>
        sourceCategoryIds.length > 0 || targetCategoryIds.length > 0,
    )
})
const invalidRelationMappingCategoryCount = computed(() => getInvalidRelationMappingCategories().length)

const previewCompositeConceptGroups = computed<PreviewGroup<PreviewCompositeConcept>[]>(() => {
  const groups = new Map<string, PreviewCompositeConcept[]>()
  previewCompositeConcepts.value.forEach((concept) => {
    const relation = extractRelationLabel(concept.title)
    groups.set(relation, [...(groups.get(relation) || []), concept])
  })
  return Array.from(groups.entries()).map(([relation, concepts]) => ({
    id: relation,
    title: relation,
    concepts,
  }))
})
const hasGeneratedPreview = computed(
  () =>
    generatedSingleConceptDrafts.value.length > 0 ||
    generatedCompositeConceptDrafts.value.length > 0 ||
    synonymPreviewConcepts.value.length > 0,
)
const protectGeneratedWork = computed(() => expanding.value || saving.value || hasGeneratedPreview.value)
const backButtonLabel = computed(() => {
  if (step.value === 1) return t('cancel')
  if (step.value === 3 && hasGeneratedPreview.value) return t('queryExpansion.discardAndEditSettings')
  return t('back')
})

onMounted(() => {
  void loadProfiles()
  void loadDataSources()
})

watch(
  () => relationMappings.value.map(({ id }) => id),
  (mappingIds) => {
    if (!mappingIds.includes(activeMappingId.value)) activeMappingId.value = mappingIds[0] || ''
  },
  { immediate: true },
)

function getGeneratedSynonymConceptDraftIds(drafts: SingleConcept[]): Set<string> {
  const synonymCategoryDraftIds = new Set(
    drafts
      .filter((draft) => draft.superConcepts?.some((superConcept) => superConcept.id === props.concept.id))
      .filter((draft) => isSynonymCategory(getTitle(draft)))
      .map((draft) => draft.id)
      .filter((id): id is string => typeof id === 'string'),
  )
  const synonymDraftIds = new Set(synonymCategoryDraftIds)
  drafts
    .filter((draft) =>
      draft.superConcepts?.some(
        (superConcept) => superConcept.id && synonymCategoryDraftIds.has(superConcept.id),
      ),
    )
    .forEach((draft) => {
      if (draft.id) synonymDraftIds.add(draft.id)
    })
  return synonymDraftIds
}

function toPreviewSingleConceptDraft(concept: SingleConcept): PreviewSingleConcept {
  return {
    id: concept.id || getTitle(concept),
    title: getTitle(concept),
    description: concept.descriptions?.map(({ text }) => text).join(' — ') || '',
  }
}

function extractRelationLabel(title: string) {
  const match = title.match(/--(.+?)-->/)
  return match?.[1]?.trim() || t('queryExpansion.relations')
}

function toPreviewSingleConcept(candidate: QueryExpansionCandidate, index: number): PreviewSingleConcept {
  return {
    id: `${candidate.category || 'candidate'}-${index}-${candidate.term}`,
    title: candidate.term,
    description: [candidate.category, candidate.status, candidate.rationale].filter(Boolean).join(' — '),
  }
}

function toSynonymPreviewConcept(term: string, description = ''): PreviewSingleConcept {
  return {
    id: getSynonymDraftId(term),
    title: term,
    description,
  }
}

function getSynonymPreviewConcepts(): PreviewSingleConcept[] {
  const concepts = expansionResponse.value?.concepts || []
  const fromConcepts = concepts
    .filter((concept) => isSynonymCategory(concept.category))
    .flatMap(getConceptTerms)
    .map((term) => toSynonymPreviewConcept(term, t('synonym')))
  const fromCandidates = expansionCandidates.value
    .filter((candidate) => isSynonymCategory(candidate.category))
    .map((candidate) =>
      toSynonymPreviewConcept(
        candidate.term,
        [candidate.category, candidate.status, candidate.rationale].filter(Boolean).join(' — '),
      ),
    )
  return deduplicatePreviewConcepts([...fromConcepts, ...fromCandidates])
}

function getConceptTerms(concept: QueryExpansionConcept): string[] {
  const terms = concept.terms?.length ? concept.terms : [concept.label]
  return terms.filter((term): term is string => typeof term === 'string' && term.trim().length > 0)
}

function deduplicatePreviewConcepts(concepts: PreviewSingleConcept[]): PreviewSingleConcept[] {
  return Array.from(new Map(concepts.map((concept) => [concept.id, concept])).values())
}

function getSynonymDraftId(term: string) {
  return `synonym:${term.trim().toLocaleLowerCase()}`
}

function isSynonymCategory(category?: string) {
  const normalized = category?.trim().toLocaleLowerCase()
  return normalized === 'synonym' || normalized === 'synonyms' || normalized === 'synonyme'
}

async function loadDataSources() {
  loadingDataSources.value = true
  dataSourceLoadError.value = undefined
  try {
    if (!queryApi) throw new Error(t('queryExpansion.apiUnavailable'))
    const sources = await getApplicableConceptDataSources()
    const capabilities = await getQueryExpansionDataSourceCapabilities(sources)
    dataSourceCapabilities.value = capabilities
    selectedDataSourceId.value = capabilities.find(({ capable }) => capable)?.source.id
  } catch (e) {
    dataSourceLoadError.value = getRequestErrorMessage(e, t('queryExpansion.dataSourceLoadError'))
  } finally {
    loadingDataSources.value = false
  }
}

async function getApplicableConceptDataSources() {
  if (queryApi && entityStore.organisationId) {
    return queryApi
      .getOrganisationDataSources(entityStore.organisationId, QueryType.Concept)
      .then((response) => response.data)
  }
  return entityStore.getDataSources(QueryType.Concept)
}

async function getQueryExpansionDataSourceCapabilities(
  sources: DataSource[],
): Promise<QueryExpansionDataSourceCapability[]> {
  if (!queryExpansionApi) return sources.map((source) => ({ source, capable: false }))
  const api = queryExpansionApi
  return Promise.all(
    sources.map(async (source) => {
      try {
        await api.getDataSourceQueryExpansionConfig(source.id)
        return { source, capable: true }
      } catch (e) {
        return {
          source,
          capable: false,
          reason: getRequestErrorMessage(e, t('queryExpansion.noConfiguredDataSources')),
        }
      }
    }),
  )
}

function getDataSourceOptionLabel(source: DataSource, capable: boolean, reason?: string) {
  const label = source.title ? `${source.title} (${source.id})` : source.id
  return capable || !reason ? label : `${label} — ${reason}`
}

async function loadProfiles() {
  loadingProfiles.value = true
  profileLoadError.value = undefined
  try {
    if (!queryExpansionApi) throw new Error(t('queryExpansion.apiUnavailable'))
    const response = await queryExpansionApi.getQueryExpansionProfiles()
    profiles.value = response.data || []
    selectedProfileName.value = profiles.value[0]?.name
    if (selectedProfileName.value) await loadProfile(selectedProfileName.value)
  } catch (e) {
    profileLoadError.value = getRequestErrorMessage(e, t('queryExpansion.loadError'))
  } finally {
    loadingProfiles.value = false
  }
}

async function expandQuery() {
  if (!queryExpansionApi || !selectedDataSourceId.value) return
  expanding.value = true
  expansionError.value = undefined
  try {
    const request: QueryExpansionRequestWithMappings = {
      term: conceptTitle.value,
      sourceConceptId: props.concept.id,
      profileName: selectedProfileName.value,
      language: inferExpansionLanguage(),
      categories: selectedCategoryIds.value,
      relationMappings: relationMappings.value.map((mapping) => ({
        relationId: mapping.relationId,
        sourceCategoryIds: mapping.sourceCategoryIds,
        targetCategoryIds: mapping.targetCategoryIds,
      })),
    }
    const response = await queryExpansionApi.expandQueryForDataSource(selectedDataSourceId.value, request)
    expansionResponse.value = response.data
    selectAllGeneratedDrafts()
  } catch (e) {
    expansionError.value = getRequestErrorMessage(e, t('queryExpansion.expandError'))
    throw e
  } finally {
    expanding.value = false
  }
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  const responseData = getErrorResponseData(error)
  if (typeof responseData === 'string' && responseData.trim()) return responseData
  if (isRecord(responseData)) {
    const message = responseData.message
    if (typeof message === 'string' && message.trim()) return message
    const errorMessage = responseData.error
    if (typeof errorMessage === 'string' && errorMessage.trim()) return errorMessage
    const details = responseData.details
    if (Array.isArray(details) && details.length > 0) {
      const detailMessage = details
        .map((detail) => {
          if (!isRecord(detail)) return String(detail)
          const location = Array.isArray(detail.loc) ? detail.loc.join('.') : undefined
          const message = typeof detail.msg === 'string' ? detail.msg : undefined
          return [location, message].filter(Boolean).join(': ')
        })
        .filter(Boolean)
        .join('; ')
      if (detailMessage) return detailMessage
    }
  }
  return error instanceof Error && error.message ? error.message : fallback
}

function getErrorResponseData(error: unknown): unknown {
  if (!isRecord(error)) return undefined
  const response = error.response
  return isRecord(response) ? response.data : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function inferExpansionLanguage() {
  const profileName = selectedProfileName.value || ''
  const profileLanguage = profileName.split('_').at(-1)
  return profileLanguage && profileLanguage.length === 2 ? profileLanguage : locale.value
}

async function saveExpansionEntities() {
  const selectedIds = new Set(selectedDraftIds.value)
  const selectedCompositeDrafts = generatedCompositeConceptDrafts.value.filter(
    (draft) => draft.id && selectedIds.has(draft.id),
  )
  selectedCompositeDrafts.forEach((draft) => collectExpressionEntityIds(draft.expression).forEach((id) => selectedIds.add(id)))
  const selectedSingles = getSelectedSingleConceptDrafts(selectedIds)
  const sourceConceptWithSynonyms = createSourceConceptWithSelectedSynonyms(selectedIds)
  const drafts: Entity[] = [
    ...(sourceConceptWithSynonyms ? [sourceConceptWithSynonyms] : []),
    ...selectedSingles,
    ...groupCompositeDraftsForSave(selectedCompositeDrafts),
  ]
  if (drafts.length === 0) {
    onDialogOK()
    return
  }

  saving.value = true
  try {
    for (const draft of drafts) await entityStore.saveEntity(draft)
    onDialogOK()
  } finally {
    saving.value = false
  }
}

function selectAllGeneratedDrafts() {
  const visibleSingleDrafts = generatedSingleConceptDrafts.value.filter(
    (draft) => !draft.superConcepts?.some((superConcept) => superConcept.id === props.concept.id),
  )
  selectedDraftIds.value = [
    ...visibleSingleDrafts.map((draft) => draft.id),
    ...generatedCompositeConceptDrafts.value.map((draft) => draft.id),
    ...synonymPreviewConcepts.value.map((draft) => draft.id),
  ].filter((id): id is string => typeof id === 'string')
}

function isDraftSelected(draftId: string) {
  return selectedDraftIds.value.includes(draftId)
}

function toggleDraftSelection(draftId: string, selected: boolean) {
  selectedDraftIds.value = selected
    ? Array.from(new Set([...selectedDraftIds.value, draftId]))
    : selectedDraftIds.value.filter((id) => id !== draftId)
}

function createSourceConceptWithSelectedSynonyms(selectedIds: Set<string>): SingleConcept | undefined {
  const selectedSynonyms = synonymPreviewConcepts.value
    .filter((synonym) => selectedIds.has(synonym.id))
    .map((synonym) => synonym.title.trim())
    .filter(Boolean)
  if (selectedSynonyms.length === 0) return undefined

  const language = inferExpansionLanguage()
  const existingSynonyms = props.concept.synonyms || []
  const existingKeys = new Set(
    existingSynonyms.map(({ lang, text }) => getSynonymKey(text, lang || language)),
  )
  const newSynonyms = selectedSynonyms
    .filter((synonym) => !existingKeys.has(getSynonymKey(synonym, language)))
    .map((synonym) => ({ lang: language, text: synonym }))
  if (newSynonyms.length === 0) return undefined

  return {
    ...props.concept,
    synonyms: [...existingSynonyms, ...newSynonyms],
  }
}

function getSynonymKey(text: string | undefined, lang: string) {
  return `${lang}:${(text || '').trim().toLocaleLowerCase()}`
}

function groupCompositeDraftsForSave(drafts: CompositeConcept[]): CompositeConcept[] {
  const grouped = new Map<string, CompositeConcept[]>()
  drafts.forEach((draft) => {
    const parts = getCompositeGroupingParts(draft)
    if (!parts) {
      grouped.set(draft.id || getTitle(draft), [draft])
      return
    }
    const key = `${parts.functionId}:${parts.sourceId}:${parts.relationLabel}`
    grouped.set(key, [...(grouped.get(key) || []), draft])
  })

  return Array.from(grouped.values()).flatMap((group) => {
    const first = group[0]
    if (!first) return []
    if (group.length === 1) return [first]
    const parts = getCompositeGroupingParts(first)
    if (!parts) return [first]
    const targets = group
      .map(getCompositeGroupingParts)
      .filter((part): part is CompositeGroupingParts => part !== undefined)
    const targetExpressions: Expression[] = targets.map((target) => ({ entityId: target.targetId }))
    const targetExpression: Expression =
      targetExpressions.length === 1
        ? targetExpressions[0] || { entityId: parts.targetId }
        : { functionId: 'OR', arguments: targetExpressions }
    const expression = combineSourceAndTargetExpression(parts.functionId, parts.sourceId, targetExpression)
    const targetTitle = targets.map((target) => target.targetTitle).join(' OR ')
    const title = `${parts.sourceTitle} --${parts.relationLabel}--> ${targetTitle}`
    const groupedDraft: CompositeConcept = {
      ...first,
      id: crypto.randomUUID(),
      entityType: EntityType.CompositeConcept,
      titles: [{ lang: first.titles?.[0]?.lang || locale.value, text: title }],
      descriptions: undefined,
      expression,
    }
    return [groupedDraft]
  })
}

interface CompositeGroupingParts {
  functionId: string
  sourceId: string
  targetId: string
  sourceTitle: string
  relationLabel: string
  targetTitle: string
}

function getCompositeGroupingParts(draft: CompositeConcept): CompositeGroupingParts | undefined {
  const expression = draft.expression
  const functionId = expression.functionId
  const args = expression.arguments || []
  const sourceArg = args[0]
  const targetArg = args[1]
  const sourceId = sourceArg?.entityId
  const targetId = targetArg?.entityId
  if (!functionId || !sourceId || !targetId) return undefined
  const titleParts = parseRelationTitle(getTitle(draft))
  return {
    functionId,
    sourceId,
    targetId,
    sourceTitle: titleParts?.source || sourceId,
    relationLabel: titleParts?.relation || functionId,
    targetTitle: titleParts?.target || targetId,
  }
}

function parseRelationTitle(title: string) {
  const match = title.match(/^(.*?)\s*--(.+?)-->\s*(.*)$/)
  if (!match) return undefined
  const [, source, relation, target] = match
  if (!source || !relation || !target) return undefined
  return {
    source: source.trim(),
    relation: relation.trim(),
    target: target.trim(),
  }
}

function combineSourceAndTargetExpression(functionId: string, sourceId: string, targetExpression: Expression): Expression {
  const sourceExpression: Expression = { entityId: sourceId }
  if (functionId === 'OR') {
    return targetExpression.functionId === 'OR'
      ? { functionId: 'OR', arguments: [sourceExpression, ...(targetExpression.arguments || [])] }
      : { functionId, arguments: [sourceExpression, targetExpression] }
  }
  return { functionId, arguments: [sourceExpression, targetExpression] }
}

function collectExpressionEntityIds(expression?: Expression): string[] {
  if (!expression) return []
  return [
    ...(expression.entityId ? [expression.entityId] : []),
    ...(expression.arguments || []).flatMap(collectExpressionEntityIds),
  ]
}

function getSelectedSingleConceptDrafts(selectedIds: Set<string>) {
  const draftsById = new Map(generatedSingleConceptDrafts.value.map((draft) => [draft.id, draft]))
  const selectedSingles = generatedSingleConceptDrafts.value.filter(
    (draft) => draft.id && selectedIds.has(draft.id),
  )
  selectedSingles.forEach((draft) => {
    draft.superConcepts?.forEach((superConcept) => {
      const superDraft = draftsById.get(superConcept.id)
      if (superDraft?.id) selectedIds.add(superDraft.id)
    })
  })
  return generatedSingleConceptDrafts.value.filter((draft) => draft.id && selectedIds.has(draft.id))
}

async function loadProfile(profileName: string | null) {
  if (!profileName) return
  loadingProfile.value = true
  profileLoadError.value = undefined
  try {
    if (!queryExpansionApi) throw new Error(t('queryExpansion.apiUnavailable'))
    const response = await queryExpansionApi.getQueryExpansionProfile(profileName)
    selectedProfile.value = response.data
    mappingCounter = 0
    relationMappings.value = createProfileRelationMappings(selectedProfile.value)
    selectedCategoryIds.value = getInitialSelectedCategoryIds(selectedProfile.value, relationMappings.value)
  } catch (e) {
    profileLoadError.value = getRequestErrorMessage(e, t('queryExpansion.loadError'))
  } finally {
    loadingProfile.value = false
  }
}

function createProfileRelationMappings(profile: QueryExpansionProfile): RelationMapping[] {
  const defaultRelationIds = getDefaultRelationIds(profile)
  return (profile.relations || [])
    .filter((relation) => defaultRelationIds.includes(relation.id))
    .map((relation) => createRelationMapping(relation, profile))
}

function createRelationMapping(
  relation: QueryExpansionRelation,
  profile: QueryExpansionProfile | undefined = selectedProfile.value,
): RelationMapping {
  return {
    id: `mapping-${++mappingCounter}`,
    relationId: relation.id,
    sourceCategoryIds: getDefaultRelationCategoryIds(relation, 'source', profile),
    targetCategoryIds: getDefaultRelationCategoryIds(relation, 'target', profile),
  }
}

function getDefaultRelationIds(profile: QueryExpansionProfile): string[] {
  const profileWithDefaults = profile as QueryExpansionProfileWithDefaults
  const defaultRelationIds = profileWithDefaults.defaultRelations || profileWithDefaults.default_relations || []
  const profileRelationIds = new Set((profile.relations || []).map(({ id }) => id))
  return defaultRelationIds.filter((relationId) => profileRelationIds.has(relationId))
}

function getDefaultCategoryIds(profile: QueryExpansionProfile): string[] {
  const profileWithDefaults = profile as QueryExpansionProfileWithDefaults
  const defaultCategoryIds = profileWithDefaults.defaultCategories || profileWithDefaults.default_categories || []
  const profileCategoryIds = new Set((profile.categories || []).map(({ id }) => id))
  return defaultCategoryIds.filter((categoryId) => profileCategoryIds.has(categoryId))
}

function getDefaultRelationCategoryIds(
  relation: QueryExpansionRelation,
  role: 'source' | 'target',
  profile: QueryExpansionProfile | undefined,
): string[] {
  const defaultCategoryIds = new Set(profile ? getDefaultCategoryIds(profile) : [])
  const allowedCategoryIds = role === 'source' ? relation.sourceCategories : relation.targetCategories
  return (allowedCategoryIds || []).filter((categoryId) => defaultCategoryIds.has(categoryId))
}

function getInitialSelectedCategoryIds(
  profile: QueryExpansionProfile,
  mappings: RelationMapping[],
): string[] {
  return Array.from(
    new Set([
      ...getDefaultCategoryIds(profile),
      ...mappings.flatMap((mapping) => [
        ...mapping.sourceCategoryIds,
        ...mapping.targetCategoryIds,
      ]),
    ]),
  )
}

function getRelation(relationId: string): QueryExpansionRelation | undefined {
  return selectedProfile.value?.relations?.find(({ id }) => id === relationId)
}

function relationLabel(relationId: string) {
  const relation = getRelation(relationId)
  return relation?.label || relationId
}

function categoryLabel(categoryId: string) {
  const category = selectedProfile.value?.categories?.find(({ id }) => id === categoryId)
  return category?.label || categoryId
}

function isDefaultCategory(categoryId: string) {
  return selectedProfile.value ? getDefaultCategoryIds(selectedProfile.value).includes(categoryId) : false
}

function relationMappingCount(relationId: string) {
  return relationMappings.value.filter((mapping) => mapping.relationId === relationId).length
}

function categoryMappingCount(categoryId: string) {
  return relationMappings.value.filter(
    (mapping) =>
      mapping.sourceCategoryIds.includes(categoryId) || mapping.targetCategoryIds.includes(categoryId),
  ).length
}

function addRelationMapping(relationId: string) {
  const relation = getRelation(relationId)
  if (!relation) return
  const mapping = createRelationMapping(relation)
  relationMappings.value.push(mapping)
  activeMappingId.value = mapping.id
  selectMappingCategories(mapping)
}

function selectMappingCategories(mapping: RelationMapping) {
  ;[...mapping.sourceCategoryIds, ...mapping.targetCategoryIds].forEach((categoryId) =>
    toggleCategory(categoryId, true),
  )
}

function removeRelationMapping(mappingId: string) {
  relationMappings.value = relationMappings.value.filter(({ id }) => id !== mappingId)
}

function changeMappingWithWheel(event: WheelEvent) {
  if (relationMappings.value.length < 2) return

  if (mappingWheelUnlockTimer) {
    clearTimeout(mappingWheelUnlockTimer)
    mappingWheelUnlockTimer = setTimeout(() => {
      mappingWheelUnlockTimer = undefined
    }, 180)
    return
  }

  const currentIndex = relationMappings.value.findIndex(({ id }) => id === activeMappingId.value)
  const direction = event.deltaY > 0 ? 1 : -1
  const nextIndex = Math.min(
    relationMappings.value.length - 1,
    Math.max(0, currentIndex + direction),
  )
  activeMappingId.value = relationMappings.value[nextIndex]?.id || activeMappingId.value
  mappingWheelUnlockTimer = setTimeout(() => {
    mappingWheelUnlockTimer = undefined
  }, 180)
}

function startRelationDrag(relationId: string) {
  draggedRelationId.value = relationId
}

function dropRelationMapping() {
  if (!draggedRelationId.value) return
  addRelationMapping(draggedRelationId.value)
  draggedRelationId.value = undefined
}

function startCategoryDrag(categoryId: string) {
  draggedCategoryId.value = categoryId
}

function dropCategory(mappingId: string, role: 'source' | 'target') {
  if (!draggedCategoryId.value) return
  addMappingCategory(mappingId, role, draggedCategoryId.value)
  draggedCategoryId.value = undefined
}

function addMappingCategory(mappingId: string, role: 'source' | 'target', categoryId: string) {
  const mapping = relationMappings.value.find(({ id }) => id === mappingId)
  if (!mapping) return

  const categoryIds = role === 'source' ? mapping.sourceCategoryIds : mapping.targetCategoryIds
  if (!categoryIds.includes(categoryId)) categoryIds.push(categoryId)
  toggleCategory(categoryId, true)
}

function isMappingCategoryAllowed(
  mapping: RelationMapping,
  role: 'source' | 'target',
  categoryId: string,
) {
  const relation = getRelation(mapping.relationId)
  const allowedCategoryIds = role === 'source' ? relation?.sourceCategories : relation?.targetCategories
  return allowedCategoryIds?.includes(categoryId) ?? false
}

function getMappingCategoryColor(
  mapping: RelationMapping,
  role: 'source' | 'target',
  categoryId: string,
  fallbackColor: string,
) {
  return isMappingCategoryAllowed(mapping, role, categoryId) ? fallbackColor : 'negative'
}

function getInvalidRelationMappingCategories() {
  return relationMappings.value.flatMap((mapping) => [
    ...mapping.sourceCategoryIds
      .filter((categoryId) => !isMappingCategoryAllowed(mapping, 'source', categoryId))
      .map((categoryId) => ({ mapping, role: 'source' as const, categoryId })),
    ...mapping.targetCategoryIds
      .filter((categoryId) => !isMappingCategoryAllowed(mapping, 'target', categoryId))
      .map((categoryId) => ({ mapping, role: 'target' as const, categoryId })),
  ])
}

function removeMappingCategory(mappingId: string, role: 'source' | 'target', categoryId: string) {
  const mapping = relationMappings.value.find(({ id }) => id === mappingId)
  if (!mapping) return
  const key = role === 'source' ? 'sourceCategoryIds' : 'targetCategoryIds'
  mapping[key] = mapping[key].filter((id) => id !== categoryId)
}

function toggleCategory(categoryId: string, checked?: boolean) {
  const isSelected = selectedCategoryIds.value.includes(categoryId)
  const shouldSelect = checked ?? !isSelected
  if (shouldSelect && !isSelected) selectedCategoryIds.value.push(categoryId)
  if (!shouldSelect && isSelected) {
    selectedCategoryIds.value = selectedCategoryIds.value.filter((id) => id !== categoryId)
    relationMappings.value.forEach((mapping) => {
      mapping.sourceCategoryIds = mapping.sourceCategoryIds.filter((id) => id !== categoryId)
      mapping.targetCategoryIds = mapping.targetCategoryIds.filter((id) => id !== categoryId)
    })
  }
}

function onCancelClick() {
  if (step.value === 1) {
    void requestDialogCancel()
    return
  }
  if (step.value === 3 && hasGeneratedPreview.value) {
    void confirmDiscardGeneratedPreview().then((confirmed) => {
      if (!confirmed) return
      clearGeneratedPreview()
      stepper.value?.previous()
    })
    return
  }
  stepper.value?.previous()
}

async function requestDialogCancel() {
  if (protectGeneratedWork.value && !(await confirmDiscardGeneratedPreview())) return
  onDialogCancel()
}

function confirmDiscardGeneratedPreview(): Promise<boolean> {
  return new Promise((resolve) => {
    $q.dialog({
      title: t('queryExpansion.discardPreviewTitle'),
      message: t('queryExpansion.discardPreviewMessage'),
      cancel: {
        label: t('queryExpansion.stayOnPreview'),
        flat: true,
      },
      ok: {
        label: t('queryExpansion.discardPreviewConfirm'),
        color: 'negative',
        flat: true,
      },
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false))
  })
}

function clearGeneratedPreview() {
  expansionResponse.value = undefined
  selectedDraftIds.value = []
  expansionError.value = undefined
}

function onContinueClick() {
  if (step.value === 1) {
    stepper.value?.next()
    return
  }
  if (step.value === 2) {
    void continueFromSemanticReview()
    return
  }
  void saveExpansionEntities().catch(() => undefined)
}

async function continueFromSemanticReview() {
  if (invalidRelationMappingCategoryCount.value > 0 && !(await confirmUnsupportedRelationMappings())) {
    return
  }
  await expandQuery().then(() => stepper.value?.next()).catch(() => undefined)
}

function confirmUnsupportedRelationMappings(): Promise<boolean> {
  return new Promise((resolve) => {
    $q.dialog({
      title: t('queryExpansion.unsupportedMappingTitle'),
      message: t('queryExpansion.unsupportedMappingMessage', {
        count: invalidRelationMappingCategoryCount.value,
      }),
      cancel: {
        label: t('cancel'),
        flat: true,
      },
      ok: {
        label: t('continue'),
        color: 'warning',
        flat: true,
      },
      persistent: true,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false))
  })
}
</script>

<style lang="scss">
.query-expansion-dialog {
  min-width: min(1100px, 95vw);
  max-width: 95vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}

.query-expansion-stepper {
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}

.query-expansion-stepper .q-stepper__content {
  overflow: hidden;
}

.query-expansion-stepper .q-stepper__step-content {
  overflow-x: hidden;
  overflow-y: auto;
}

.compact-stepper-navigation {
  margin-top: 0;
  padding: 0.375rem 0.5rem !important;
}

.semantic-catalog-scroll-box {
  height: 19rem;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.semantic-mapping-row {
  height: 13rem;
}

.mapping-drop-zone,
.mapping-carousel-section {
  height: 100%;
}

.mapping-carousel-section {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.mapping-carousel {
  flex: 1 1 auto;
  min-height: 0;
  background: transparent;
}

.mapping-carousel-slide {
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: 2rem !important;
}

.mapping-carousel .q-carousel__navigation--bottom {
  bottom: 0.125rem;
}

.mapping-carousel .q-carousel__navigation .q-btn {
  min-width: 1rem;
  min-height: 1rem;
  margin: 0 0.0625rem;
  padding: 0;
}

.mapping-carousel .q-carousel__navigation .q-icon {
  font-size: 0.5rem;
}

.preview-scroll-box {
  max-height: min(28rem, calc(92vh - 18rem));
  overflow-y: auto;
}

.mapping-drop-zone {
  min-height: 0;
}

.relation-review-item,
.category-review-item {
  width: calc(100% - 0.5rem);
  min-height: 4rem;
  padding: 0;
  border: 1px solid $grey-5;
  border-left-width: 4px;
  border-radius: 6px;
  cursor: grab;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.relation-review-item > .q-item__section--main {
  padding: 0.625rem 0.5rem 0.625rem 0.75rem;
}

.relation-review-item > .q-item__section--side {
  padding-right: 0.75rem;
}

.category-review-item > .q-item__section--avatar {
  padding-left: 0.75rem;
}

.category-review-item > .q-item__section--main {
  padding: 0.625rem 0.5rem;
}

.category-review-item > .q-item__section--side {
  padding-right: 0.75rem;
}

.relation-review-item:active,
.category-review-item:active {
  cursor: grabbing;
}

.relation-review-item--mapped {
  border-color: $primary;
  background: rgba($primary, 0.12);
}

.relation-review-item--inactive {
  border-color: $grey-6;
  background: $grey-2;
}

.category-review-item--mapped {
  border-color: $primary;
  background: rgba($primary, 0.12);
}

.category-review-item--selected {
  border-color: $grey-6;
  border-left-color: $primary;
  background: rgba($primary, 0.05);
}

.category-review-item--inactive {
  border-color: $grey-6;
  background: $grey-2;
}

.category-review-status {
  margin-top: 0.125rem;
  font-weight: 500;
}

.body--dark .relation-review-item--inactive,
.body--dark .category-review-item--inactive {
  background: $grey-9;
}

.relation-role-drop-zone {
  min-height: 4rem;
  border: 1px dashed $grey-5;
  border-radius: 4px;
  padding: 0.375rem;
}

.source-zone {
  background: rgba($secondary, 0.08);
}

.target-zone {
  background: rgba($accent, 0.08);
}

@media (max-width: 1023px) {
  .semantic-catalog-row > div {
    margin-bottom: 0.75rem;
  }

  .semantic-catalog-scroll-box {
    height: 18rem;
  }

  .semantic-mapping-row {
    height: 16rem;
  }
}
</style>
