<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card>
      <q-card-section>
        <div v-if="state.createdAt" class="text-h6">
          {{ t('editThing', { thing: t('organisation') }) }}
        </div>
        <div v-else class="text-h6">
          {{ t('createThing', { thing: t('organisation') }) }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="state.name"
          type="text"
          autocomplete="Off"
          :label="t('name')"
          :error="!state.name"
          @update:model-value="setId"
        />

        <q-input
          :model-value="state.id"
          dense
          class="q-ml-xl"
          type="text"
          autocomplete="Off"
          :readonly="!isNew"
          :label="t('id')"
          :error="!state.id"
          @update:model-value="setId"
        />

        <q-input v-model="state.description" type="textarea" :label="t('description')" />

        <organisation-select-input
          v-model="state.superOrganisation"
          :label="t('superOrganisation')"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          :label="t('save')"
          color="primary"
          :disable="!isValid"
          @click="$emit('update:model-value', state)"
        />
        <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
      </q-card-actions>

      <q-inner-loading :showing="loading" :label="t('pleaseWait') + '...'" />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Organisation } from '@onto-med/top-api'
import OrganisationSelectInput from 'src/components/Organisation/OrganisationSelectInput.vue'
import useDefaultHelpers from 'src/mixins/useDefaultHelpers'
import { QDialog } from 'quasar'

const props = defineProps<{
  modelValue: Organisation
  loading?: boolean
  show?: boolean
}>()

defineEmits(['update:show', 'update:model-value', 'delete-clicked'])

const { t } = useI18n()
const { copy, toValidId } = useDefaultHelpers()
const state = ref(copy(props.modelValue))
const isNew = computed(() => !state.value.createdAt)
const isValid = computed(() => state.value.name && state.value.id)

watch(
  () => props.modelValue,
  (value) => (state.value = copy(value)),
)

function setId(id: string | number | null) {
  if (!isNew.value) return
  state.value.id = toValidId(id)
}
</script>
