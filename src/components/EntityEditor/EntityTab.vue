<template>
  <div v-if="local.id" class="column fit">
    <div class="col-auto entity-tab-header">
      <q-toolbar class="q-gutter-sm">
        <q-toolbar-title class="text-subtitle1 ellipsis">
          {{ getTitle(local) }}
          <small v-if="!isNew" class="gt-xs" :class="{'text-accent': isOtherVersion }" :title="isOtherVersion ? t('displayingOtherVersion') : ''">
            {{ t('version') }}: {{ local.version }}
            <span v-if="local.createdAt">({{ d(local.createdAt, 'long') }})</span>
          </small>
          <small v-else class="text-accent">{{ t('notSavedYet') }}</small>
        </q-toolbar-title>
        <q-btn
          v-if="isOtherVersion"
          color="accent"
          dense
          no-caps
          :disabled="readonly"
          :icon="$q.screen.lt.md ? 'undo' : undefined"
          :label="$q.screen.gt.sm ? t('restore') : ''"
          :title="t('versionRestoreDescription')"
          @click.stop="$emit('restoreVersion', local)"
        />
        <q-btn
          v-else
          dense
          no-caps
          color="primary"
          :icon="$q.screen.lt.md ? 'save' : undefined"
          :label="$q.screen.gt.sm ? t('save') : ''"
          :title="t('ctrl') + '+S'"
          :disabled="readonly || !dirty && !isNew"
          @click="save()"
        />
        <q-btn
          v-if="isOtherVersion"
          dense
          no-caps
          color="grey-7"
          :icon="$q.screen.lt.md ? 'fast_forward' : undefined"
          :label="$q.screen.gt.sm ? t('backToCurrentVersion') : ''"
          @click="reset()"
        />
        <q-btn
          v-else
          dense
          no-caps
          color="grey-7"
          :icon="$q.screen.lt.md ? 'undo' : undefined"
          :label="$q.screen.gt.sm ? t('reset') : ''"
          :disable="!dirty"
          @click="showClearDialog"
        />
        <q-separator vertical class="gt-xs" />
        <div class="gt-xs">
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
        </div>
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
              <q-btn
                flat
                round
                icon="content_copy"
                class="fixed-top-right q-mr-md text-grey"
                :title="t('copy')"
                @click="copyToClipboard(local)"
              />
              <pre>{{ local }}</pre>
            </q-scroll-area>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('ok')" color="primary" />
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
        :readonly="readonly"
        @prefill="prefillFromVersion"
        @restore="$emit('restoreVersion', $event)"
      />

      <forking-dialog
        v-model:show="showForking"
        :entity="entity"
        @entity-clicked="$emit('entityClicked', $event)"
      />
    </div>

    <entity-form
      v-if="![EntityType.SingleConcept, EntityType.CompositeConcept].includes(local.entityType)"
      :titles="local.titles"
      :synonyms="local.synonyms"
      :descriptions="local.descriptions"
      :data-type="local.dataType"
      :item-type="local.itemType"
      :restriction="local.restriction"
      :expression="local.expression"
      :unit="local.unit"
      :super-categories="local.superCategories"
      :codes="local.codes"
      :entity-id="local.id"
      :entity-type="local.entityType"
      :version="version"
      :repository-id="repositoryId"
      :organisation-id="organisationId"
      :readonly="isOtherVersion || readonly"
      :restriction-key="restrictionKey"
      @update:titles="$emit('update:entity', { ...local, titles: $event })"
      @update:synonyms="$emit('update:entity', { ...local, synonyms: $event })"
      @update:descriptions="$emit('update:entity', { ...local, descriptions: $event })"
      @update:data-type="$emit('update:entity', { ...local, dataType: $event })"
      @update:item-type="$emit('update:entity', { ...local, itemType: $event })"
      @update:restriction="$emit('update:entity', { ...local, restriction: $event })"
      @update:expression="$emit('update:entity', { ...local, expression: $event })"
      @update:unit="$emit('update:entity', { ...local, unit: $event })"
      @update:super-categories="$emit('update:entity', { ...local, superCategories: $event })"
      @update:codes="$emit('update:entity', { ...local, codes: $event })"
      @entity-clicked="$emit('entityClicked', $event)"
    />
    <entity-form
      v-else-if="[EntityType.SingleConcept, EntityType.CompositeConcept].includes(local.entityType)"
      :titles="local.titles"
      :synonyms="local.synonyms"
      :descriptions="local.descriptions"
      :data-type="undefined"
      :item-type="undefined"
      :restriction="undefined"
      :expression="local.expression"
      :unit="undefined"
      :super-categories="local.superConcepts"
      :codes="local.codes"
      :entity-id="local.id"
      :entity-type="local.entityType"
      :version="version"
      :repository-id="repositoryId"
      :organisation-id="organisationId"
      :readonly="isOtherVersion || readonly"
      :restriction-key="restrictionKey"
      @update:titles="$emit('update:entity', { ...local, titles: $event })"
      @update:synonyms="$emit('update:entity', { ...local, synonyms: $event })"
      @update:descriptions="$emit('update:entity', { ...local, descriptions: $event })"
      @update:data-type="$emit('update:entity', { ...local, dataType: $event })"
      @update:item-type="$emit('update:entity', { ...local, itemType: $event })"
      @update:restriction="$emit('update:entity', { ...local, restriction: $event })"
      @update:expression="$emit('update:entity', { ...local, expression: $event })"
      @update:unit="$emit('update:entity', { ...local, unit: $event })"
      @update:super-categories="$emit('update:entity', { ...local, superCategories: $event })"
      @update:codes="$emit('update:entity', { ...local, codes: $event })"
      @entity-clicked="$emit('entityClicked', $event)"
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
import {EntityType, DataType, Category, Phenotype, Concept} from '@onto-med/top-api'
import VersionHistoryDialog from 'src/components/EntityEditor/VersionHistoryDialog.vue'
import ForkingDialog from 'src/components/EntityEditor/Forking/ForkingDialog.vue'
import EntityForm from 'src/components/EntityEditor/EntityForm.vue'
import Dialog from 'src/components/Dialog.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import { EntityApiKey } from 'src/boot/axios'
import { copyToClipboard, useQuasar } from 'quasar'
import useNotify from 'src/mixins/useNotify'

export default defineComponent({
  name: 'EntityTab',
  components: {
    VersionHistoryDialog,
    ForkingDialog,
    EntityForm
  },
  props: {
    entity: {
      type: Object as () => Category|Phenotype|Concept,
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
    },
    hotkeysEnabled: {
      type: Boolean,
      default: true
    },
    isOpen: {
      type: Boolean,
      default: false
    },
    dirty: Boolean,
    readonly: Boolean
  },
  emits: ['entityClicked', 'update:entity', 'restoreVersion', 'changeVersion', 'save', 'reset'],
  setup (props, { emit }) {
    const { t, d } = useI18n()
    const clone = (value: Category|Phenotype|Concept) => {
      if (isConcept(value)) {
        return JSON.parse(JSON.stringify(value)) as Concept
      }
      return JSON.parse(JSON.stringify(value)) as Phenotype
    }
    const { getTitle, isRestricted, isPhenotype, hasDataType, hasExpression, hasItemType, isConcept } = useEntityFormatter()
    const { notify, renderError } = useNotify()
    const router    = useRouter()
    const local     = ref(clone(props.entity))
    const entityApi = inject(EntityApiKey)
    const entityStore = useEntity()
    const showJson  = ref(false)
    const loading   = ref(false)
    const showVersionHistory = ref(false)
    const restrictionKey     = ref(0)
    const showSuperCategoryInput = ref(false)
    const versionHistoryDialogKey = ref(1)
    const isNew = computed(() => !local.value.version)
    const $q = useQuasar()

    watch(
      () => props.entity,
      (value: Category|Phenotype|Concept) => {
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

    const isValid = computed((): boolean => {
      var result = true

      result &&= local.value.titles != undefined && local.value.titles.length > 0 && local.value.titles.filter(t => !t.lang || !t.text).length === 0
      result &&= local.value.descriptions == undefined || local.value.descriptions.filter(d => !d.lang || !d.text).length === 0
      result &&= local.value.synonyms == undefined || local.value.synonyms.filter(s => !s.lang || !s.text).length === 0

      result &&= !hasItemType(props.entity) || !!(local.value as Phenotype).itemType
      result &&= !hasDataType(props.entity) || !!(local.value as Phenotype).dataType
      result &&= !isRestricted(local.value) || local.value.restriction?.quantifier !== undefined
      result &&= !hasExpression(local.value) || local.value.expression !== undefined

      return result
    })

    const save = () => {
      if ((isNew.value || props.dirty)) {
        if (isValid.value) {
          if (isPhenotype(local.value) && local.value.expression?.functionId === 'switch' && hasDataType(local.value))
            local.value.dataType = DataType.Number
          emit('save')
          versionHistoryDialogKey.value++
        } else {
          notify(t('pleaseCheckInput'))
        }
      }
    }

    const keylistener = (e: KeyboardEvent) => {
      if (!props.hotkeysEnabled) return
      if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
        save()
      } else return
      e.preventDefault()
    }

    const reset = () => {
      emit('reset')
      restrictionKey.value++
    }

    onMounted(() => {
      document.addEventListener('keydown', keylistener)
      if (!entityApi || !props.entity.id || !props.version || props.entity.version === props.version) return
      loading.value = true
      entityApi.getEntityById(props.organisationId, props.repositoryId, props.entity.id, props.version)
        .then((r) => prefillFromVersion(r.data))
        .catch((e: Error) => renderError(e))
        .finally(() => loading.value = false)
    })

    return {
      t,
      d,
      getTitle,
      isRestricted,
      hasDataType,
      reset,

      local,
      showJson,
      showVersionHistory,
      showForking: ref(false),
      loading,
      restrictionKey,
      EntityType,
      DataType,
      versionHistoryDialogKey,
      showSuperCategoryInput,
      isNew,

      isOtherVersion: computed(() => local.value.version != props.entity.version),
      isForking: true,

      save,

      prefillFromVersion,

      copyToClipboard (text: unknown): void {
        copyToClipboard(JSON.stringify(text))
          .catch(() => notify(t('copyFailed')))
      },

      showClearDialog () {
        $q.dialog({
          component: Dialog,
          componentProps: {
            message: t('confirmDiscardChanges')
          }
        }).onOk(() => reset())
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
