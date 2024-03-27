<template>
  <q-item v-if="!subject">
    <q-item-section v-if="!subject" class="text-bold text-negative">
      {{ t('thingIsInvalid', { thing: t('entity') }) }}
    </q-item-section>
  </q-item>

  <q-item v-else>
    <q-item-section avatar class="col-auto">
      <q-btn-group v-if="sortable" flat class="column">
        <q-btn
          dense
          :disable="upDisabled"
          icon="keyboard_arrow_up"
          size="sm"
          class="q-pa-none"
          @click="$emit('moveUp')"
        />
        <q-btn
          dense
          :disable="downDisabled"
          icon="keyboard_arrow_down"
          size="sm"
          class="q-pa-none"
          @click="$emit('moveDown')"
        />
      </q-btn-group>
      <q-toggle
        v-if="excludable"
        :model-value="inclusion"
        dense
        :icon="inclusion ? 'check' : 'block'"
        color="positive"
        :title="inclusion ? t('inclusion') : t('exclusion')"
        @update:model-value="$emit('update:inclusion', $event)"
      />
    </q-item-section>
    <q-item-section avatar class="col-auto gt-sm">
      <q-icon
        size="1.3rem"
        :class="{ restriction: isRestricted(subject) }"
        :name="getIcon(subject)"
        :title="getIconTooltip(subject)"
      />
    </q-item-section>
    <q-item-section :title="getSynonyms(subject)">
      <q-item-label>
        {{ getTitle(subject, true) }}
      </q-item-label>
      <q-item-label v-if="isAggregationRequired" caption class="gt-xs non-selectable">
        <small>
          (<span v-if="defaultAggregationFunctionId" :title="t('aggregationFunction')">
            {{
              te('functions.' + defaultAggregationFunctionId)
                ? t('functions.' + defaultAggregationFunctionId)
                : defaultAggregationFunctionId
            }}
          </span>
          <span v-if="dateTimeRestrictionValues" :title="t('dateTimeRestriction')">
            , {{ dateTimeRestrictionValues.join(' - ') }} </span
          >)
        </small>
      </q-item-label>
      <q-item-label
        v-else-if="dateTimeRestrictionValues"
        caption
        :title="t('dateTimeRestriction')"
        class="gt-xs non-selectable"
      >
        <small> ({{ dateTimeRestrictionValues.join(' - ') }}) </small>
      </q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-btn-group flat class="items-center">
        <div
          v-show="hasItemType(subject) && (!subject.codes || !subject.codes.length)"
          class="text-subtitle2 text-warning"
          :title="t('codeMissingDescription')"
        >
          <q-icon name="warning" />
          <span class="gt-md">{{ t('codeMissing') }}</span>
        </div>
        <query-subject-configuration
          :date-time-restriction="dateTimeRestriction"
          :default-aggregation-function-id="defaultAggregationFunctionId"
          :show-aggregation-function="isAggregationRequired"
          :aggregation-function-options="aggregationFunctionOptions"
          @update:date-time-restriction="$emit('update:dateTimeRestriction', $event)"
          @update:default-aggregation-function-id="$emit('update:defaultAggregationFunctionId', $event)"
        />
        <q-btn dense icon="remove" :title="t('remove')" @click="$emit('remove')" />
      </q-btn-group>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import QuerySubjectConfiguration from './QuerySubjectConfiguration.vue'
import { useEntity } from 'src/pinia/entity'
import { DateTimeRestriction, Entity, ExpressionFunction } from '@onto-med/top-api'

const props = defineProps({
  dateTimeRestriction: {
    type: Object as () => DateTimeRestriction
  },
  defaultAggregationFunctionId: {
    type: String,
    require: true
  },
  aggregationFunctionOptions: {
    type: Array as () => ExpressionFunction[]
  },
  subjectId: {
    type: String,
    required: true
  },
  sortable: Boolean,
  upDisabled: Boolean,
  downDisabled: Boolean,
  excludable: Boolean,
  inclusion: {
    type: Boolean,
    default: true
  }
})

defineEmits([
  'moveUp',
  'moveDown',
  'remove',
  'update:dateTimeRestriction',
  'update:defaultAggregationFunctionId',
  'update:inclusion'
])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, d, te } = useI18n()
const entityStore = useEntity()
const { getSynonyms, hasItemType, isRestricted, getIcon, getIconTooltip, getTitle, requiresAggregationFunction } =
  useEntityFormatter()
const subject = ref<Entity>()

watch(
  () => props.subjectId,
  (val) => loadEntity(val)
)

function loadEntity(subjectId: string) {
  entityStore.loadEntity(subjectId).then(
    (e) => (subject.value = e),
    () => {}
  )
}

onBeforeMount(() => loadEntity(props.subjectId))

const isAggregationRequired = computed(() => (subject.value ? requiresAggregationFunction(subject.value) : false))

const dateTimeRestrictionValues = computed(() => {
  if (
    !props.dateTimeRestriction?.values ||
    !props.dateTimeRestriction.values.length ||
    !props.dateTimeRestriction.values.find((v) => !!v)
  )
    return undefined
  return props.dateTimeRestriction.values.map((e) => (e ? d(e, 'shortWithTime') : 'NA'))
})
</script>
