<template>
  <q-item v-if="!entity">
    <q-item-section class="text-bold text-negative">
      {{ t('thingIsInvalid', { thing: t('entity') }) }}
    </q-item-section>
  </q-item>
  <div v-else>
    <q-item>
      <q-item-section v-if="showEntityType" avatar top>
        <q-icon
          :name="getIcon(entity)"
          :title="getIconTooltip(entity)"
          size="2rem"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label v-if="showRepository" overline>
          {{ entity.repository?.name }}
        </q-item-label>
        <q-item-label class="q-mb-sm">
          {{ getTitle(entity, true) }}
        </q-item-label>

        <q-item-label v-if="showDescriptions && descriptions.length" caption>
          <b>{{ t('description', 2) }}:</b>
          <p v-for="description in descriptions" :key="description" class="q-mb-sm">
            {{ description }}
          </p>
        </q-item-label>

        <q-item-label v-if="showSynonyms && synonyms.length" caption>
          <b>{{ t('synonym', 2) }}:</b>
          <p v-for="synonym in synonyms" :key="synonym" class="q-mb-sm">
            {{ synonym }}
          </p>
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item v-if="showExpression && expression" class="q-pa-none">
      <q-item-section>
        <q-separator />
        <expression-input
          :label="t('formula')"
          :model-value="expression"
          readonly
          expanded
          flat
          @entity-clicked="$emit('entityClicked', $event)"
        />
        <q-separator />
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup lang="ts">
import { Entity } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import ExpressionInput from 'src/components/EntityEditor/Expression/ExpressionInput.vue'
import { computed } from 'vue'

const props = defineProps({
  /** The entity to be displayed. */
  entity: {
    type: Object as () => Entity,
    required: true
  },
  /** Whether descriptions should be displayed. */
  showDescriptions: Boolean,
  /** Whether the entity type should be indicated with an icon. */
  showEntityType: Boolean,
  /** Whether the expression should be displayed, if any. */
  showExpression: Boolean,
  /** Whether the repository that contains the entity should be displayed above the title. */
  showRepository: Boolean,
  /** Whether synonyms should be displayed. */
  showSynonyms: Boolean
})

defineEmits(['entityClicked'])

const { t } = useI18n()
const {
  getDescriptions, getIcon, getIconTooltip,
  getSynonyms, getTitle, hasExpression
} = useEntityFormatter()

const descriptions = computed(
  () => getDescriptions(props.entity)
)
const synonyms = computed(
  () => getSynonyms(props.entity)
)
const expression = computed(
  () => hasExpression(props.entity) ? props.entity.expression : undefined
)

</script>
