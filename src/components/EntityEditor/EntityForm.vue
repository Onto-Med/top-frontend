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
              removeable
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
          :readonly="readonly"
          :required="true"
          :label="t('title', 2)"
          :help-text="t('entityEditor.titlesHelp')"
          class="col"
          @update:model-value="$emit('update:titles', $event)"
        />

        <q-card v-show="isRestricted(entityType) || hasDataType(entityType)" class="col-4">
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

      <expression-input
        v-if="entityType === EntityType.CompositePhenotype"
        :model-value="expression"
        expanded
        :readonly="readonly"
        :label="t('formula')"
        :help-text="t('entityEditor.formulaHelp')"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="[EntityType.CompositePhenotype, EntityType.CompositeRestriction, EntityType.SinglePhenotype, EntityType.SingleRestriction]"
        function-type="math"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:expression', $event)"
      />

      <restriction-input
        v-if="[EntityType.SingleRestriction, EntityType.CompositeRestriction].includes(entityType)"
        :key="restrictionKey"
        :model-value="restriction"
        :unit="superPhenotype?.unit"
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
import { ref, defineComponent, PropType, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityType, DataType, LocalisableText, Code, Expression, Restriction, Category, Entity, ItemType  } from '@onto-med/top-api'
import LocalizedTextInput from 'src/components/EntityEditor/LocalizedTextInput.vue'
import DataTypeSelect from 'src/components/EntityEditor/DataTypeSelect.vue'
import ItemTypeSelect from 'src/components/EntityEditor/ItemTypeSelect.vue'
import RestrictionInput from 'src/components/EntityEditor/RestrictionInput.vue'
import ExpressionInput from 'src/components/EntityEditor/Expression/ExpressionInput.vue'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import UnitInput from 'src/components/UnitInput.vue'
import CodeInput from 'src/components/EntityEditor/CodeInput.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntity } from 'src/pinia/entity'
import { useRouter } from 'vue-router'

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
    score: {
      type: Number
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
    restrictionKey: Number
  },
  emits: [
    'entityClicked', 'update:codes', 'update:descriptions', 'update:synonyms', 'update:unit', 'update:expression', 'update:restriction',
    'update:dataType', 'update:score', 'update:titles', 'addSuperCategory', 'setSuperCategory', 'removeSuperCategory', 'update:itemType'
  ],
  setup (props) {
    const { t } = useI18n()
    const router = useRouter()
    const { isRestricted, hasDataType, hasItemType, restrictionEntityTypes, getTitle } = useEntityFormatter()
    const entityStore = useEntity()
    const showSuperCategoryInput = ref(false)
    const superPhenotype = ref(undefined as Entity|undefined)

    onMounted(async () => {
      await entityStore
        .loadSuperPhenotype(props.entityId)
        .then(e => superPhenotype.value = e)
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

      routeToEntity (entity: Entity) {
        if (!entity.repository || !entity.repository.organisation) return
        void router.push({ name: 'editor', params: { organisationId: entity.repository.organisation.id, repositoryId: entity.repository.id, entityId: entity.id } })
      }
    }
  }
})
</script>
