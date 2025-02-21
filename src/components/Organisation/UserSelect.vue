<template>
  <q-select
    :model-value="modelValue"
    use-input
    emit-value
    clearable
    :label="modelValue ? '' : label || t('selectThing', { thing: t('user') })"
    :options="options"
    :loading="loading"
    :title="t('entitySearchInput.description', { minLength: minLength, types: t('user', 2) })"
    :virtual-scroll-item-size="50"
    @filter="filterFn"
    @virtual-scroll="onScroll"
    @update:model-value="$emit('update:model-value', $event)"
  >
    <template #selected>
      <span v-if="modelValue">
        {{ modelValue.username || modelValue.id }}
      </span>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.username || scope.opt.id }}</q-item-label>
          <q-item-label caption>
            {{ scope.opt.description }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section>
          {{ t('entitySearchInput.emptyResult', { types: t('user', 2) }) }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { User, UserPage } from '@onto-med/top-api'
import { nextTick, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { ScrollDetails } from '../models'

const props = defineProps({
  modelValue: Object as () => User | undefined,
  label: String,
  minLength: {
    type: Number,
    default: 2,
  },
})

defineEmits(['update:model-value'])

const { t } = useI18n()
const { renderError } = useNotify()
const userApi = inject(UserApiKey)
const options = ref<User[]>([])
const loading = ref(false)
const prevInput = ref(undefined as string | undefined)
const nextPage = ref(2)
const totalPages = ref(0)

async function loadOptions(input: string | undefined, page = 1): Promise<UserPage> {
  if (!userApi) return Promise.reject({ message: 'Could not load data from the server.' })
  return userApi.getUsers(input, undefined, page).then((r) => r.data)
}

function filterFn(input: string, update: (arg0: () => void) => void, abort: () => void) {
  if (input.length < props.minLength) {
    abort()
    return
  }
  prevInput.value = input
  loading.value = true
  nextPage.value = 2
  totalPages.value = 0
  loading.value = true
  loadOptions(input)
    .then((page) => {
      totalPages.value = page.totalPages
      update(() => (options.value = page.content))
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function onScroll({ to, direction, ref }: ScrollDetails) {
  const lastIndex = options.value.length - 1
  if (
    loading.value ||
    !prevInput.value ||
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
        options.value = options.value.concat(page.content)
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
