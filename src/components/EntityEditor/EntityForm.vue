<template>
  <q-scroll-area class="col entity-tab-content">
    <div v-if="entityType" class="q-gutter-md q-mt-none q-px-md q-pb-xl">
      <div class="row q-col-gutter-md q-ma-none">
        <div class="col-12 col-md">
          <localized-text-input
            v-model:expanded="showTitle"
            :model-value="titles"
            unique
            :readonly="readonly"
            :required="true"
            :label="t('title', 2)"
            :help-text="t('entityEditor.titlesHelp')"
            @update:model-value="$emit('update:titles', $event)"
          />
        </div>

        <div v-show="isRestricted(entityType) || hasDataType(entityType)" class="col-12 col-md-4">
          <q-card>
            <q-card-section>
              <enum-select
                v-if="hasItemType(entityType)"
                i18n-prefix="itemType"
                :selected="itemType"
                :readonly="readonly"
                :enum="ItemType"
                required
                show-description
                show-tooltip
                @update:selected="$emit('update:itemType', $event)"
              />

              <enum-select
                v-if="hasDataType(entityType)"
                :selected="dataType"
                :readonly="readonly || version !== undefined"
                :enum="DataType"
                i18n-prefix="dataType"
                required
                @update:selected="$emit('update:dataType', $event)"
              />

              <enum-select v-else :selected="DataType.Boolean" i18n-prefix="dataType" readonly />

              <unit-input
                v-if="
                  [EntityType.SinglePhenotype, EntityType.CompositePhenotype].includes(entityType) &&
                  dataType === DataType.Number
                "
                :model-value="unit"
                :readonly="readonly"
                show-label
                @update:model-value="$emit('update:unit', $event)"
              />

              <div v-if="isRestricted(entityType) && superPhenotype">
                {{ t('restrictionOf') }}:
                <q-btn
                  flat
                  dense
                  no-caps
                  :label="getTitle(superPhenotype, false, true)"
                  :title="t('showThing', { thing: t('phenotype') })"
                  @click="routeToEntity(superPhenotype)"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <expression-input
        v-if="EntityType.CompositePhenotype === entityType"
        v-model:expanded="showExpression"
        :model-value="expression"
        can-be-switch
        :readonly="readonly"
        :label="t('formula')"
        :help-text="t('entityEditor.formulaHelp')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="[
          EntityType.CompositePhenotype,
          EntityType.CompositeRestriction,
          EntityType.SinglePhenotype,
          EntityType.SingleRestriction
        ]"
        :exclude-function-types="['textFunction']"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:expression', $event)"
      />

      <expression-input
        v-if="EntityType.CompositeConcept === entityType"
        v-model:expanded="showExpression"
        :model-value="expression"
        :readonly="readonly"
        :label="t('formula')"
        :help-text="t('entityEditor.textFormulaHelp')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="[EntityType.CompositeConcept, EntityType.SingleConcept]"
        :include-function-types="['component', 'textFunction']"
        :exclude-functions="['Constant']"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:expression', $event)"
      />

      <restriction-input
        v-if="[EntityType.SingleRestriction, EntityType.CompositeRestriction].includes(entityType) && superPhenotype"
        :key="restrictionKey"
        v-model:expanded="showExpression"
        :model-value="restriction"
        :unit="superPhenotype.unit"
        :readonly="readonly"
        @update:model-value="$emit('update:restriction', $event)"
      />

      <localized-text-input
        v-model:expanded="showSynonyms"
        :model-value="synonyms"
        :readonly="readonly"
        :label="t('synonym', 2)"
        :help-text="t('entityEditor.synonymsHelp')"
        @update:model-value="$emit('update:synonyms', $event)"
      />

      <localized-text-input
        v-model:expanded="showDescriptions"
        :model-value="descriptions"
        text-area
        rows="3"
        :readonly="readonly"
        :label="t('description', 2)"
        :help-text="t('entityEditor.descriptionsHelp')"
        @update:model-value="$emit('update:descriptions', $event)"
      />

      <code-input-card
        v-model:expanded="showCodes"
        :model-value="codes"
        :readonly="readonly"
        :warning-if-empty="hasItemType(entityType)"
        @update:model-value="$emit('update:codes', $event)"
      />
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { onMounted, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Code,
  Concept,
  DataType,
  EntityType,
  Expression,
  ItemType,
  LocalisableText,
  Phenotype,
  Restriction
} from '@onto-med/top-api'
import LocalizedTextInput from 'src/components/EntityEditor/LocalizedTextInput.vue'
import EnumSelect from 'src/components/EnumSelect.vue'
import RestrictionInput from 'src/components/EntityEditor/RestrictionInput.vue'
import ExpressionInput from 'src/components/EntityEditor/Expression/ExpressionInput.vue'
import UnitInput from 'src/components/UnitInput.vue'
import CodeInputCard from 'src/components/EntityEditor/Code/CodeInputCard.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntity } from 'src/pinia/entity'

const props = defineProps({
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
  entityType: String as PropType<EntityType>,
  dataType: String as PropType<DataType>,
  itemType: String as PropType<ItemType>,
  unit: String,
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
  expression: Object as () => Expression,
  restriction: Object as () => Restriction,
  superConcepts: {
    type: Array as () => Concept[],
    default: () => []
  },
  restrictionKey: Number
})

defineEmits([
  'entityClicked',
  'update:codes',
  'update:descriptions',
  'update:synonyms',
  'update:unit',
  'update:expression',
  'update:restriction',
  'update:dataType',
  'update:titles',
  'update:itemType'
])

const { t } = useI18n()
const { isRestricted, hasDataType, hasItemType, getTitle, routeToEntity } = useEntityFormatter()
const entityStore = useEntity()
const superPhenotype = ref(undefined as Phenotype | undefined)

onMounted(async () => {
  await entityStore
    .loadSuperPhenotype(props.entityId)
    .then((e) => (superPhenotype.value = e))
    .catch((e: Error) => console.log(e))
})

const showTitle = ref(true)
const showExpression = ref(true)
const showDescriptions = ref(props.descriptions && props.descriptions.length > 0)
const showSynonyms = ref(props.synonyms && props.synonyms.length > 0)
const showCodes = ref(props.codes && props.codes.length > 0)
</script>
