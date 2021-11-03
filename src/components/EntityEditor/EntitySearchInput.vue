<template>
  <q-select
    :model-value="selection"
    rounded
    outlined
    dense
    hide-bottom-space
    use-input
    emit-value
    class="inline entity-search-input-field"
    :placeholder="label || t('selectThing', { thing: t('entity') })"
    :options="options"
    :title="t('entitySearchInput.description', { minLength: minLength, types: t('entity', 2) })"
    @filter="filterFn"
    @update:model-value="$emit('entitySelected', $event)"
  >
    <template #append>
      <q-btn
        round
        dense
        flat
        icon="close"
        :title="t('remove')"
        @click="$emit('clearClicked')"
      />
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchEntitiesByTitle } from 'src/api/entityRepository'

export default defineComponent({
  name: 'EntitySearchInput',
  props: {
    label: String,
    minLength: {
      type: Number,
      default: 2
    }
  },
  emits: ['clearClicked', 'entitySelected'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    const options = ref([] as Record<string, string|undefined>[])
    const selection = ref(null)

    return {
      t, options, selection,
      filterFn (val: string, update: (arg0: () => void) => void, abort: () => void) {
        if (val.length < props.minLength) {
          abort()
          return
        }

        update(() => {
          options.value = searchEntitiesByTitle(val)
            .map(e => { return { label: e.title, value: e.id } })
        })
      }
    };
  },
});
</script>

<style lang="sass">
.entity-search-input-field
  .q-field__append.q-anchor--skip:last-of-type
    display: none
</style>