<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
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
            class="q-mb-md"
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

          <q-card v-if="selectedProfile" flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-subtitle2">{{ selectedProfile.name }}</div>
              <div v-if="selectedProfile.languageName" class="text-caption text-grey-7">
                {{ t('language') }}: {{ selectedProfile.languageName }}
              </div>
            </q-card-section>
          </q-card>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-list bordered separator class="semantic-scroll-box">
                <q-item-label header>{{ t('queryExpansion.relations') }}</q-item-label>
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
                  draggable="true"
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

            <div class="col-12 col-md-3">
              <q-list bordered separator class="semantic-scroll-box">
                <q-item-label header>{{ t('category', 2) }}</q-item-label>
                <q-item v-if="loadingProfile">
                  <q-item-section><q-spinner size="sm" /></q-item-section>
                </q-item>
                <q-item v-else-if="!selectedProfile?.categories?.length">
                  <q-item-section>
                    <q-item-label caption>{{ t('queryExpansion.noCategories') }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-for="category in selectedProfile?.categories" :key="category.id">
                  <q-item-section>
                    <div>
                      <q-chip
                        draggable="true"
                        clickable
                        :outline="!selectedCategoryIds.includes(category.id)"
                        color="primary"
                        text-color="white"
                        @dragstart="startCategoryDrag(category.id)"
                        @click="toggleCategory(category.id)"
                      >
                        {{ categoryLabel(category.id) }}
                      </q-chip>
                      <q-badge
                        v-if="selectedProfile?.defaultCategories?.includes(category.id)"
                        color="primary"
                        class="q-ml-xs"
                      >
                        {{ t('queryExpansion.defaultCategory') }}
                      </q-badge>
                    </div>
                    <q-item-label caption>
                      <span class="text-weight-medium">{{ category.id }}</span>
                      <span v-if="category.description"> — {{ category.description }}</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="col-12 col-md-6">
              <q-card
                flat
                bordered
                class="mapping-drop-zone semantic-scroll-box"
                @dragover.prevent
                @drop="dropRelationMapping"
              >
                <q-card-section>
                  <div class="row items-center justify-between q-mb-sm">
                    <div class="text-subtitle2">{{ t('mapping', 2) }}</div>
                    <div class="text-caption text-grey-7">
                      {{ relationMappings.length }} {{ t('mapping', relationMappings.length) }}
                    </div>
                  </div>

                  <q-banner v-if="relationMappings.length === 0" rounded class="bg-grey-2 text-grey-9">
                    {{ t('queryExpansion.noMappings') }}
                  </q-banner>

                  <q-card
                    v-for="mapping in relationMappings"
                    :key="mapping.id"
                    flat
                    bordered
                    class="q-mb-md"
                  >
                    <q-card-section>
                      <div class="row items-start justify-between q-mb-sm">
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
                              color="secondary"
                              text-color="white"
                              @remove="removeMappingCategory(mapping.id, 'source', categoryId)"
                            >
                              {{ categoryLabel(categoryId) }}
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
                              color="accent"
                              text-color="white"
                              @remove="removeMappingCategory(mapping.id, 'target', categoryId)"
                            >
                              {{ categoryLabel(categoryId) }}
                            </q-chip>
                            <div v-if="mapping.targetCategoryIds.length === 0" class="text-caption text-grey-7">
                              {{ t('queryExpansion.dropTargetCategories') }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
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
          <q-stepper-navigation class="q-mt-md">
            <q-btn
              flat
              :label="step === 1 ? t('cancel') : t('back')"
              color="primary"
              @click="onCancelClick"
            />
            <q-btn
              flat
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
import { computed, inject, onMounted, ref } from 'vue'
import { QStepper, useDialogPluginComponent } from 'quasar'
import {
  EntityType,
  QueryType,
  type CompositeConcept,
  type DataSource,
  type Entity,
  type QueryExpansionCandidate,
  type QueryExpansionProfile,
  type QueryExpansionRelation,
  type Expression,
  type QueryExpansionRequest,
  type QueryExpansionResponse,
  type SingleConcept,
} from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { QueryApiKey } from 'src/boot/axios'
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
  defaultRelations?: string[]
  default_relations?: string[]
}

type QueryExpansionRequestWithMappings = QueryExpansionRequest & {
  sourceConceptId?: string
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
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { getTitle } = useEntityFormatter()
const entityStore = useEntityStore()
const queryApi = inject(QueryApiKey)
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
const draggedRelationId = ref<string>()
const draggedCategoryId = ref<string>()
let mappingCounter = 0

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
const generatedSingleConceptDrafts = computed(
  () => expansionResponse.value?.generatedEntityDrafts?.singleConcepts || [],
)
const generatedCompositeConceptDrafts = computed(
  () => expansionResponse.value?.generatedEntityDrafts?.compositeConcepts || [],
)
const previewSingleConcepts = computed<PreviewSingleConcept[]>(() => {
  if (generatedSingleConceptDrafts.value.length > 0) {
    return generatedSingleConceptDrafts.value.map((concept) => ({
      id: concept.id || getTitle(concept),
      title: getTitle(concept),
      description: concept.descriptions?.map(({ text }) => text).join(' — ') || '',
    }))
  }
  if (expansionResponse.value?.expansions) return expansionCandidates.value.map(toPreviewSingleConcept)
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
  if (generatedSingleConceptDrafts.value.length === 0) {
    return [
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
  return groups
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

onMounted(() => {
  void loadProfiles()
  void loadDataSources()
})

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
  if (!queryApi) return sources.map((source) => ({ source, capable: false }))
  return Promise.all(
    sources.map(async (source) => {
      try {
        await queryApi.getDataSourceQueryExpansionConfig(source.id)
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
    if (!queryApi) throw new Error(t('queryExpansion.apiUnavailable'))
    const response = await queryApi.getQueryExpansionProfiles()
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
  if (!queryApi || !selectedDataSourceId.value) return
  expanding.value = true
  expansionError.value = undefined
  try {
    const request: QueryExpansionRequestWithMappings = {
      term: conceptTitle.value,
      sourceConceptId: props.concept.id,
      language: inferExpansionLanguage(),
      categories: selectedCategoryIds.value,
      relationMappings: relationMappings.value.map((mapping) => ({
        relationId: mapping.relationId,
        sourceCategoryIds: mapping.sourceCategoryIds,
        targetCategoryIds: mapping.targetCategoryIds,
      })),
    }
    const response = await queryApi.expandQueryForDataSource(selectedDataSourceId.value, request)
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
  const drafts: Entity[] = [
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
    ...visibleSingleDrafts,
    ...generatedCompositeConceptDrafts.value,
  ]
    .map((draft) => draft.id)
    .filter((id): id is string => typeof id === 'string')
}

function isDraftSelected(draftId: string) {
  return selectedDraftIds.value.includes(draftId)
}

function toggleDraftSelection(draftId: string, selected: boolean) {
  selectedDraftIds.value = selected
    ? Array.from(new Set([...selectedDraftIds.value, draftId]))
    : selectedDraftIds.value.filter((id) => id !== draftId)
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
    if (!queryApi) throw new Error(t('queryExpansion.apiUnavailable'))
    const response = await queryApi.getQueryExpansionProfile(profileName)
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
    .filter(
      (relation) =>
        (relation.sourceCategories && relation.sourceCategories.length > 0) ||
        (relation.targetCategories && relation.targetCategories.length > 0),
    )
    .map((relation) => ({
      id: `mapping-${++mappingCounter}`,
      relationId: relation.id,
      sourceCategoryIds: [...(relation.sourceCategories || [])],
      targetCategoryIds: [...(relation.targetCategories || [])],
    }))
}

function getDefaultRelationIds(profile: QueryExpansionProfile): string[] {
  const profileWithDefaults = profile as QueryExpansionProfileWithDefaults
  const defaultRelationIds = profileWithDefaults.defaultRelations || profileWithDefaults.default_relations || []
  const profileRelationIds = new Set((profile.relations || []).map(({ id }) => id))
  return defaultRelationIds.filter((relationId) => profileRelationIds.has(relationId))
}

function getInitialSelectedCategoryIds(
  profile: QueryExpansionProfile,
  mappings: RelationMapping[],
): string[] {
  return Array.from(
    new Set([
      ...(profile.defaultCategories?.length
        ? profile.defaultCategories
        : profile.categories?.map((category) => category.id) || []),
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

function relationMappingCount(relationId: string) {
  return relationMappings.value.filter((mapping) => mapping.relationId === relationId).length
}

function addRelationMapping(relationId: string) {
  if (!getRelation(relationId)) return
  relationMappings.value.push({
    id: `mapping-${++mappingCounter}`,
    relationId,
    sourceCategoryIds: [],
    targetCategoryIds: [],
  })
}

function removeRelationMapping(mappingId: string) {
  relationMappings.value = relationMappings.value.filter(({ id }) => id !== mappingId)
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
  const relation = getRelation(mapping.relationId)
  const allowedCategoryIds = role === 'source' ? relation?.sourceCategories : relation?.targetCategories
  if (!allowedCategoryIds?.includes(categoryId)) return

  const categoryIds = role === 'source' ? mapping.sourceCategoryIds : mapping.targetCategoryIds
  if (!categoryIds.includes(categoryId)) categoryIds.push(categoryId)
  toggleCategory(categoryId, true)
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
  if (step.value === 1) onDialogCancel()
  else stepper.value?.previous()
}

function onContinueClick() {
  if (step.value === 1) {
    stepper.value?.next()
    return
  }
  if (step.value === 2) {
    void expandQuery().then(() => stepper.value?.next()).catch(() => undefined)
    return
  }
  void saveExpansionEntities().catch(() => undefined)
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
  overflow: hidden;
}

.semantic-scroll-box {
  max-height: min(30rem, calc(92vh - 18rem));
  overflow-y: auto;
}

.preview-scroll-box {
  max-height: min(28rem, calc(92vh - 18rem));
  overflow-y: auto;
}

.mapping-drop-zone {
  min-height: 18rem;
}

.relation-role-drop-zone {
  min-height: 5rem;
  border: 1px dashed $grey-5;
  border-radius: 4px;
  padding: 0.5rem;
}

.source-zone {
  background: rgba($secondary, 0.08);
}

.target-zone {
  background: rgba($accent, 0.08);
}
</style>
