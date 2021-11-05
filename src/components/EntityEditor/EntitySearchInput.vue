<template>
  <q-select
    v-model="selection"
    rounded
    outlined
    dense
    hide-bottom-space
    hide-dropdown-icon
    use-input
    emit-value
    class="inline entity-search-input-field"
    :placeholder="selection ? '' : label || t('selectThing', { thing: t('entity') })"
    :options="options"
    :loading="loading"
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
    <template #selected>
      <span v-if="selection">
        <q-icon :name="selection.icon" />
        {{ selection.getTitle() }}
      </span>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-icon :name="scope.opt.getIcon()" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.getTitle() }}</q-item-label>
          <q-item-label v-for="(description, index) in scope.opt.getDescriptions()" :key="index" caption>
            {{ description }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section>
          {{ t('entitySearchInput.emptyResult', { types: t('entity', 2) }) }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchEntitiesByTitle } from 'src/api/entityRepository'
import { Entity } from 'src/models/Entity'

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
    const options = ref([] as Entity[])
    const selection = ref(null)
    const loading = ref(false)

    return {
      t, options, selection, loading,
      async filterFn (val: string, update: (arg0: () => void) => void, abort: () => void) {
        if (val.length < props.minLength) {
          abort()
          return
        }

        loading.value = true
        let result = await searchEntitiesByTitle(val)
          .finally(() => loading.value = false)

        update(() => options.value = result)
      }
    };
  },
});
</script>
