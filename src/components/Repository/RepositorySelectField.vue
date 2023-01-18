<template>
  <q-select
    :model-value="modelValue"
    :rounded="rounded"
    :outlined="outlined"
    :dense="dense"
    hide-bottom-space
    hide-dropdown-icon
    use-input
    emit-value
    clearable
    clear-icon="close"
    :autofocus="autofocus"
    class="inline"
    :placeholder="modelValue ? '' : label || t('selectThing', { thing: t('repository') })"
    :options="options"
    :loading="loading"
    @filter="filterFn"
    @update:model-value="handleSelectionChanged"
  >
    <template #selected>
      <span v-if="modelValue">
        {{ modelValue.name || modelValue.id }}
      </span>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label v-if="!organisationId && scope.opt.organisation" overline>
            {{ scope.opt.organisation.name }}
          </q-item-label>
          <q-item-label>{{ scope.opt.name || scope.opt.id }}</q-item-label>
          <template v-if="showDetails">
            <q-item-label caption class="ellipsis">
              {{ scope.opt.description }}
            </q-item-label>
          </template>
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section>
          {{ t('repositorySearchInput.emptyResult', { types: t('repository', 2) }) }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import useNotify from 'src/mixins/useNotify'
import { RepositoryApiKey } from 'boot/axios'
import { AxiosResponse } from 'axios'
import { Repository } from '@onto-med/top-api'

export default defineComponent({
  name: 'RepositorySelectField',
  props: {
    modelValue: [Object as () => Repository],
    label: String,
    minLength: {
      type: Number,
      default: 2
    },
    showDetails: Boolean,
    rounded: Boolean,
    outlined: Boolean,
    dense: Boolean,
    autofocus: Boolean,
    organisationId: String
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const repositoryApi = inject(RepositoryApiKey)
    const { renderError } = useNotify()
    const options = ref([] as Repository[])
    const loading = ref(false)

    return {
      t, options, loading,
      async filterFn (val: string, update: (arg0: () => void) => void, abort: () => void) {
        if (val.length < props.minLength || !repositoryApi) {
          abort()
          return
        }

        loading.value = true
        let promise: Promise<AxiosResponse<Repository[]>>
        if (props.organisationId) {
          promise = repositoryApi.getRepositoriesByOrganisationId(props.organisationId, undefined, val)
        } else {
          promise = repositoryApi.getRepositories(undefined, val)
        }
        await promise
          .then((r) => update(() => options.value = r.data))
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      },
      handleSelectionChanged (repository: Repository) {
        emit('update:modelValue', repository)
      }
    }
  },
});
</script>
