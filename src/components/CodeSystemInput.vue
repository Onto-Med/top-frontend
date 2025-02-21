<template>
  <q-select
    :model-value="modelValue"
    :options="localOptions"
    :readonly="readonly"
    :label="t('codeSystem')"
    :loading="loading"
    :virtual-scroll-item-size="70"
    use-input
    stack-label
    clearable
    option-value="uri"
    option-label="shortName"
    debounce="200"
    @update:model-value="$emit('update:modelValue', $event)"
    @filter="onFilter"
    @virtual-scroll="onScroll"
  >
    <template #option="scope">
      <q-item dense v-bind="scope.itemProps">
        <q-item-section :title="scope.opt.name">
          {{ scope.opt.shortName }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { CodeSystem, CodeSystemPage } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import { useEntityStore } from 'src/stores/entity-store'
import useNotify from 'src/mixins/useNotify'
import { ScrollDetails } from './models'

const props = defineProps<{
  modelValue?: CodeSystem
  /**
   * Available options of the select field.
   * If this property is omitted, options will be loaded on demand from the backend.
   */
  options?: CodeSystem[]
  readonly?: boolean
}>()

defineEmits(['update:modelValue'])

const { t } = useI18n()
const entityStore = useEntityStore()
const { renderError } = useNotify()

const loadedOptions = ref<CodeSystem[]>([])
const loading = ref(false)
const prevInput = ref(undefined as string | undefined)
const nextPage = ref(2)
const totalPages = ref(0)

const localOptions = computed(() => props.options || loadedOptions.value)

async function loadOptions(input?: string, page = 1): Promise<CodeSystemPage> {
  if (props.options) {
    return new Promise(() => {
      return {
        content: props.options,
        number: 1,
        totalPages: 1,
        size: props.options?.length,
        totalElements: props.options?.length,
      } as CodeSystemPage
    })
  }
  return entityStore.getCodeSystems(input, page)
}

function onFilter(input: string, update: (callBackFn: () => void) => void) {
  prevInput.value = input
  loading.value = true
  nextPage.value = 2
  totalPages.value = 0
  loadOptions(input)
    .then((page) => {
      totalPages.value = page.totalPages
      update(() => (loadedOptions.value = page.content))
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function onScroll({ to, direction, ref }: ScrollDetails) {
  const lastIndex = loadedOptions.value.length - 1
  if (
    loading.value ||
    nextPage.value > totalPages.value ||
    to !== lastIndex ||
    direction === 'decrease'
  )
    return
  loading.value = true
  loadOptions(prevInput.value, nextPage.value)
    .then((page) => {
      totalPages.value = page.totalPages
      if (page.content.length > 0) {
        nextPage.value++
        loadedOptions.value = loadedOptions.value.concat(page.content)
        void nextTick(() => {
          ref.refresh()
          loading.value = false
        })
      }
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}
</script>
