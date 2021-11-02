<template>
  <q-input
    rounded
    outlined
    dense
    type="text"
    class="inline entity-search-input-field"
    :label="label || t('selectThing', { thing: t('entity') })"
  >
    <template #append>
      <q-btn
        round
        dense
        flat
        icon="close"
        @click="$emit('clearClicked')"
      />
    </template>
  </q-input>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'EntitySearchInput',
  props: {
    label: String
  },
  emits: ['clearClicked'],
  setup() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    return { t };
  },
});
</script>

<style lang="sass" scoped>
.entity-search-input-field
  width: 200px
</style>