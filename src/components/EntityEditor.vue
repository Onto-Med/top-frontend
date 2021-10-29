<template>
  <div v-cloak>
    <q-toolbar>
      <q-toolbar-title class="text-subtitle1">
        <q-breadcrumbs>
          <!-- TODO: add super classes and super phenotypes -->
          <q-breadcrumbs-el :label="entity.title" />
        </q-breadcrumbs>
      </q-toolbar-title>
      <q-btn
        flat
        round
        dense
        icon="raw_on"
        color="primary"
        :title="$t('entityEditor.rawBtn.label')"
        @click="showJson = true"
      />
    </q-toolbar>

    <div class="q-gutter-md q-pa-md">
      <localized-text-input v-model="entity.titles" unique-langs :label="$tc('title', 2)" />

      <data-type-select v-model="entity.dataType" />

      <q-expansion-item expand-separator icon="description" :label="$t('describingMetadata')">
        <div class="q-gutter-md">
          <localized-text-input v-model="entity.synonyms" :label="$tc('synonym', 2)" />
          <localized-text-input v-model="entity.descriptions" text-area rows="3" :label="$tc('description', 2)" />
        </div>
      </q-expansion-item>
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
          <q-btn v-close-popup flat :label="$t('ok')" color="primary" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IEntity, EntityType, DataType } from 'src/components/models';
import LocalizedTextInput from 'src/components/LocalizedTextInput.vue'
import DataTypeSelect from 'src/components/DataTypeSelect.vue'

export default defineComponent({
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
  data () {
    return {
      showJson: false,
      entity: null as unknown as IEntity,
      initialState: null as unknown as IEntity
    }
  },
  computed: {
    hasUnsavedChanges (): boolean {
      return JSON.stringify(this.entity) !== JSON.stringify(this.initialState)
    }
  },
  created () {
    // TODO: load entity from API
    this.entity = {
      title: 'Example Entity',
      titles: [
        { lang: 'de', text: 'Größe' },
        { lang: 'en', text: 'Height' }
      ],
      entityType: EntityType.SinglePhenotype,
      dataType: DataType.Number,
      synonyms: [],
      descriptions: [
        { lang: 'de', text: 'Beispielbeschreibung' },
        { lang: 'en', text: 'Example description' }
      ]
    }
    // TODO: reset state after save
    this.initialState = JSON.parse(JSON.stringify(this.entity)) as IEntity
  }
})
</script>
