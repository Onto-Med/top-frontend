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
                <q-item-label header>{{ t('queryExpansion.categories') }}</q-item-label>
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
                  :active="isCategoryConnected(category.id)"
                  active-class="bg-blue-1 text-primary"
                >
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
                        v-if="selectedRelation?.sourceCategories?.includes(category.id)"
                        color="secondary"
                        class="q-ml-sm"
                      >
                        {{ t('queryExpansion.source') }}
                      </q-badge>
                      <q-badge
                        v-if="selectedRelation?.targetCategories?.includes(category.id)"
                        color="accent"
                        class="q-ml-sm"
                      >
                        {{ t('queryExpansion.target') }}
                      </q-badge>
                    </q-item-label>
                    <q-item-label caption>{{ category.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="col-12 col-md-6">
              <q-list bordered separator>
                <q-item-label header>{{ t('queryExpansion.relations') }}</q-item-label>
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
                  <q-item-section>
                    <q-item-label>{{ relation.label || relation.id }}</q-item-label>
                    <q-item-label v-if="relation.description" caption>
                      {{ relation.description }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ t('queryExpansion.sourceCategories') }}:
                      <q-chip
                        v-for="categoryId in relation.sourceCategories"
                        :key="`${relation.id}-source-${categoryId}`"
                        dense
                        size="sm"
                        color="secondary"
                        text-color="white"
                      >
                        {{ categoryId }}
                      </q-chip>
                      <span v-if="!relation.sourceCategories?.length">-</span>
                    </q-item-label>
                    <q-item-label caption>
                      {{ t('queryExpansion.targetCategories') }}:
                      <q-chip
                        v-for="categoryId in relation.targetCategories"
                        :key="`${relation.id}-target-${categoryId}`"
                        dense
                        size="sm"
                        color="accent"
                        text-color="white"
                      >
                        {{ categoryId }}
                      </q-chip>
                      <span v-if="!relation.targetCategories?.length">-</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-step>

        <q-step :name="3" :title="t('queryExpansion.steps.preview')" icon="account_tree">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle2 q-mb-sm">{{ t('queryExpansion.placeholder.generatedEntities') }}</div>
              <div class="text-caption text-grey-7">
                {{ t('queryExpansion.placeholder.generatedEntitiesCaption') }}
              </div>
            </q-card-section>
          </q-card>
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
const selectedRelationId = ref<string>()

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
    selectedRelationId.value = selectedProfile.value?.relations?.[0]?.id
  } catch (e) {
    profileLoadError.value = e instanceof Error ? e.message : t('queryExpansion.loadError')
  } finally {
    loadingProfile.value = false
  }
}

function isCategoryConnected(categoryId: string) {
  return (
    selectedRelation.value?.sourceCategories?.includes(categoryId) ||
    selectedRelation.value?.targetCategories?.includes(categoryId)
  )
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
