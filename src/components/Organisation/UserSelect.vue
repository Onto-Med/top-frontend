<template>
  <q-select
    :model-value="modelValue"
    use-input
    emit-value
    clearable
    :label="modelValue ? '' : label || t('selectThing', { thing: t('user') })"
    :options="options"
    :loading="loading"
    :title="t('entitySearchInput.description', { minLength: minLength, types: t('organisation', 2) })"
    @filter="filterFn"
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
          {{ t('entitySearchInput.emptyResult', { types: t('organisation', 2) }) }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import { User } from '@onto-med/top-api';
import { defineComponent, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserApiKey } from 'src/boot/axios'

export default defineComponent({
  props: {
    modelValue: Object as () => User|undefined,
    label: String,
    minLength: {
      type: Number,
      default: 2
    }
  },
  emits: ['update:model-value'],
  setup(props) {
    const { t } = useI18n();
    const userApi = inject(UserApiKey)
    const options = ref<User[]>([])
    const loading = ref(false)

    return {
      t,
      options,
      loading,

      async filterFn (val: string, update: (arg0: () => void) => void, abort: () => void) {
        if (!userApi || val.length < props.minLength) {
          abort()
          return
        }

        loading.value = true
        await userApi.getUsers(val)
          .then((r) => update(() => options.value = r.data.content))
          .finally(() => loading.value = false)
      }
    }
  }
})
</script>
