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
          @click="save()"
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
          v-show="isForking"
          flat
          round
          dense
          icon="fork_right"
          color="primary"
          :title="t('forkingState')"
          @click="showForking = true"
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

      <forking-dialog
        v-model:show="showForking"
        :entity="entity"
        @entity-clicked="$emit('entityClicked', $event)"
      />
    </div>

    <entity-form
      v-model:titles="local.titles"
      v-model:synonyms="local.synonyms"
      v-model:descriptions="local.descriptions"
      v-model:data-type="local.dataType"
      v-model:restriction="local.restriction"
      v-model:expression="local.expression"
      v-model:units="local.units"
      v-model:score="local.score"
      v-model:superCategories="local.superCategories"
      :entity-id="local.id"
      :entity-type="local.entityType"
      :version="version"
      :repository-id="repositoryId"
      :organisation-id="organisationId"
      :readonly="isOtherVersion"
      @entity-clicked="$emit('entityClicked', $event)"
      @add-super-category="local.superCategories.push(undefined)"
      @set-super-category="setSuperCategory"
      @remove-super-category="removeSuperCategory"
    />

    <q-inner-loading
      :showing="loading"
      :label="t('pleaseWait') + '...'"
    />
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent, watch, onMounted, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, DataType, Category, Phenotype } from '@onto-med/top-api'
import VersionHistoryDialog from 'src/components/EntityEditor/VersionHistoryDialog.vue'
import ForkingDialog from 'src/components/EntityEditor/ForkingDialog.vue'
import EntityForm from 'src/components/EntityEditor/EntityForm.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import useAlert from 'src/mixins/useAlert'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import { EntityApiKey } from 'src/boot/axios'

export default defineComponent({
  name: 'EntityTab',
  components: {
    VersionHistoryDialog,
    ForkingDialog,
    EntityForm
  },
  props: {
    entity: {
      type: Object as () => Category|Phenotype,
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
    const clone = (value: Category|Phenotype) =>
      JSON.parse(JSON.stringify(value)) as Category|Phenotype
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
      (value: Category|Phenotype) => {
        local.value = clone(value)
      },
      { deep: true }
    )

    const prefillFromVersion = (entity: Category|Phenotype): void => {
      local.value = clone(entity)
      restrictionKey.value++
      void router.replace({
        name: 'editor',
        params: { organisationId: entityStore.organisationId, repositoryId: entityStore.repositoryId, entityId: entity.id },
        query: { version: entity.version }
      })
      emit('changeVersion', entity.version)
    }

    const hasUnsavedChanges = computed(() => {
      const unsavedChanges = !equals(local.value, props.entity)
      emit('change', unsavedChanges || isNew.value)
      return unsavedChanges
    })

    const isValid = computed((): boolean => {
      var result = true

      result &&= local.value.titles != undefined && local.value.titles.filter(t => t.lang && t.text).length > 0
      result &&= local.value.descriptions == undefined || local.value.descriptions.filter(d => !d.lang || !d.text).length === 0
      result &&= local.value.synonyms == undefined || local.value.synonyms.filter(s => !s.lang || !s.text).length === 0
      
      result &&= !hasDataType(props.entity) || !!(local.value as Phenotype).dataType
      result &&= !isRestricted(local.value) || local.value.restriction?.quantor !== undefined || local.value.entityType === EntityType.CombinedRestriction
      result &&= !hasExpression(local.value) || local.value.expression !== undefined

      return result
    })

    onMounted(() => {
      if (!entityApi || !props.entity.id || !props.version || props.entity.version === props.version) return
      loading.value = true
      entityApi.getEntityById(props.organisationId, props.repositoryId, props.entity.id, props.version)
        .then((r) => prefillFromVersion(r.data))
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    })

    return {
      t,
      d,
      getTitle,
      isRestricted,
      hasDataType,

      local,
      showJson,
      showVersionHistory,
      showForking: ref(false),
      loading,
      showClearDialog,
      restrictionKey,
      EntityType,
      DataType,
      versionHistoryDialogKey,
      showSuperCategoryInput,
      isNew,

      isOtherVersion: computed(() => local.value.version != props.entity.version),
      isForking: true,

      hasUnsavedChanges,

      prefillFromVersion,

      setSuperCategory (index: number, category: Category): void {
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
        if (hasUnsavedChanges.value && isValid.value) {
          emit('update:entity', local.value)
          versionHistoryDialogKey.value++
        } else
          alert(t('pleaseCheckInput'))
      }
    }
  }
})
</script>

<style lang="sass">
.entity-tab-content
  height: 100%
</style>

<style lang="sass" scoped>
.entity-tab-header
  width: 100%
.json-section
  height: 60vh
  width: 100%
</style>
