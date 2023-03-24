<template>
  <q-item>
    <q-item-section avatar>
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
        :icon="inclusion ? 'check' : 'block'"
        color="positive"
        :title="inclusion ? t('inclusion') : t('exclusion')"
        @update:model-value="$emit('update:inclusion', $event)"
      />
    </q-item-section>
    <q-item-section v-if="!subject" class="text-bold text-negative">
      {{ t('thingIsInvalid', { thing: t('entity') }) }}
    </q-item-section>
    <q-item-section v-else :title="getSynonyms(subject)">
      <div class="row items-center fit non-selectable ellipsis">
        <q-icon size="1.3rem" class="q-mr-sm" :class="{ restriction: isRestricted(subject) }" :name="getIcon(subject)" />
        {{ getTitle(subject, true) }}
        <small v-if="requiresAggregationFunction" class="q-ml-md">
          (
          <span v-if="defaultAggregationFunctionId" :title="t('aggregationFunction')">
            {{ te('functions.' + defaultAggregationFunctionId) ? t('functions.' + defaultAggregationFunctionId) : defaultAggregationFunctionId }}
          </span>
          <span v-if="dateTimeRestrictionValues" :title="t('dateTimeRestriction')">
            , {{ dateTimeRestrictionValues.join(' - ') }}
          </span>
          )
        </small>
        <small v-else-if="dateTimeRestrictionValues" class="q-ml-md" :title="t('dateTimeRestriction')">
          ( {{ dateTimeRestrictionValues.join(' - ') }} )
        </small>
      </div>
    </q-item-section>
    <q-item-section side>
      <q-btn-group flat>
        <query-subject-configuration
          :date-time-restriction="dateTimeRestriction"
          :default-aggregation-function-id="defaultAggregationFunctionId"
          :show-aggregation-function="requiresAggregationFunction"
          :aggregation-function-options="aggregationFunctionOptions"
          @update:date-time-restriction="$emit('update:dateTimeRestriction', $event)"
          @update:default-aggregation-function-id="$emit('update:defaultAggregationFunctionId', $event)"
        />
        <q-btn icon="remove" :title="t('removeThing', { thing: t('selection') })" @click="$emit('remove')" />
      </q-btn-group>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import QuerySubjectConfiguration from './QuerySubjectConfiguration.vue'
import { useEntity } from 'src/pinia/entity'
import { DateTimeRestriction, ExpressionFunction } from '@onto-med/top-api'

export default defineComponent({
  components: { QuerySubjectConfiguration },
  props: {
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
    },
  },
  emits: [
    'moveUp', 'moveDown', 'remove',
    'update:dateTimeRestriction', 'update:defaultAggregationFunctionId', 'update:inclusion'
  ],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d, te } = useI18n()
    const entityStore = useEntity()
    const { getSynonyms, isRestricted, getIcon, getTitle, requiresAggregationFunction } = useEntityFormatter()
    const subject = computed(() => entityStore.getEntity(props.subjectId))

    return {
      t,
      te,
      d,
      subject,
      getSynonyms,
      isRestricted,
      getIcon,
      getTitle,

      requiresAggregationFunction: computed(() => subject.value ? requiresAggregationFunction(subject.value) : false),

      dateTimeRestrictionValues: computed(() => {
        if (
          !props.dateTimeRestriction?.values
          || !props.dateTimeRestriction.values.length
          || !props.dateTimeRestriction.values.find(v => !!v)
        ) return undefined
        return props.dateTimeRestriction.values.map(e => e ? d(e, 'long') : 'NA')
      })
    }
  }
})
</script>
