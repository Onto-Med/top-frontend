<template>
  <q-scroll-area class="col entity-tab-content">
    <div v-if="entityType" class="q-gutter-md q-mt-none q-px-md q-pb-xl">
      <q-card>
        <q-toolbar v-if="!isRestricted(entityType)" class="q-my-none">
          <q-toolbar-title class="row items-center">
            <div
              v-if="![EntityType.SingleConcept, EntityType.CompositeConcept].includes(entityType)"
            >
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
                removeable
                @removeClicked="removeSuperCategory(index)"
                @entity-set="setSuperCategory(index, $event)"
                @entityClicked="$emit('entityClicked', $event)"
              />
              <q-chip
                icon="add"
                round
                clickable
                :disable="readonly"
                :label="t('more')"
                :title="t('addThing', { thing: t('superCategory') })"
                @click="addSuperCategory(undefined)"
              />
            </div>
            <div
              v-if="[EntityType.SingleConcept, EntityType.CompositeConcept].includes(entityType)"
            >
              <span class="q-mr-sm">{{ t('superConcept', 2) }}:</span>
              <entity-chip
                v-for="(concept, index) in superConcepts"
                :key="index"
                :organisation-id="organisationId"
                :repository-id="repositoryId"
                :entity-types="[EntityType.SingleConcept]"
                :entity-id="concept ? concept.id : undefined"
                :disable="readonly"
                :label="t('selectThing', { thing: t('concept') }) + '...'"
                removeable
                @removeClicked="removeSuperConcept(index)"
                @entity-set="setSuperConcept(index, $event)"
                @entityClicked="$emit('entityClicked', $event)"
              />
              <q-chip
                icon="add"
                round
                clickable
                :disable="readonly"
                :label="t('more')"
                :title="t('addThing', { thing: t('superConcept') })"
                @click="addSuperConcept(undefined)"
              />
            </div>
          </q-toolbar-title>
        </q-toolbar>
      </q-card>

      <div class="row q-col-gutter-md q-ma-none">
        <div class="col-12 col-md">
          <localized-text-input
            :model-value="titles"
            unique
            expanded
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
              <item-type-select
                v-if="hasItemType(entityType)"
                :model-value="itemType"
                :readonly="readonly"
                required
                description
                tooltip
                @update:model-value="$emit('update:itemType', $event)"
              />

              <data-type-select
                v-if="hasDataType(entityType)"
                :model-value="dataType"
                :readonly="readonly || version !== undefined"
                required
                @update:model-value="$emit('update:dataType', $event)"
              />

              <data-type-select
                v-else
                :model-value="DataType.Boolean"
                readonly
              />

              <unit-input
                v-if="[EntityType.SinglePhenotype, EntityType.CompositePhenotype].includes(entityType) && dataType === DataType.Number"
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
        :model-value="expression"
        can-be-switch
        expanded
        :readonly="readonly"
        :label="t('formula')"
        :help-text="t('entityEditor.formulaHelp')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="[EntityType.CompositePhenotype, EntityType.CompositeRestriction, EntityType.SinglePhenotype, EntityType.SingleRestriction]"
        :exclude-function-types="['textFunction']"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:expression', $event)"
      />

      <expression-input
        v-if="EntityType.CompositeConcept === entityType"
        :model-value="expression"
        expanded
        :readonly="readonly"
        :label="t('formula')"
        :help-text="t('entityEditor.textFormulaHelp')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="[EntityType.CompositeConcept, EntityType.SingleConcept]"
        :include-function-types="['textFunction']"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:expression', $event)"
      />

      <restriction-input
        v-if="[EntityType.SingleRestriction, EntityType.CompositeRestriction].includes(entityType) && superPhenotype"
        :key="restrictionKey"
        :model-value="restriction"
        :unit="superPhenotype.unit"
        expanded
        :readonly="readonly"
        @update:model-value="$emit('update:restriction', $event)"
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
import {defineComponent, onMounted, PropType, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  Category,
  Code,
  Concept,
  DataType,
  Entity,
  EntityType,
  Expression,
  ItemType,
  LocalisableText,
  Phenotype,
  Restriction
} from '@onto-med/top-api'
import LocalizedTextInput from 'src/components/EntityEditor/LocalizedTextInput.vue'
import DataTypeSelect from 'src/components/EntityEditor/DataTypeSelect.vue'
import ItemTypeSelect from 'src/components/EntityEditor/ItemTypeSelect.vue'
import RestrictionInput from 'src/components/EntityEditor/RestrictionInput.vue'
import ExpressionInput from 'src/components/EntityEditor/Expression/ExpressionInput.vue'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import UnitInput from 'src/components/UnitInput.vue'
import CodeInput from 'src/components/EntityEditor/CodeInput.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import {useEntity} from 'src/pinia/entity'
import {useRouter} from 'vue-router'

export default defineComponent({
  components: {
    LocalizedTextInput,
    DataTypeSelect,
    ItemTypeSelect,
    RestrictionInput,
    ExpressionInput,
    UnitInput,
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
    itemType: {
      type: String as PropType<ItemType>
    },
    unit: {
      type: String
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
    superConcepts: {
      type: Array as () => Concept[],
      default: () => []
    },
    restrictionKey: Number
  },
  emits: [
    'entityClicked', 'update:codes', 'update:descriptions', 'update:synonyms', 'update:unit', 'update:expression', 'update:restriction',
    'update:dataType', 'update:titles', 'update:superCategories', 'update:itemType'
  ],
  setup (props, { emit }) {
    const { t } = useI18n()
    const router = useRouter()
    const { isRestricted, hasDataType, hasItemType, restrictionEntityTypes, getTitle } = useEntityFormatter()
    const entityStore = useEntity()
    const showSuperCategoryInput = ref(false)
    const superPhenotype = ref(undefined as Phenotype|undefined)

    onMounted(async () => {
      await entityStore
        .loadSuperPhenotype(props.entityId)
        .then(e => superPhenotype.value = e)
        .catch((e: Error) => console.log(e))
    })

    return {
      t,
      isRestricted,
      hasDataType,
      hasItemType,
      restrictionEntityTypes,
      getTitle,

      EntityType,
      DataType,
      showSuperCategoryInput,
      superPhenotype,

      routeToEntity (entity: Entity|undefined) {
        if (!entity || !entity.repository || !entity.repository.organisation) return
        void router.push({ name: 'editor', params: { organisationId: entity.repository.organisation.id, repositoryId: entity.repository.id, entityId: entity.id } })
      },

      addSuperCategory (category: Category|undefined): void {
        const newValue = props.superCategories || []
        if (!category || newValue.findIndex(c => c && c.id === category.id) === -1)
          if (props.entityId !== category?.id) newValue.push(category as Category)
        emit('update:superCategories', newValue)
      },

      setSuperCategory (index: number, category: Category): void {
        const newValue = props.superCategories || []
        if (newValue.findIndex(c => c && c.id === category.id) === -1)
          if (props.entityId !== category.id) newValue[index] = category
        emit('update:superCategories', newValue)
      },

      removeSuperCategory (index: number): void {
        const newValue = props.superCategories
        if (!newValue) return
        newValue.splice(index, 1)
        emit('update:superCategories', newValue)
      },

      addSuperConcept (concept: Concept|undefined): void {
        const newValue = props.superConcepts || []
        if (!concept || newValue.findIndex(c => c && c.id === concept.id) === -1)
          if (props.entityId !== concept?.id) newValue.push(concept as Concept)
        emit('update:superCategories', newValue)
      },

      setSuperConcept (index: number, concept: Concept): void {
        const newValue = props.superConcepts || []
        if (newValue.findIndex(c => c && c.id === concept.id) === -1)
          if (props.entityId !== concept.id) newValue[index] = concept
        emit('update:superCategories', newValue)
      },

      removeSuperConcept (index: number): void {
        const newValue = props.superConcepts
        if (!newValue) return
        newValue.splice(index, 1)
        emit('update:superCategories', newValue)
      },
    }
  }
})
</script>
