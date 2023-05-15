<template>
  <q-icon :name="iconName" :size="size" color="grey" :title="iconTitle" />
</template>

<script lang="ts">
import { Permission } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    permission: String as () => Permission,
    size: String
  },
  setup(props) {
    const { t } = useI18n()
    const { permissionTitle } = useEntityFormatter()

    return {
      iconTitle: computed(() => `${t('permission')}: ${permissionTitle(props.permission)}`),

      iconName: computed(() => {
        if (!props.permission) return 'lock'
        switch (props.permission) {
          case Permission.Manage: return 'engineering'
          case Permission.Write: return 'edit'
          case Permission.Read: return 'visibility'
          default: return 'question_mark'
        }
      })
    }
  }
})
</script>
