<template>
  <div class="column fit">
    <div class="col-auto entity-editor-tab-header">
      <q-toolbar class="q-gutter-sm">
        <q-toolbar-title class="text-subtitle1 ellipsis">
          {{ getTitle(local) }}
          <small v-if="!isNew" :class="{'text-accent': isOtherVersion }" :title="isOtherVersion ? t('displayingOtherVersion') : ''">
            {{ t('version') }}: {{ local.version }} ({{ d(local.createdAt, 'long') }})
          </small>
          <small v-else class="text-accent">{{ t('notSavedJet') }}</small>
        </q-toolbar-title>
        <q-btn
          v-if="isOtherVersion"
          color="accent"
          dense
          no-caps
          :label="t('restore')"
          :title="t('versionRestoreDescription')"
          @click.stop="$emit('restoreVersion', local)"
        />
        <q-btn
          v-else
          dense
          no-caps
          color="primary"
          :label="t('save')"
          :disabled="!hasUnsavedChanges && !isNew"
          @click="save"
        />
        <q-btn
          v-if="isOtherVersion"
          dense
          no-caps
          color="grey-7"
          :label="t('backToCurrentVersion')"
          @click="reset()"
        />
        <q-btn
          v-else
          dense
          no-caps
          color="grey-7"
          :label="t('reset')"
          :disable="!hasUnsavedChanges"
          @click="showClearDialog = true"
        />
        <q-separator vertical />
        <q-btn
          flat
          round
          dense
          icon="history"
          color="primary"
          :disabled="isNew"
          :title="t('versionHistory')"
          @click="showVersionHistory = true"
        />
        <q-btn
          flat
          round
          dense
          icon="raw_on"
          color="primary"
          :title="t('entityEditor.rawBtn.label')"
          @click="showJson = true"
        />
      </q-toolbar>

      <q-separator />

      <q-dialog v-model="showJson">
        <q-card>
          <q-card-section>
            <div v-t="'entityEditor.rawDialog.content'" class="text-h6" />
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pt-none scroll json-section text-caption">
            <pre>{{ local }}</pre>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('ok')" color="primary" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showClearDialog">
        <q-card>
          <q-card-section class="row items-center">
            <q-item>
              <q-item-section avatar>
                <q-avatar icon="warning_amber" color="warning" text-color="white" />
              </q-item-section>
              <q-item-section v-t="'confirmDiscardChanges'" />
            </q-item>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
            <q-btn v-close-popup flat :label="t('ok')" color="primary" @click="reset()" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <version-history-dialog
        :key="versionHistoryDialogKey"
        v-model:show="showVersionHistory"
        :entity-id="local.id"
        :current-version="entity.version"
        :selected-version="local.version"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        @prefill="prefillFromVersion"
        @restore="$emit('restoreVersion', $event)"
        @deleted="reset()"
      />
    </div>

    <div class="q-gutter-md q-mt-none q-px-md q-pb-xl col entity-editor-tab-content">
      <q-card>
        <q-toolbar v-if="!isRestricted(entity)" class="q-my-none">
          <q-toolbar-title>
            {{ t('superCategory', 2) }}:
            <entity-chip
              v-for="category in local.superCategories"
              :key="category.id"
              :entity-id="category.id"
              :disable="isOtherVersion"
              @removeClicked="removeSuperCategory(category.id)"
              @entityClicked="$emit('entityClicked', $event)"
            />
            <q-btn
              v-show="!showSuperCategoryInput"
              icon="add"
              round
              size="sm"
              dense
              :disable="isOtherVersion"
              :title="t('addThing', { thing: t('superCategory') })"
              @click="showSuperCategoryInput = true"
            />
            <entity-search-input
              v-show="!isOtherVersion && showSuperCategoryInput"
              :organisation-id="organisationId"
              :repository-id="repositoryId"
              :label="t('selectThing', { thing: t('category') })"
              :entity-types="[EntityType.Category]"
              clear-on-select
              @entitySelected="addSuperCategory"
              @btnClicked="showSuperCategoryInput = false"
            />
          </q-toolbar-title>
        </q-toolbar>
      </q-card>

      <localized-text-input
        v-model="local.titles"
        unique-langs
        expanded
        :readonly="isOtherVersion"
        :label="t('title', 2)"
        :help-text="t('entityEditor.titlesHelp')"
      />

      <data-type-select
        v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(local.entityType)"
        v-model="local.dataType"
        :readonly="isOtherVersion"
      />

      <ucum-card
        v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(local.entityType) && local.dataType === DataType.Number"
        v-model="local.units"
        :readonly="isOtherVersion"
        :expanded="local.units && local.units.length > 0"
      />

      <formula-input
        v-if="local.entityType === EntityType.DerivedPhenotype"
        v-model="local.formula"
        expanded
        :readonly="isOtherVersion"
        :label="t('formula')"
        :help-text="t('entityEditor.formulaHelp')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
      />

      <restriction-input
        v-if="[EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(local.entityType)"
        :key="restrictionKey"
        v-model="local.restriction"
        expanded
        :readonly="isOtherVersion"
      />

      <expression-input
        v-if="local.entityType === EntityType.CombinedRestriction"
        v-model="local.expression"
        :readonly="isOtherVersion"
        :label="t('expression')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        expanded
        @entity-clicked="$emit('entityClicked', $event)"
      />

      <q-input
        v-if="[EntityType.SingleRestriction, EntityType.CombinedRestriction, EntityType.DerivedRestriction].includes(local.entityType)"
        v-model="local.score"
        type="number"
        :readonly="isOtherVersion"
        :label="t('score')"
      />

      <localized-text-input
        v-model="local.synonyms"
        :readonly="isOtherVersion"
        :label="t('synonym', 2)"
        :help-text="t('entityEditor.synonymsHelp')"
        :expanded="local.synonyms && local.synonyms.length > 0"
      />
      <localized-text-input
        v-model="local.descriptions"
        text-area
        rows="3"
        :readonly="isOtherVersion"
        :label="t('description', 2)"
        :help-text="t('entityEditor.descriptionsHelp')"
        :expanded="local.description && local.descriptions.length > 0"
      />

      <code-input
        v-model="local.codes"
        :readonly="isOtherVersion"
        :expanded="local.codes && local.codes.length > 0"
      />
    </div>

    <q-inner-loading
      :showing="loading"
      :label="t('pleaseWait') + '...'"
    />
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent, watch, onMounted, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, DataType, Entity, Category, Phenotype } from '@onto-med/top-api'
import LocalizedTextInput from 'src/components/EntityEditor/LocalizedTextInput.vue'
import DataTypeSelect from 'src/components/EntityEditor/DataTypeSelect.vue'
import RestrictionInput from 'src/components/EntityEditor/RestrictionInput.vue'
import ExpressionInput from 'src/components/EntityEditor/ExpressionInput.vue'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import VersionHistoryDialog from 'src/components/EntityEditor/VersionHistoryDialog.vue'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import UcumCard from 'src/components/UcumCard.vue'
import FormulaInput from 'src/components/EntityEditor/FormulaInput.vue'
import CodeInput from 'src/components/EntityEditor/CodeInput.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import useAlert from 'src/mixins/useAlert'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import { EntityApiKey } from 'src/boot/axios'

export default defineComponent({
  name: 'EntityEditor',
  components: {
    LocalizedTextInput,
    DataTypeSelect,
    RestrictionInput,
    ExpressionInput,
    VersionHistoryDialog,
    UcumCard,
    FormulaInput,
    CodeInput,
    EntitySearchInput,
    EntityChip
  },
  props: {
    entity: {
      type: Object as () => Entity,
      required: true
    },
    version: Number,
    repositoryId: {
      type: String,
      required: true
    },
    organisationId: {
      type: String,
      required: true
    }
  },
  emits: ['entityClicked', 'update:entity', 'restoreVersion', 'changeVersion'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d } = useI18n()
    const clone = (value: Entity) =>
      JSON.parse(JSON.stringify(value)) as Entity
    const equals = (expected: unknown, actual: unknown): boolean => 
      JSON.stringify(expected) === JSON.stringify(actual)

    const { getTitle, isRestricted, hasDataType } = useEntityFormatter()
    const { alert } = useAlert()
    const router    = useRouter()
    const local     = ref(clone(props.entity))
    const entityApi = inject(EntityApiKey)
    const entityStore = useEntity()
    const showJson  = ref(false)
    const loading   = ref(false)
    const showVersionHistory = ref(false)
    const showClearDialog    = ref(false)
    const restrictionKey     = ref(0)
    const showSuperCategoryInput = ref(false)
    const versionHistoryDialogKey = ref(1)

    watch(
      () => props.entity,
      (value: Entity) => {
        local.value = clone(value)
      },
      { deep: true }
    )

    const prefillFromVersion = (entity: Entity): void => {
      local.value = clone(entity)
      restrictionKey.value++
      void router.push({
        name: 'editor',
        params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repositoryId, entityId: entity.id },
        query: { version: entity.version }
      })
      emit('changeVersion', entity.version)
    }

    onMounted(() => {
      if (!entityApi || !props.entity.id || !props.version) return
      loading.value = true
      entityApi.getEntityById(props.organisationId, props.repositoryId, props.entity.id, props.version)
        .then((r) => prefillFromVersion(r.data))
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    })

    const validate = (): boolean => !hasDataType(props.entity) || !!(local.value as Phenotype).dataType

    return {
      t, d, getTitle, isRestricted, local, showJson, showVersionHistory, loading, showClearDialog, restrictionKey, EntityType, DataType, versionHistoryDialogKey,

      showSuperCategoryInput,

      isNew: computed(() => !local.value.version),

      isOtherVersion: computed(() => local.value.version != props.entity.version),

      hasUnsavedChanges: computed(() => !equals(local.value, props.entity)),

      prefillFromVersion,

      addSuperCategory (category: Category): void {
        const casted = local.value as Category|Phenotype
        if (!casted.superCategories) casted.superCategories = []
        if (casted.superCategories.findIndex(c => c.id === category.id) === -1)
          if (casted.id !== category.id) casted.superCategories.push(category)
        showSuperCategoryInput.value = false
      },

      removeSuperCategory (id: string): void {
        const casted = local.value as Category|Phenotype
        if (!casted.superCategories) return
        const index = casted.superCategories.findIndex(c => c.id === id)
        if (index !== -1)
          casted.superCategories.splice(index, 1)
      },

      reset: () => {
        local.value = clone(props.entity)
        emit('changeVersion', local.value.version)
      },

      save: () => {
        if (validate()) {
          emit('update:entity', local.value)
          versionHistoryDialogKey.value++
        } else
          alert(t('pleaseCheckInput'))
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.entity-editor-tab-header
  width: 100%
.entity-editor-tab-content
  overflow-y: scroll
.json-section
  max-height: 80vh
</style>
