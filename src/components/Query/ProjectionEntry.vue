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
      </div>
    </q-item-section>
    <q-item-section side>
      <q-btn-group flat>
        <q-btn
          :icon="sorting === Sorting.Desc ? 'arrow_downward' : 'arrow_upward'"
          :label="$q.screen.gt.md ? t(sorting) : ''"
          :title="t('sorting')"
          @click="$emit('update:sorting', sorting === Sorting.Asc ? Sorting.Desc : Sorting.Asc)"
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
import { useEntity } from 'src/pinia/entity'
import { Sorting } from '@onto-med/top-api'

export default defineComponent({
  props: {
    subjectId: {
      type: String,
      required: true
    },
    sorting: String as () => Sorting,
    upDisabled: Boolean,
    downDisabled: Boolean
  },
  emits: ['moveUp', 'moveDown', 'remove', 'update:sorting'],
  setup (props) {
    const { t } = useI18n()
    const entityStore = useEntity()
    const { getSynonyms, isRestricted, getIcon, getTitle } = useEntityFormatter()

    return {
      t,
      Sorting,
      subject: computed(() => entityStore.getEntity(props.subjectId)),
      getSynonyms,
      isRestricted,
      getIcon,
      getTitle
    }
  }
})
</script>
