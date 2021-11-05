<template>
  <div class="column fit">
    <div v-if="entity" class="col-auto entity-editor-tab-header">
      <q-toolbar class="q-gutter-sm">
        <q-toolbar-title class="text-subtitle1 ellipsis">
          <q-breadcrumbs>
            <q-breadcrumbs-el
              v-if="entity.superClass"
              class="cursor-pointer"
              :label="entity.superClass.getTitle()"
              @click="entity.superClass ? $emit('entityClicked', entity.superClass.id) : null"
            />
            <q-breadcrumbs-el :label="entity.getTitle()" />
          </q-breadcrumbs>
        </q-toolbar-title>
        <q-btn
          dense
          no-caps
          color="primary"
          :label="t('save')"
          :disabled="!hasUnsavedChanges"
        />
        <q-btn
          dense
          no-caps
          color="grey-7"
          :label="t('reset')"
          :disable="!hasUnsavedChanges"
          @click="reset()"
        />
        <q-separator vertical />
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
            <pre>{{ entity }}</pre>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('ok')" color="primary" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <div v-if="entity" class="q-gutter-md q-mt-none q-px-md col entity-editor-tab-content">
      <localized-text-input v-model="entity.titles" unique-langs :label="t('title', 2)" />

      <data-type-select v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(entity.entityType)" v-model="entity.dataType" />

      <q-expansion-item expand-separator icon="description" :label="t('describingMetadata')">
        <div class="q-gutter-md">
          <localized-text-input v-model="entity.synonyms" :label="t('synonym', 2)" />
          <localized-text-input v-model="entity.descriptions" text-area rows="3" :label="t('description', 2)" />
        </div>
      </q-expansion-item>

      <q-input
        v-if="[EntityType.SingleRestriction, EntityType.CombinedRestriction, EntityType.DerivedRestriction].includes(entity.entityType)"
        v-model="entity.score"
        type="number"
        :label="t('score')"
      />

      <restriction-input
        v-if="[EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(entity.entityType)"
        v-model="entity.restriction"
      />

      <expression-input
        v-if="entity.entityType === EntityType.CombinedRestriction"
        v-model="entity.expression"
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
import { EntityType } from 'src/components/models'
import { Entity } from 'src/models/Entity'
import { fetchEntity } from 'src/api/entityRepository'
import LocalizedTextInput from 'src/components/EntityEditor/LocalizedTextInput.vue'
import DataTypeSelect from 'src/components/EntityEditor/DataTypeSelect.vue'
import RestrictionInput from 'src/components/EntityEditor/RestrictionInput.vue'
import ExpressionInput from 'src/components/EntityEditor/ExpressionInput.vue'

export default defineComponent({
  name: 'EntityEditor',
  components: {
    LocalizedTextInput,
    DataTypeSelect,
    RestrictionInput,
    ExpressionInput
  },
  props: {
    entityType: {
      type: String as () => EntityType
    },
    entityId: {
      type: [String, Number]
    }
  },
  emits: ['entityClicked', 'reloadFailed'],
  setup (props: Record<string, unknown>, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }  = useI18n()
    const entity       = ref(undefined as unknown as Entity)
    const initialState = ref(undefined as unknown as Entity)
    const showJson     = ref(false)
    const loading      = ref(false)

    const reload = () => {
      loading.value = true
      fetchEntity(props.entityId as string)
        .then(r => {
          entity.value = r
          initialState.value = r.clone()
        })
        .catch(e => emit('reloadFailed', e))
        .finally(() => loading.value = false)
    }
    const reset = () => {
      entity.value = initialState.value.clone()
    }
    const hasUnsavedChanges = computed(() =>
      entity.value && entity.value.equals(initialState.value)
    )

    reload()

    return {
      t, entity, showJson, loading, reset, hasUnsavedChanges, EntityType
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