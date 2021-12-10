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
    @update:model-value="handleSelectionChanged"
  >
    <template #append>
      <q-btn
        v-show="!loading"
        round
        dense
        flat
        :icon="icon"
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
          <q-icon :name="scope.opt.getIcon()" :title="scope.opt.getIconTooltip()" :class="{ restriction: scope.opt.isRestriction() }" />
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
import { searchEntities } from 'src/api/entityRepository'
import { FullEntity } from 'src/models/Entity'
import { EntityType } from '@onto-med/top-api';

export default defineComponent({
  name: 'EntitySearchInput',
  props: {
    label: String,
    minLength: {
      type: Number,
      default: 2
    },
    icon: {
      type: String,
      default: 'close'
    },
    entityTypes: Array as () => EntityType[],
    clearOnSelect: {
      type: Boolean,
      default: false
    }
  },
  emits: ['clearClicked', 'entitySelected'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    const options = ref([] as FullEntity[])
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
        let result = await searchEntities(val, props.entityTypes)
          .finally(() => loading.value = false)

        update(() => options.value = result)
      },
      handleSelectionChanged (entity: FullEntity) {
        if (props.clearOnSelect) selection.value = null
        emit('entitySelected', entity)
      }
    }
  },
});
</script>
