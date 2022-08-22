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
        <small v-if="defaultAggregationFunction" :title="t('aggregationFunction')" class="q-ml-md">
          ({{ defaultAggregationFunction.title }})
        </small>
      </div>
    </q-item-section>
    <q-item-section side>
      <q-btn-group flat>
        <criterion-configuration
          :date-time-restrictions="dateTimeRestrictions"
          :default-aggregation-function="defaultAggregationFunction"
          :aggregation-function-options="aggregationFunctionOptions"
          @update:date-time-restrictions="$emit('update:dateTimeRestrictions', $event)"
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
    dateTimeRestrictions: {
      type: Array as () => DateTimeRestriction[]
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
  emits: ['removeClicked', 'update:exclusion', 'update:dateTimeRestrictions', 'update:defaultAggregationFunction'],
  setup () {
    const { t } = useI18n()
    const { getSynonyms, isRestricted, getIcon, getTitle } = useEntityFormatter()

    return {
      t,
      getSynonyms,
      isRestricted,
      getIcon,
      getTitle
    }
  }
})
</script>
