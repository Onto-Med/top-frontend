<template>
  <q-select
    :model-value="modelValue"
    :rounded="rounded"
    :outlined="outlined"
    :dense="dense"
    hide-bottom-space
    use-input
    emit-value
    input-debounce="500"
    :autofocus="autofocus"
    :label="modelValue ? '' : label || t('repository')"
    :options="options"
    :loading="loading"
    :virtual-scroll-item-size="50"
    :error="required && !modelValue"
    :clearable="!required"
    @filter="filterFn"
    @virtual-scroll="onScroll"
    @update:model-value="$emit('update:modelValue', $event)"
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
import { defineComponent, nextTick, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import useNotify from 'src/mixins/useNotify'
import { RepositoryApiKey } from 'boot/axios'
import { AxiosResponse } from 'axios'
import { Repository, RepositoryPage } from '@onto-med/top-api'
import { ScrollDetails } from 'src/mixins/ScrollDetails'

export default defineComponent({
  props: {
    modelValue: [Object as () => Repository],
    label: String,
    minLength: {
      type: Number,
      default: 0
    },
    showDetails: Boolean,
    rounded: Boolean,
    outlined: Boolean,
    dense: Boolean,
    autofocus: Boolean,
    organisationId: String,
    required: Boolean
  },
  emits: ['update:modelValue'],
  setup(props) {
    const { t } = useI18n()
    const repositoryApi = inject(RepositoryApiKey)
    const { renderError } = useNotify()
    const options = ref([] as Repository[])
    const loading = ref(false)
    const prevInput  = ref(undefined as string|undefined)
    const nextPage   = ref(2)
    const totalPages = ref(0)

    const loadOptions = async (input: string|undefined, page = 1): Promise<RepositoryPage> => {
      if (!repositoryApi) return Promise.reject({ message: 'Could not load data from the server.' })
      let promise: Promise<AxiosResponse<RepositoryPage>>
      if (props.organisationId) {
        promise = repositoryApi.getRepositoriesByOrganisationId(props.organisationId, undefined, input, undefined, page)
      } else {
        promise = repositoryApi.getRepositories(undefined, input, undefined, undefined, page)
      }
      return promise.then(r => r.data)
    }

    return {
      t,
      options,
      loading,

      filterFn (input: string, update: (arg0: () => void) => void, abort: () => void) {
        if (input.length < props.minLength) {
          abort()
          return
        }
        prevInput.value = input
        loading.value = true
        nextPage.value = 2
        totalPages.value = 0
        loadOptions(input)
          .then(page => {
            totalPages.value = page.totalPages
            update(() => options.value = page.content)
          })
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      },

      onScroll ({ to, direction, ref }: ScrollDetails) {
        const lastIndex = options.value.length - 1
        if (loading.value || !prevInput.value || nextPage.value > totalPages.value || to !== lastIndex || direction === 'decrease')
          return
        loading.value = true
        loadOptions(prevInput.value, nextPage.value)
          .then(page => {
            totalPages.value = page.totalPages
            if (page.content.length > 0) {
              nextPage.value++
              options.value = options.value.concat(page.content)
              void nextTick(() => {
                ref.refresh()
                loading.value = false
              })
            }
          })
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      }
    }
  }
})
</script>
