<template>
  <div v-cloak>
    <q-toolbar>
      <q-toolbar-title class="text-subtitle1">
        <q-breadcrumbs>
          <q-breadcrumbs-el v-if="entity.superClass" :label="entity.superClass.title" />
          <q-breadcrumbs-el :label="entity.title" />
        </q-breadcrumbs>
      </q-toolbar-title>
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

    <div class="q-gutter-md q-pa-md">
      <localized-text-input v-model="entity.titles" unique-langs :label="t('title', 2)" />

      <data-type-select v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(entity.entityType)" v-model="entity.dataType" />

      <q-expansion-item expand-separator icon="description" :label="t('describingMetadata')">
        <div class="q-gutter-md">
          <localized-text-input v-model="entity.synonyms" :label="t('synonym', 2)" />
          <localized-text-input v-model="entity.descriptions" text-area rows="3" :label="t('description', 2)" />
        </div>
      </q-expansion-item>

      <q-input v-if="[EntityType.SingleRestriction, EntityType.CombinedRestriction].includes(entity.entityType)" v-model="entity.score" type="number" :label="t('score')" />
    </div>

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
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IEntity, EntityType } from 'src/components/models';
import LocalizedTextInput from 'src/components/LocalizedTextInput.vue'
import DataTypeSelect from 'src/components/DataTypeSelect.vue'
import { fetchEntity } from 'src/api/entityRepository'

export default {
  name: 'EntityEditor',
  components: {
    LocalizedTextInput,
    DataTypeSelect
  },
  props: {
    entityType: {
      type: String as () => EntityType
    },
    entityId: {
      type: [String, Number]
    }
  },
  setup (props: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t }  = useI18n()
    const entity       = ref({} as IEntity)
    const showJson     = ref(false)
    const initialState = ref({} as IEntity)

    const getEntity = () => {
      entity.value = fetchEntity(props.entityId as string)
      initialState.value = JSON.parse(JSON.stringify(entity.value)) as IEntity
    }
    const hasUnsavedChanges = computed(() =>
      JSON.stringify(entity.value) !== JSON.stringify(initialState.value)
    )

    getEntity()

    return {
      t, entity, showJson, initialState, hasUnsavedChanges, EntityType
    }
  }
}
</script>
