<template>
  <q-select
    :model-value="selection"
    rounded
    outlined
    dense
    hide-bottom-space
    use-input
    class="inline entity-search-input-field"
    :label="label || t('selectThing', { thing: t('entity') })"
    :options="options"
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
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

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
    // TODO: get proper options from API
    const stringOptions = ['height', 'weight', 'bmi']
    const options = ref([] as string[])
    const selection = ref(null)

    return {
      t, options, selection,
      filterFn (val: string, update: (arg0: () => void) => void, abort: () => void) {
        if (val.length < props.minLength) {
          abort()
          return
        }

        update(() => {
          const needle = val.toLowerCase()
          // TODO: do filtering via API
          options.value = stringOptions.filter(v => v.toLowerCase().indexOf(needle) > -1)
        })
      }
    };
  },
});
</script>

<style lang="sass" scoped>
.entity-search-input-field
  width: 200px
</style>