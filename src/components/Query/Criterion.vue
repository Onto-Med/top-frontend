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
      </div>
    </q-item-section>
    <q-item-section side>
      <q-btn-group flat>
        <criterion-configuration
          :age-restrictions="ageRestrictions"
          :date-time-restrictions="dateTimeRestrictions"
          @update:age-restrictions="$emit('update:ageRestrictions', $event)"
          @update:date-time-restrictions="$emit('update:dateTimeRestrictions', $event)"
        />
        <q-btn icon="remove" :title="t('removeThing', { thing: t('criterion') })" @click="$emit('removeClicked')" />
      </q-btn-group>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { Phenotype, NumberRestriction, DateTimeRestriction } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import CriterionConfiguration from './CriterionConfiguration.vue'

export default defineComponent({
  components: { CriterionConfiguration },
  props: {
    exclusion: {
      type: Boolean,
      default: false
    },
    ageRestrictions: {
      type: Array as () => NumberRestriction[]
    },
    dateTimeRestrictions: {
      type: Array as () => DateTimeRestriction[]
    },
    subject: {
      type: Object as () => Phenotype,
      required: true
    }
  },
  emits: ['removeClicked', 'update:exclusion', 'update:ageRestrictions', 'update:dateTimeRestrictions'],
  setup() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
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
