<template>
  <q-btn icon="settings" :title="t('setting', 2)" @click="showDialog = true" />
  <q-dialog v-model="showDialog">
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ t('setting', 2) }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        FIELDS
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn flat :label="t('close')" v-close-popup color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NumberRestriction, DateTimeRestriction } from '@onto-med/top-api'

export default defineComponent({
  props: {
    ageRestrictions: {
      type: Array as () => NumberRestriction[]
    },
    timeRestrictions: {
      type: Array as () => DateTimeRestriction[]
    }
  },
  emits: [],
  setup() {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    return {
      t,
      showDialog: ref(false)
    }
  }
})
</script>
