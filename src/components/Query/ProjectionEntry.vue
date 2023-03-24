<template>
  <q-item>
    <q-item-section avatar>
      <q-btn-group flat class="column">
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
    </q-item-section>
    <q-item-section v-if="!subject" class="text-bold text-negative">
      {{ t('thingIsInvalid', { thing: t('entity') }) }}
    </q-item-section>
    <q-item-section v-else :title="getSynonyms(subject)">
      <div class="row items-center fit non-selectable ellipsis">
        <q-icon size="1.3rem" class="q-mr-sm" :class="{ restriction: isRestricted(subject) }" :name="getIcon(subject)" />
        {{ getTitle(subject, true) }}
        <small class="q-ml-md">
          (
          <span v-if="defaultAggregationFunctionId" :title="t('aggregationFunction')">
            {{ te('functions.' + defaultAggregationFunctionId) ? t('functions.' + defaultAggregationFunctionId) : defaultAggregationFunctionId }}
          </span>
          <span v-if="dateTimeRestriction?.values?.length" :title="t('dateTimeRestriction')">
            , {{ dateTimeRestriction.values.map(e => e ? d(e, 'long') : 'NA').join(' - ') }}
          </span>
          )
        </small>
      </div>
    </q-item-section>
    <q-item-section side>
      <q-btn-group flat>
        <criterion-configuration
          :date-time-restriction="dateTimeRestriction"
          :default-aggregation-function-id="defaultAggregationFunctionId"
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
import CriterionConfiguration from './CriterionConfiguration.vue'
import { useEntity } from 'src/pinia/entity'
import { DateTimeRestriction, ExpressionFunction } from '@onto-med/top-api'

export default defineComponent({
  components: { CriterionConfiguration },
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
    upDisabled: Boolean,
    downDisabled: Boolean
  },
  emits: ['moveUp', 'moveDown', 'remove', 'update:dateTimeRestriction', 'update:defaultAggregationFunctionId'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d, te } = useI18n()
    const entityStore = useEntity()
    const { getSynonyms, isRestricted, getIcon, getTitle } = useEntityFormatter()

    return {
      t,
      te,
      d,
      subject: computed(() => entityStore.getEntity(props.subjectId)),
      getSynonyms,
      isRestricted,
      getIcon,
      getTitle
    }
  }
})
</script>
