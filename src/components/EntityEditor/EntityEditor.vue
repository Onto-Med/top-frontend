<template>
  <div class="column fit">
    <div class="col-auto entity-editor-tab-header">
      <q-toolbar class="q-gutter-sm">
        <q-toolbar-title class="text-subtitle1 ellipsis">
          {{ getTitle(local) }}
          <small v-if="!isNew">{{ t('version') }}: {{ local.version }} ({{ d(local.createdAt, 'long') }})</small>
          <small v-else class="text-accent">{{ t('notSavedJet') }}</small>
        </q-toolbar-title>
        <q-btn
          dense
          no-caps
          color="primary"
          :label="t('save')"
          :disabled="!hasUnsavedChanges && !isNew"
          @click="save"
        />
        <q-btn
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
        v-model:show="showVersionHistory"
        :entity-id="local.id"
        :current-version="local.version"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        @prefill="prefillFromVersion"
        @restore="$emit('restoreVersion', $event)"
      />
    </div>

    <div class="q-gutter-md q-mt-none q-px-md q-pb-xl col entity-editor-tab-content">
      <q-toolbar v-if="!isRestricted(entity)" class="q-my-none">
        {{ t('superCategory', 2) }}:
        <entity-chip
          v-for="category in local.superCategories"
          :key="category.id"
          :entity-id="category.id"
          @removeClicked="removeSuperCategory(category.id)"
          @entityClicked="$emit('entityClicked', $event)"
        />
        <q-btn
          v-show="!showSuperCategoryInput"
          icon="add"
          round
          size="sm"
          dense
          :title="t('addThing', { thing: t('superCategory') })"
          @click="showSuperCategoryInput = true"
        />
        <entity-search-input
          v-show="showSuperCategoryInput"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          :label="t('selectThing', { thing: t('category') })"
          :entity-types="[EntityType.Category]"
          clear-on-select
          @entitySelected="addSuperCategory"
          @btnClicked="showSuperCategoryInput = false"
        />
      </q-toolbar>

      <localized-text-input v-model="local.titles" unique-langs :label="t('title', 2)" :help-text="t('entityEditor.titlesHelp')" expanded />

      <data-type-select
        v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(local.entityType)"
        v-model="local.dataType"
      />

      <ucum-card
        v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(local.entityType) && local.dataType === DataType.Number"
        v-model="local.units"
        :expanded="local.units && local.units.length > 0"
      />

      <formula-input
        v-if="local.entityType === EntityType.DerivedPhenotype"
        v-model="local.formula"
        :label="t('formula')"
        :help-text="t('entityEditor.formulaHelp')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        expanded
      />

      <restriction-input
        v-if="[EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(local.entityType)"
        :key="restrictionKey"
        v-model="local.restriction"
        expanded
      />

      <expression-input
        v-if="local.entityType === EntityType.CombinedRestriction"
        v-model="local.expression"
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
        :label="t('score')"
      />

      <localized-text-input v-model="local.synonyms" :label="t('synonym', 2)" :help-text="t('entityEditor.synonymsHelp')" :expanded="local.synonyms && local.synonyms.length > 0" />
      <localized-text-input
        v-model="local.descriptions"
        text-area
        rows="3"
        :label="t('description', 2)"
        :help-text="t('entityEditor.descriptionsHelp')"
        :expanded="local.description && local.descriptions.length > 0"
      />

      <code-input v-model="local.codes" :expanded="local.codes && local.codes.length > 0" />
    </div>

    <q-inner-loading
      :showing="loading"
      :label="t('pleaseWait') + '...'"
    />
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent, watch } from 'vue'
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
    repositoryId: {
      type: String,
      required: true
    },
    organisationId: {
      type: String,
      required: true
    }
  },
  emits: ['entityClicked', 'update:entity', 'restoreVersion'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d } = useI18n()
    const clone = (value: Entity) =>
      JSON.parse(JSON.stringify(value)) as Entity
    const equals = (expected: unknown, actual: unknown): boolean => 
      JSON.stringify(expected) === JSON.stringify(actual)

    const { getTitle, isRestricted } = useEntityFormatter()
    const local    = ref(clone(props.entity))
    const showJson = ref(false)
    const loading  = ref(false)
    const showVersionHistory = ref(false)
    const showClearDialog    = ref(false)
    const restrictionKey     = ref(0)
    const showSuperCategoryInput = ref(false)

    watch(
      () => props.entity,
      (value: Entity) => {
        local.value = clone(value)
      },
      { deep: true }
    )

    return {
      t, d, getTitle, isRestricted, local, showJson, showVersionHistory, loading, showClearDialog, restrictionKey, EntityType, DataType,

      showSuperCategoryInput,

      isNew: computed(() => !local.value.version),

      hasUnsavedChanges: computed(() => !equals(local.value, props.entity)),

      prefillFromVersion (entity: Entity): void {
        const version = local.value.version
        local.value = clone(entity)
        local.value.version = version
        restrictionKey.value++
      },

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

      reset: () => local.value = clone(props.entity),

      save: () => emit('update:entity', local.value)
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
