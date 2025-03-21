<template>
  <q-icon :name="iconName" :size="size" :title="iconTitle" :color="color" />
</template>

<script setup lang="ts">
import { Permission } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  permission: Permission
  color?: string
  size?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'grey',
  size: 'sm',
})

const { t } = useI18n()
const { permissionTitle } = useEntityFormatter()

const iconTitle = computed(() => `${t('permission')}: ${permissionTitle(props.permission)}`)

const iconName = computed(() => {
  if (!props.permission) return 'lock'
  switch (props.permission) {
    case Permission.Manage:
      return 'engineering'
    case Permission.Write:
      return 'edit'
    case Permission.Read:
      return 'visibility'
    default:
      return 'question_mark'
  }
})
</script>
