<template #append>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar v-if="icon" :icon="iconName" :color="iconColor" :text-color="iconTextColor" />
        <span v-if="message" class="col q-ml-sm">{{ message }}</span>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('cancel')" color="primary" @click="onCancelClick" />
        <q-btn flat :label="t('ok')" color="primary" @click="onOkClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { QDialog } from 'quasar';
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n';

export default defineComponent({
  props: {
    message: String,
    icon: {
      type: Boolean,
      default: true
    },
    iconName: {
      type: String,
      default: 'warning_amber'
    },
    iconColor: {
      type: String,
      default: 'warning'
    },
    iconTextColor: {
      type: String,
      default: 'white'
    }
  },
emits: ['hide', 'ok'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const dialog = ref<QDialog|undefined>(undefined)
    const show = () => {
      dialog.value?.show()
    }
    const hide = () => {
      dialog.value?.hide()
    }

    return {
      t,
      dialog,
      show,
      hide,

      onDialogHide () {
        emit('hide')
      },

      onOkClick () {
        emit('ok')
        hide()
      },

      onCancelClick () {
        hide()
      }
    }
  }
})
</script>