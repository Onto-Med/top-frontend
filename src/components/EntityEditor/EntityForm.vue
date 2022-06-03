<template>
  <q-scroll-area class="col entity-tab-content">
    <div class="q-gutter-md q-mt-none q-px-md q-pb-xl">
      <q-card>
        <q-toolbar v-if="!isRestricted(entityType)" class="q-my-none">
          <q-toolbar-title class="row items-center">
            <span class="q-mr-sm">{{ t('superCategory', 2) }}:</span>
            <entity-chip
              v-for="(category, index) in superCategories"
              :key="index"
              :organisation-id="organisationId"
              :repository-id="repositoryId"
              :entity-types="[EntityType.Category]"
              :entity-id="category ? category.id : undefined"
              :disable="readonly"
              :label="t('selectThing', { thing: t('category') }) + '...'"
              @removeClicked="$emit('removeSuperCategory', index)"
              @entity-set="$emit('setSuperCategory', index, $event)"
              @entityClicked="$emit('entityClicked', $event)"
            />
            <q-chip
              icon="add"
              round
              clickable
              :disable="readonly"
              :label="t('more')"
              :title="t('addThing', { thing: t('superCategory') })"
              @click="$emit('addSuperCategory')"
            />
          </q-toolbar-title>
        </q-toolbar>
      </q-card>

      <div class="row q-gutter-x-md q-mx-none">
        <localized-text-input
          :model-value="titles"
          unique
          expanded
          :autofocus="autofocusTitle"
          :readonly="readonly"
          :required="true"
          :label="t('title', 2)"
          :help-text="t('entityEditor.titlesHelp')"
          class="col"
          @update:model-value="$emit('update:titles', $event)"
        />

        <q-card v-show="isRestricted(entityType) || hasDataType(entityType)" class="col-4">
          <q-card-section>
            <q-input
              v-if="isRestricted(entityType)"
              :model-value="score"
              type="number"
              :readonly="readonly"
              :label="t('score')"
              @update:model-value="$emit('update:score', $event)"
            />

            <data-type-select
              v-if="hasDataType(entityType)"
              :model-value="dataType"
              :readonly="readonly"
              @update:model-value="$emit('update:dataType', $event)"
            />
          </q-card-section>
        </q-card>
      </div>

      <expression-input
        v-if="entityType === EntityType.DerivedPhenotype"
        :model-value="expression"
        expanded
        :readonly="readonly"
        :label="t('formula')"
        :help-text="t('entityEditor.formulaHelp')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype]"
        operator-type="math"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:expression', $event)"
      />

      <restriction-input
        v-if="[EntityType.SingleRestriction, EntityType.DerivedRestriction].includes(entityType)"
        :key="restrictionKey"
        :model-value="restriction"
        expanded
        :readonly="readonly"
        @update:model-value="$emit('update:restriction', $event)"
      />

      <expression-input
        v-if="entityType === EntityType.CombinedRestriction"
        :model-value="expression"
        expanded
        :readonly="readonly"
        :label="t('expression')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :help-text="t('entityEditor.expressionHelp')"
        :entity-types="restrictionEntityTypes()"
        operator-type="boolean"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:expression', $event)"
      />

      <ucum-card
        v-if="[EntityType.SinglePhenotype, EntityType.DerivedPhenotype].includes(entityType) && dataType === DataType.Number"
        :model-value="units"
        :readonly="readonly"
        :expanded="units && units.length > 0"
        @update:model-value="$emit('update:units', $event)"
      />

      <localized-text-input
        :model-value="synonyms"
        :readonly="readonly"
        :label="t('synonym', 2)"
        :help-text="t('entityEditor.synonymsHelp')"
        :expanded="synonyms && synonyms.length > 0"
        @update:model-value="$emit('update:synonyms', $event)"
      />
      <localized-text-input
        :model-value="descriptions"
        text-area
        rows="3"
        :readonly="readonly"
        :label="t('description', 2)"
        :help-text="t('entityEditor.descriptionsHelp')"
        :expanded="descriptions && descriptions.length > 0"
        @update:model-value="$emit('update:descriptions', $event)"
      />

      <code-input
        :model-value="codes"
        :readonly="readonly"
        :expanded="codes && codes.length > 0"
        @update:model-value="$emit('update:codes', $event)"
      />
    </div>
  </q-scroll-area>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, DataType, LocalisableText, Unit, Code, Expression, Restriction, Category } from '@onto-med/top-api'
import LocalizedTextInput from 'src/components/EntityEditor/LocalizedTextInput.vue'
import DataTypeSelect from 'src/components/EntityEditor/DataTypeSelect.vue'
import RestrictionInput from 'src/components/EntityEditor/RestrictionInput.vue'
import ExpressionInput from 'src/components/EntityEditor/Expression/ExpressionInput.vue'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import UcumCard from 'src/components/UcumCard.vue'
import CodeInput from 'src/components/EntityEditor/CodeInput.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

export default defineComponent({
  components: {
    LocalizedTextInput,
    DataTypeSelect,
    RestrictionInput,
    ExpressionInput,
    UcumCard,
    CodeInput,
    EntityChip
  },
  props: {
    version: Number,
    entityId: {
      type: String,
      required: true
    },
    repositoryId: {
      type: String,
      required: true
    },
    organisationId: {
      type: String,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    },
    entityType: {
      type: String as PropType<EntityType>
    },
    dataType: {
      type: String as PropType<DataType>
    },
    score: {
      type: Number
    },
    units: {
      type: Array as () => Unit[],
      default: () => []
    },
    titles: {
      type: Array as () => LocalisableText[],
      default: () => []
    },
    synonyms: {
      type: Array as () => LocalisableText[],
      default: () => []
    },
    descriptions: {
      type: Array as () => LocalisableText[],
      default: () => []
    },
    codes: {
      type: Array as () => Code[],
      default: () => []
    },
    expression: {
      type: Object as () => Expression
    },
    restriction: {
      type: Object as () => Restriction
    },
    superCategories: {
      type: Array as () => Category[],
      default: () => []
    },
    autofocusTitle: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'entityClicked', 'update:codes', 'update:descriptions', 'update:synonyms', 'update:units', 'update:expression', 'update:restriction',
    'update:dataType', 'update:score', 'update:titles', 'addSuperCategory', 'setSuperCategory', 'removeSuperCategory'
  ],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const { isRestricted, hasDataType, restrictionEntityTypes } = useEntityFormatter()
    const restrictionKey = ref(0)
    const showSuperCategoryInput = ref(false)

    return {
      t,
      isRestricted,
      hasDataType,
      restrictionEntityTypes,

      restrictionKey,
      EntityType,
      DataType,
      showSuperCategoryInput
    }
  }
})
</script>
