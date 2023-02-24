<template>
  <q-select
    v-model="permission"
    :stack-label="required"
    emit-value
    map-options
    :readonly="readonly"
    :label="label || t('permission')"
    :options="localOptions"
    :error="required ? !permission : false"
    :clearable="!required"
  >
    <template v-if="tooltip" #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section :title="scope.opt.title">
          {{ scope.opt.label }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Permission } from '@onto-med/top-api'

export default defineComponent({
  props: {
    modelValue: String as () => Permission,
    label: String,
    options: Array as () => Permission[],
    readonly: Boolean,
    required: Boolean,
    tooltip: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, te } = useI18n()
    const permission = computed({
      get (): string { return props.modelValue as string },
      set (value: string): void { emit('update:modelValue', value) }
    })

    return {
      t,
      permission,
      localOptions: computed(() =>
      (props.options ? props.options : Object.values(Permission))
          .map(d => {
            return {
              label: te('permissions.' + d) ? t('permissions.' + d) : d,
              value: d,
              title: te('permissionDescriptions.' + d) ? t('permissionDescriptions.' + d) : ''
            }
          })
      )
    }
  }
})
</script>
