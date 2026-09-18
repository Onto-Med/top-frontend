<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="query-expansion-dialog">
      <q-stepper ref="stepper" v-model="step" active-icon="none" active-color="primary" animated>
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
          />
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
            <div class="col-12 col-md-6">
              <q-list bordered separator>
                <q-item-label header>
                  <div class="row items-center justify-between">
                    <span>{{ t('queryExpansion.relations') }}</span>
                    <span class="text-caption text-grey-7">
                      {{ selectedRelationIds.length }}/{{ selectedProfile?.relations?.length || 0 }}
                    </span>
                  </div>
                </q-item-label>
                <q-item v-if="loadingProfile">
                  <q-item-section>
                    <q-spinner size="sm" />
                  </q-item-section>
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
                  :active="selectedRelation?.id === relation.id"
                  active-class="bg-blue-1 text-primary"
                  @click="selectedRelationId = relation.id"
                >
                  <q-item-section side top>
                    <q-checkbox
                      :model-value="selectedRelationIds.includes(relation.id)"
                      @update:model-value="toggleRelation(relation.id, Boolean($event))"
                      @click.stop
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ relation.label || relation.id }}</q-item-label>
                    <q-item-label v-if="relation.description" caption>
                      {{ relation.description }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ t('queryExpansion.sourceCategories') }}:
                      <q-chip
                        v-for="categoryId in getRelationSelection(relation.id).sourceCategoryIds"
                        :key="`${relation.id}-source-${categoryId}`"
                        dense
                        size="sm"
                        color="secondary"
                        text-color="white"
                      >
                        {{ categoryId }}
                      </q-chip>
                      <span v-if="!getRelationSelection(relation.id).sourceCategoryIds.length">-</span>
                    </q-item-label>
                    <q-item-label caption>
                      {{ t('queryExpansion.targetCategories') }}:
                      <q-chip
                        v-for="categoryId in getRelationSelection(relation.id).targetCategoryIds"
                        :key="`${relation.id}-target-${categoryId}`"
                        dense
                        size="sm"
                        color="accent"
                        text-color="white"
                      >
                        {{ categoryId }}
                      </q-chip>
                      <span v-if="!getRelationSelection(relation.id).targetCategoryIds.length">-</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="col-12 col-md-6">
              <q-list bordered separator>
                <q-item-label header>
                  <div class="row items-center justify-between">
                    <span>{{ t('queryExpansion.categories') }}</span>
                    <span class="text-caption text-grey-7">
                      {{ selectedCategoryIds.length }}/{{ selectedProfile?.categories?.length || 0 }}
                    </span>
                  </div>
                </q-item-label>
                <q-item v-if="loadingProfile">
                  <q-item-section>
                    <q-spinner size="sm" />
                  </q-item-section>
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
                  :active="isCategoryConnected(category.id)"
                  active-class="bg-blue-1 text-primary"
                  @click="toggleCategory(category.id)"
                >
                  <q-item-section side top>
                    <q-checkbox
                      :model-value="selectedCategoryIds.includes(category.id)"
                      @update:model-value="toggleCategory(category.id, Boolean($event))"
                      @click.stop
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ category.id }}
                      <q-badge
                        v-if="selectedProfile?.defaultCategories?.includes(category.id)"
                        color="primary"
                        class="q-ml-sm"
                      >
                        {{ t('queryExpansion.defaultCategory') }}
                      </q-badge>
                      <q-badge
                        v-if="isSelectedRelationSource(category.id)"
                        color="secondary"
                        class="q-ml-sm"
                      >
                        {{ t('queryExpansion.source') }}
                      </q-badge>
                      <q-badge
                        v-if="isSelectedRelationTarget(category.id)"
                        color="accent"
                        class="q-ml-sm"
                      >
                        {{ t('queryExpansion.target') }}
                      </q-badge>
                    </q-item-label>
                    <q-item-label caption>{{ category.description }}</q-item-label>
                    <div v-if="selectedRelation" class="row q-col-gutter-sm q-mt-xs">
                      <div class="col-auto">
                        <q-checkbox
                          dense
                          :disable="!selectedRelation.sourceCategories?.includes(category.id)"
                          :model-value="isSelectedRelationSource(category.id)"
                          :label="t('queryExpansion.source')"
                          @update:model-value="toggleRelationCategory('source', category.id, Boolean($event))"
                          @click.stop
                        />
                      </div>
                      <div class="col-auto">
                        <q-checkbox
                          dense
                          :disable="!selectedRelation.targetCategories?.includes(category.id)"
                          :model-value="isSelectedRelationTarget(category.id)"
                          :label="t('queryExpansion.target')"
                          @update:model-value="toggleRelationCategory('target', category.id, Boolean($event))"
                          @click.stop
                        />
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-step>

        <q-step :name="3" :title="t('queryExpansion.steps.preview')" icon="account_tree">
          <q-banner rounded class="bg-grey-2 text-grey-9 q-mb-md">
            {{ t('queryExpansion.placeholder.generatedEntitiesCaption') }}
          </q-banner>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">
                    {{ t('queryExpansion.preview.singleConcepts') }}
                  </div>
                  <q-list dense separator>
                    <q-item>
                      <q-item-section side>
                        <q-icon name="article" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ conceptTitle }}</q-item-label>
                        <q-item-label caption>{{ t('queryExpansion.preview.sourceConcept') }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-for="concept in previewSingleConcepts" :key="concept.id">
                      <q-item-section side>
                        <q-icon name="label" color="secondary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ concept.title }}</q-item-label>
                        <q-item-label caption>{{ concept.description }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="previewSingleConcepts.length === 0">
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
                  <q-list dense separator>
                    <q-item v-for="composite in previewCompositeConcepts" :key="composite.id">
                      <q-item-section side top>
                        <q-icon name="account_tree" color="accent" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ composite.title }}</q-item-label>
                        <q-item-label caption>{{ composite.description }}</q-item-label>
                        <div class="q-mt-xs">
                          <q-chip
                            v-for="source in composite.sourceCategoryIds"
                            :key="`${composite.id}-source-${source}`"
                            dense
                            size="sm"
                            color="secondary"
                            text-color="white"
                          >
                            {{ t('queryExpansion.source') }}: {{ source }}
                          </q-chip>
                          <q-chip
                            v-for="target in composite.targetCategoryIds"
                            :key="`${composite.id}-target-${target}`"
                            dense
                            size="sm"
                            color="accent"
                            text-color="white"
                          >
                            {{ t('queryExpansion.target') }}: {{ target }}
                          </q-chip>
                        </div>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="previewCompositeConcepts.length === 0">
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
              :label="step < 3 ? t('continue') : t('close')"
              @click="onContinueClick"
            />
          </q-stepper-navigation>
        </template>
      </q-stepper>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { QStepper, useDialogPluginComponent } from 'quasar'
import { SingleConcept, type QueryExpansionProfile } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { QueryApiKey } from 'src/boot/axios'

interface RelationCategorySelection {
  sourceCategoryIds: string[]
  targetCategoryIds: string[]
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

const props = defineProps({
  concept: {
    type: Object as () => SingleConcept,
    required: true,
  },
})

defineEmits(['hide', 'ok'])

const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { getTitle } = useEntityFormatter()
const queryApi = inject(QueryApiKey)
const stepper = ref<QStepper>()
const step = ref(1)
const profiles = ref<QueryExpansionProfile[]>([])
const selectedProfile = ref<QueryExpansionProfile>()
const selectedProfileName = ref<string>()
const loadingProfiles = ref(false)
const loadingProfile = ref(false)
const profileLoadError = ref<string>()
const selectedCategoryIds = ref<string[]>([])
const selectedRelationIds = ref<string[]>([])
const selectedRelationId = ref<string>()
const relationCategorySelections = ref<Record<string, RelationCategorySelection>>({})

const conceptTitle = computed(() => getTitle(props.concept))
const selectedRelation = computed(() =>
  selectedProfile.value?.relations?.find((relation) => relation.id === selectedRelationId.value),
)
const profileOptions = computed(() =>
  profiles.value.map((profile) => ({
    label: profile.languageName ? `${profile.name} (${profile.languageName})` : profile.name,
    value: profile.name,
  })),
)
const previewSingleConcepts = computed<PreviewSingleConcept[]>(() =>
  selectedCategoryIds.value.map((categoryId) => {
    const category = selectedProfile.value?.categories?.find(({ id }) => id === categoryId)
    return {
      id: categoryId,
      title: `${conceptTitle.value} — ${categoryId}`,
      description: category?.description || t('queryExpansion.preview.categoryConcept'),
    }
  }),
)
const previewCompositeConcepts = computed<PreviewCompositeConcept[]>(() =>
  selectedRelationIds.value
    .map((relationId) => {
      const relation = selectedProfile.value?.relations?.find(({ id }) => id === relationId)
      const selection = getRelationSelection(relationId)
      return {
        id: relationId,
        title: `${conceptTitle.value} — ${relation?.label || relationId}`,
        description: relation?.description || t('queryExpansion.preview.relationConcept'),
        sourceCategoryIds: selection.sourceCategoryIds,
        targetCategoryIds: selection.targetCategoryIds,
      }
    })
    .filter(
      ({ sourceCategoryIds, targetCategoryIds }) =>
        sourceCategoryIds.length > 0 || targetCategoryIds.length > 0,
    ),
)

onMounted(() => {
  void loadProfiles()
})

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
    profileLoadError.value = e instanceof Error ? e.message : t('queryExpansion.loadError')
  } finally {
    loadingProfiles.value = false
  }
}

async function loadProfile(profileName: string | null) {
  if (!profileName) return
  loadingProfile.value = true
  profileLoadError.value = undefined
  try {
    if (!queryApi) throw new Error(t('queryExpansion.apiUnavailable'))
    const response = await queryApi.getQueryExpansionProfile(profileName)
    selectedProfile.value = response.data
    selectedCategoryIds.value = selectedProfile.value.defaultCategories?.length
      ? [...selectedProfile.value.defaultCategories]
      : selectedProfile.value.categories?.map((category) => category.id) || []
    selectedRelationIds.value = selectedProfile.value.relations?.map((relation) => relation.id) || []
    relationCategorySelections.value = Object.fromEntries(
      (selectedProfile.value.relations || []).map((relation) => [
        relation.id,
        {
          sourceCategoryIds: (relation.sourceCategories || []).filter((categoryId) =>
            selectedCategoryIds.value.includes(categoryId),
          ),
          targetCategoryIds: (relation.targetCategories || []).filter((categoryId) =>
            selectedCategoryIds.value.includes(categoryId),
          ),
        },
      ]),
    )
    selectedRelationId.value = selectedProfile.value?.relations?.[0]?.id
  } catch (e) {
    profileLoadError.value = e instanceof Error ? e.message : t('queryExpansion.loadError')
  } finally {
    loadingProfile.value = false
  }
}

function getRelationSelection(relationId: string): RelationCategorySelection {
  if (!relationCategorySelections.value[relationId])
    relationCategorySelections.value[relationId] = { sourceCategoryIds: [], targetCategoryIds: [] }
  return relationCategorySelections.value[relationId]
}

function isSelectedRelationSource(categoryId: string) {
  if (!selectedRelationId.value) return false
  return getRelationSelection(selectedRelationId.value).sourceCategoryIds.includes(categoryId)
}

function isSelectedRelationTarget(categoryId: string) {
  if (!selectedRelationId.value) return false
  return getRelationSelection(selectedRelationId.value).targetCategoryIds.includes(categoryId)
}

function isCategoryConnected(categoryId: string) {
  return isSelectedRelationSource(categoryId) || isSelectedRelationTarget(categoryId)
}

function toggleCategory(categoryId: string, checked?: boolean) {
  const isSelected = selectedCategoryIds.value.includes(categoryId)
  const shouldSelect = checked ?? !isSelected
  if (shouldSelect && !isSelected) selectedCategoryIds.value.push(categoryId)
  if (!shouldSelect && isSelected) {
    selectedCategoryIds.value = selectedCategoryIds.value.filter((id) => id !== categoryId)
    Object.values(relationCategorySelections.value).forEach((selection) => {
      selection.sourceCategoryIds = selection.sourceCategoryIds.filter((id) => id !== categoryId)
      selection.targetCategoryIds = selection.targetCategoryIds.filter((id) => id !== categoryId)
    })
  }
}

function toggleRelation(relationId: string, checked?: boolean) {
  const isSelected = selectedRelationIds.value.includes(relationId)
  const shouldSelect = checked ?? !isSelected
  if (shouldSelect && !isSelected) selectedRelationIds.value.push(relationId)
  if (!shouldSelect && isSelected)
    selectedRelationIds.value = selectedRelationIds.value.filter((id) => id !== relationId)
}

function toggleRelationCategory(role: 'source' | 'target', categoryId: string, checked: boolean) {
  if (!selectedRelation.value || !selectedRelationId.value) return
  const allowedCategories =
    role === 'source' ? selectedRelation.value.sourceCategories : selectedRelation.value.targetCategories
  if (!allowedCategories?.includes(categoryId)) return

  const selection = getRelationSelection(selectedRelationId.value)
  const key = role === 'source' ? 'sourceCategoryIds' : 'targetCategoryIds'
  const isSelected = selection[key].includes(categoryId)

  if (checked && !isSelected) selection[key].push(categoryId)
  if (!checked && isSelected) selection[key] = selection[key].filter((id) => id !== categoryId)
  if (checked) {
    toggleCategory(categoryId, true)
    toggleRelation(selectedRelationId.value, true)
  }
}

function onCancelClick() {
  if (step.value === 1) onDialogCancel()
  else stepper.value?.previous()
}

function onContinueClick() {
  if (step.value < 3) stepper.value?.next()
  else onDialogOK()
}
</script>

<style lang="scss">
.query-expansion-dialog {
  min-width: 640px;
  max-width: 900px;
}
</style>
