<template>
  <div class="column fit">
    <div v-if="local" class="col-auto entity-editor-tab-header">
      <q-toolbar class="q-gutter-sm">
        <q-toolbar-title class="text-subtitle1 ellipsis">
          <q-breadcrumbs>
            <q-breadcrumbs-el
              v-if="local.superClass"
              class="cursor-pointer"
              :label="local.superClass.getTitle()"
              @click="local.superClass ? $emit('entityClicked', local.superClass.id) : null"
            />
            <q-breadcrumbs-el :label="local.getTitle()" />
          </q-breadcrumbs>
        </q-toolbar-title>
        <q-btn
          dense
          no-caps
          color="primary"
          :label="t('save')"
          :disabled="!hasUnsavedChanges"
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

          <q-card-section class="q-pt-none">
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
            <q-avatar icon="warning_amber" color="warning" text-color="white" />
            <span v-t="'confirmDiscardChanges'" class="q-ml-sm" />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
            <q-btn v-close-popup flat :label="t('ok')" color="primary" @click="reset()" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <version-history-dialog v-model:show="showVersionHistory" :entity-id="local.id" @restore="handleRestore" />
    </div>

    <div v-if="local" class="q-gutter-md q-mt-none q-px-md col entity-editor-tab-content">
      <localized-text-input v-model="local.titles" unique-langs :label="t('title', 2)" :help-text="t('entityEditor.titles.help')" />

      <data-type-select v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(local.entityType)" v-model="local.dataType" />

      <q-expansion-item expand-separator icon="description" :label="t('describingMetadata')">
        <div class="q-gutter-md">
          <localized-text-input v-model="local.synonyms" :label="t('synonym', 2)" :help-text="t('entityEditor.synonyms.help')" />
          <localized-text-input v-model="local.descriptions" text-area rows="3" :label="t('description', 2)" :help-text="t('entityEditor.descriptions.help')" />
        </div>
      </q-expansion-item>

      <ucum-card
        v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(local.entityType) && local.dataType === DataType.Number"
        v-model="local.units"
      />

      <q-input
        v-if="[EntityType.SingleRestriction, EntityType.CombinedRestriction, EntityType.DerivedRestriction].includes(local.entityType)"
        v-model="local.score"
        type="number"
        :label="t('score')"
      />

      <restriction-input
        v-if="[EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(local.entityType)"
        :key="restrictionKey"
        v-model="local.restriction"
      />

      <expression-input
        v-if="local.entityType === EntityType.CombinedRestriction"
        v-model="local.expression"
        :label="t('expression')"
        @entity-clicked="$emit('entityClicked', $event)"
      />
    </div>

    <q-inner-loading
      :showing="loading"
      :label="t('pleaseWait') + '...'"
    />
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, DataType } from 'src/components/models'
import { Entity } from 'src/models/Entity'
import { fetchEntity } from 'src/api/entityRepository'
import LocalizedTextInput from 'src/components/EntityEditor/LocalizedTextInput.vue'
import DataTypeSelect from 'src/components/EntityEditor/DataTypeSelect.vue'
import RestrictionInput from 'src/components/EntityEditor/RestrictionInput.vue'
import ExpressionInput from 'src/components/EntityEditor/ExpressionInput.vue'
import VersionHistoryDialog from 'src/components/EntityEditor/VersionHistoryDialog.vue'
import UcumCard from 'src/components/UcumCard.vue'

export default defineComponent({
  name: 'EntityEditor',
  components: {
    LocalizedTextInput,
    DataTypeSelect,
    RestrictionInput,
    ExpressionInput,
    VersionHistoryDialog,
    UcumCard
  },
  props: {
    entity: {
      type: Entity,
      required: true
    }
  },
  emits: ['entityClicked', 'reloadFailed', 'update:entity'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }    = useI18n()
    const local    = ref(props.entity.clone())
    const showJson = ref(false)
    const loading  = ref(false)
    const showVersionHistory = ref(false)
    const showClearDialog    = ref(false)
    const restrictionKey = ref(0)

    const reload = () => {
      loading.value = true
      fetchEntity(props.entity.id)
        .then(r => {
          local.value = r
          if (!local.value.equals(props.entity))
            emit('update:entity', r)
        })
        .catch(e => emit('reloadFailed', e))
        .finally(() => loading.value = false)
    }
    const reset = () => local.value = props.entity.clone()
    const hasUnsavedChanges = computed(() => !local.value.equals(props.entity))

    return {
      t, local, showJson, showVersionHistory, loading, showClearDialog, hasUnsavedChanges, restrictionKey, reload, reset, EntityType, DataType,

      handleRestore (entity: Entity): void {
        local.value = entity.clone()
        restrictionKey.value++
      },

      save () {
        // TODO: send entity to API and handle errors
        emit('update:entity', local.value)
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
</style>
