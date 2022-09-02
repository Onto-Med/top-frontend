<template>
  <q-item>
    <q-item-section avatar>
      <q-toggle
        :model-value="exclusion"
        :icon="exclusion ? 'block' : 'check'"
        color="red"
        :title="exclusion ? t('exclusion') : t('inclusion')"
        @update:model-value="$emit('update:exclusion', $event)"
      />
    </q-item-section>
    <q-item-section :title="getSynonyms(subject)">
      <div class="row items-center fit non-selectable">
        <q-icon size="1.3rem" class="q-mr-sm" :class="{ restriction: isRestricted(subject) }" :name="getIcon(subject)" />
        {{ getTitle(subject) }}
        <small class="q-ml-md">
          (
          <span v-if="defaultAggregationFunction" :title="t('aggregationFunction')">
            {{ te('functions.' + defaultAggregationFunction.title) ? t('functions.' + defaultAggregationFunction.title) : defaultAggregationFunction.title }}
          </span>
          <span v-if="dateTimeRestriction && dateTimeRestriction.values.length" :title="t('dateTimeRestriction')">
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
          :default-aggregation-function="defaultAggregationFunction"
          :aggregation-function-options="aggregationFunctionOptions"
          @update:date-time-restriction="$emit('update:dateTimeRestriction', $event)"
          @update:default-aggregation-function="$emit('update:defaultAggregationFunction', $event)"
        />
        <q-btn icon="remove" :title="t('removeThing', { thing: t('criterion') })" @click="$emit('removeClicked')" />
      </q-btn-group>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { Phenotype, DateTimeRestriction, ExpressionFunction } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import CriterionConfiguration from './CriterionConfiguration.vue'

export default defineComponent({
  components: { CriterionConfiguration },
  props: {
    exclusion: {
      type: Boolean,
      default: false
    },
    dateTimeRestriction: {
      type: Object as () => DateTimeRestriction
    },
    defaultAggregationFunction: {
      type: Object as () => ExpressionFunction,
      require: true
    },
    aggregationFunctionOptions: {
      type: Array as () => ExpressionFunction[]
    },
    subject: {
      type: Object as () => Phenotype,
      required: true
    }
  },
  emits: ['removeClicked', 'update:exclusion', 'update:dateTimeRestriction', 'update:defaultAggregationFunction'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, te, d } = useI18n()
    const { getSynonyms, isRestricted, getIcon, getTitle } = useEntityFormatter()

    return {
      t,
      te,
      d,
      getSynonyms,
      isRestricted,
      getIcon,
      getTitle
    }
  }
})
</script>
