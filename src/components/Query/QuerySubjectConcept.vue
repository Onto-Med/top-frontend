<template>
  <q-item>
    <q-item-section v-if="!subject" class="text-bold text-negative">
      {{ t('thingIsInvalid', { thing: t('entity') }) }}
    </q-item-section>
    <q-item-section v-else :title="getSynonyms(subject)">
      <div class="row items-center fit non-selectable ellipsis">
        <q-icon size="1.3rem" class="q-mr-sm gt-sm" :name="getIcon(subject)" />
        {{ getTitle(subject, true) }}
      </div>
    </q-item-section>
    <q-item-section side>
      <q-btn-group flat>
        <query-subject-configuration-concept
          :date-time-restriction="dateTimeRestriction"
          :concept-language="defaultLanguage"
          @update:date-time-restriction="$emit('update:dateTimeRestriction', $event)"
        />
        <q-btn dense icon="remove" :title="t('remove')" @click="$emit('remove')" />
      </q-btn-group>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import QuerySubjectConfigurationConcept from './QuerySubjectConfiguration.vue'
import { useEntity } from 'src/pinia/entity'
import { DateTimeRestriction, Entity } from '@onto-med/top-api'

export default defineComponent({
  components: { QuerySubjectConfigurationConcept },
  props: {
    dateTimeRestriction: {
      type: Object as () => DateTimeRestriction
    },
    subjectId: {
      type: String,
      required: true
    }
  },
  emits: [
    'remove', 'update:dateTimeRestriction'
  ],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d, te } = useI18n()
    const entityStore = useEntity()
    const { getSynonyms, isRestricted, getIcon, getTitle } = useEntityFormatter()
    const subject = ref<Entity>()

    const loadEntity = (subjectId: string) => entityStore.loadEntity(subjectId).then(e => subject.value = e)

    watch(
      () => props.subjectId,
      (val) => loadEntity(val)
    )
    onBeforeMount(() => loadEntity(props.subjectId))

    return {
      t,
      te,
      d,
      subject,
      getSynonyms,
      isRestricted,
      getIcon,
      getTitle,

      dateTimeRestrictionValues: computed(() => {
        if (
          !props.dateTimeRestriction?.values
          || !props.dateTimeRestriction.values.length
          || !props.dateTimeRestriction.values.find(v => !!v)
        ) return undefined
        return props.dateTimeRestriction.values.map(e => e ? d(e, 'long') : 'NA')
      }),

      defaultLanguage: computed( () => {
        return 'de'
      })
    }
  }
})
</script>
