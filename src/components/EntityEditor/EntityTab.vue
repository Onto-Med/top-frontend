<template>
  <div class="column fit">
    <div class="col-auto entity-tab-header">
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
        <q-card class="full-width">
          <q-card-section>
            <div v-t="'entityEditor.rawDialog.content'" class="text-h6" />
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pt-none q-pr-none q-pb-none text-caption">
            <q-scroll-area class="json-section">
              <pre>{{ local }}</pre>
            </q-scroll-area>
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

    <q-scroll-area class="col entity-tab-content">
      <div class="q-gutter-md q-mt-none q-px-md q-pb-xl">
        <q-card>
          <q-toolbar v-if="!isRestricted(entity)" class="q-my-none">
            <q-toolbar-title class="row items-center">
              <span class="q-mr-sm">{{ t('superCategory', 2) }}:</span>
              <entity-chip
                v-for="(category, index) in local.superCategories"
                :key="index"
                :organisation-id="organisationId"
                :repository-id="repositoryId"
                :entity-types="[EntityType.Category]"
                :entity-id="category ? category.id : undefined"
                :disable="isOtherVersion"
                :label="t('selectThing', { thing: t('category') }) + '...'"
                @removeClicked="removeSuperCategory(index)"
                @entity-set="addSuperCategory(index, $event)"
                @entityClicked="$emit('entityClicked', $event)"
              />
              <q-chip
                icon="add"
                round
                clickable
                :disable="isOtherVersion"
                :label="t('more')"
                :title="t('addThing', { thing: t('superCategory') })"
                @click="local.superCategories.push(undefined)"
              />
            </q-toolbar-title>
          </q-toolbar>
        </q-card>

        <div class="row q-gutter-x-md q-mx-none">
          <localized-text-input
            v-model="local.titles"
            unique
            expanded
            :readonly="isOtherVersion"
            :required="true"
            :label="t('title', 2)"
            :help-text="t('entityEditor.titlesHelp')"
            class="col"
          />

          <q-card v-show="isRestricted(local) || hasDataType(local)" class="col-4">
            <q-card-section>
              <q-input
                v-if="isRestricted(local)"
                v-model="local.score"
                type="number"
                :readonly="isOtherVersion"
                :label="t('score')"
              />

              <data-type-select
                v-if="hasDataType(local)"
                v-model="local.dataType"
                :readonly="isOtherVersion"
              />
            </q-card-section>
          </q-card>
        </div>

        <formula-input
          v-if="local.entityType === EntityType.DerivedPhenotype"
          v-model="local.expression"
          expanded
          :readonly="isOtherVersion"
          :label="t('formula')"
          :help-text="t('entityEditor.formulaHelp')"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          @entity-clicked="$emit('entityClicked', $event)"
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
          expanded
          :readonly="isOtherVersion"
          :label="t('expression')"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          @entity-clicked="$emit('entityClicked', $event)"
        />

        <ucum-card
          v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(local.entityType) && local.dataType === DataType.Number"
          v-model="local.units"
          :readonly="isOtherVersion"
          :expanded="local.units && local.units.length > 0"
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
    </q-scroll-area>

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
  name: 'EntityTab',
  components: {
    LocalizedTextInput,
    DataTypeSelect,
    RestrictionInput,
    ExpressionInput,
    VersionHistoryDialog,
    UcumCard,
    FormulaInput,
    CodeInput,
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
  emits: ['entityClicked', 'update:entity', 'restoreVersion', 'changeVersion', 'change'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d } = useI18n()
    const clone = (value: Entity) =>
      JSON.parse(JSON.stringify(value)) as Entity
    const equals = (expected: unknown, actual: unknown): boolean => 
      JSON.stringify(expected) === JSON.stringify(actual)

    const { getTitle, isRestricted, hasDataType, hasExpression } = useEntityFormatter()
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
    const isNew = computed(() => !local.value.version)

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
      void router.replace({
        name: 'editor',
        params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repositoryId, entityId: entity.id },
        query: { version: entity.version }
      })
      emit('changeVersion', entity.version)
    }

    onMounted(() => {
      if (!entityApi || !props.entity.id || !props.version || props.entity.version === props.version) return
      loading.value = true
      entityApi.getEntityById(props.organisationId, props.repositoryId, props.entity.id, props.version)
        .then((r) => prefillFromVersion(r.data))
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    })

    const validate = (): boolean => {
      var result = true

      result &&= !hasDataType(props.entity) || !!(local.value as Phenotype).dataType
      result &&= local.value.titles != undefined && local.value.titles.filter(t => t.lang && t.text).length > 0
      result &&= local.value.descriptions == undefined || local.value.descriptions.filter(d => !d.lang || !d.text).length === 0
      result &&= local.value.synonyms == undefined || local.value.synonyms.filter(s => !s.lang || !s.text).length === 0
      result &&= !isRestricted(local.value) || local.value.restriction?.quantor !== undefined || local.value.entityType === EntityType.CombinedRestriction
      result &&= !hasExpression(local.value) || local.value.expression !== undefined

      return result
    }

    return {
      t,
      d,
      getTitle,
      isRestricted,
      hasDataType,

      local,
      showJson,
      showVersionHistory,
      loading,
      showClearDialog,
      restrictionKey,
      EntityType,
      DataType,
      versionHistoryDialogKey,
      showSuperCategoryInput,
      isNew,

      isOtherVersion: computed(() => local.value.version != props.entity.version),

      hasUnsavedChanges: computed(() => {
        const unsavedChanges = !equals(local.value, props.entity)
        emit('change', unsavedChanges || isNew.value)
        return unsavedChanges
      }),

      prefillFromVersion,

      addSuperCategory (index: number, category: Category): void {
        const casted = local.value as Category|Phenotype
        if (!casted.superCategories) casted.superCategories = []
        if (casted.superCategories.findIndex(c => c && c.id === category.id) === -1)
          if (casted.id !== category.id) casted.superCategories[index] = category
      },

      removeSuperCategory (index: number): void {
        const casted = local.value as Category|Phenotype
        if (!casted.superCategories) return
        casted.superCategories.splice(index, 1)
      },

      reset: () => {
        local.value = clone(props.entity)
        void router.replace({
          name: 'editor',
          params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repositoryId, entityId: local.value.id },
          query: { version: local.value.version }
        })
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
.entity-tab-header
  width: 100%
.entity-tab-content
  height: 100%
.json-section
  height: 60vh
  width: 100%
</style>
