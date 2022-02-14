<template>
  <q-select
    :model-value="modelValue"
    use-input
    emit-value
    clearable
    :label="modelValue ? '' : label || t('selectThing', { thing: t('organisation') })"
    :options="options"
    :loading="loading"
    :title="t('entitySearchInput.description', { minLength: minLength, types: t('organisation', 2) })"
    @filter="filterFn"
    @update:model-value="$emit('update:model-value', $event)"
  >
    <template #selected>
      <span v-if="modelValue">
        {{ modelValue.name }}
      </span>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.name }}</q-item-label>
          <q-item-label caption>
            {{ scope.opt.description }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section>
          {{ t('entitySearchInput.emptyResult', { types: t('organisation', 2) }) }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { OrganisationApiKey } from 'src/boot/axios'
import { Organisation } from '@onto-med/top-api';

export default defineComponent({
  name: 'OrganisationSelectInput',
  props: {
    modelValue: Object as () => Organisation|undefined,
    label: String,
    minLength: {
      type: Number,
      default: 2
    }
  },
  emits: ['update:model-value'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    const organisationApi = inject(OrganisationApiKey)
    const options = ref([] as Organisation[])
    const loading = ref(false)

    return {
      t, options, loading,
      async filterFn (val: string, update: (arg0: () => void) => void, abort: () => void) {
        if (!organisationApi || val.length < props.minLength) {
          abort()
          return
        }

        loading.value = true
        await organisationApi.getOrganisations(null, val)
          .then((r) => update(() => options.value = r.data))
          .finally(() => loading.value = false)
      }
    }
  },
});
</script>
