<template v-slot="append">
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar v-if="icon" :icon="iconName" :color="iconColor" :text-color="iconTextColor" />
        <div v-if="message" class="col q-ml-sm">
          {{ message }}
          <br>
          <q-checkbox
            v-if="checkbox"
            v-model:model-value="checkboxValue"
            :label="checkboxLabel"
          />
        </div>
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
import { useDialogPluginComponent } from 'quasar'
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
    },
    checkbox: Boolean,
    checkboxLabel: String
  },
  emits: ['hide', 'ok'],
  setup(props) {
    const { t } = useI18n()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    const checkboxValue = ref(false)

    return {
      t,
      checkboxValue,
      dialogRef,
      onDialogHide,

      onOkClick () {
        onDialogOK(props.checkbox ? checkboxValue.value : undefined)
      },

      onCancelClick: onDialogCancel
    }
  }
})
</script>
