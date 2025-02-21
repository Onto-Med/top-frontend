<template v-slot="append">
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar v-if="icon" :icon="iconName" :color="iconColor" :text-color="iconTextColor" />
        <div v-if="message" class="col q-ml-sm">
          {{ message }}
          <br />
          <q-checkbox v-if="checkbox" v-model:model-value="checkboxValue" :label="checkboxLabel" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('cancel')" color="primary" @click="onDialogCancel" />
        <q-btn flat :label="t('ok')" color="primary" @click="onOkClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  message: String,
  icon: {
    type: Boolean,
    default: true,
  },
  iconName: {
    type: String,
    default: 'warning_amber',
  },
  iconColor: {
    type: String,
    default: 'warning',
  },
  iconTextColor: {
    type: String,
    default: 'white',
  },
  checkbox: Boolean,
  checkboxLabel: String,
})

defineEmits(['hide', 'ok'])

const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const checkboxValue = ref(false)

function onOkClick() {
  onDialogOK(props.checkbox ? checkboxValue.value : undefined)
}
</script>
