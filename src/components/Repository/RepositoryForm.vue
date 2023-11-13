<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card>
      <q-card-section>
        <div v-if="!isNew" class="text-h6">
          {{ t('editThing', { thing: t('repository') }) }}
          <q-btn
            dense
            color="red"
            icon="delete"
            class="float-right"
            :title="t('deleteThing', { thing: t('repository') })"
            @click="showDeleteDialog"
          />
        </div>
        <div v-else class="text-h6">
          {{ t('createThing', { thing: t('repository') }) }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input
          v-model="state.name"
          type="text"
          :label="t('name')"
          :error="!state.name"
          autocomplete="Off"
          @update:model-value="setId"
        />

        <q-input
          :model-value="state.id"
          dense
          required
          type="text"
          class="q-ml-xl"
          autocomplete="Off"
          :label="t('id')"
          :readonly="!isNew"
          :error="!state.id"
          @update:model-value="setId"
        />

        <q-item :v-ripple="isNew" :tag="isNew ? 'label' : 'div'" class="q-pl-none">
          <q-item-section avatar>
            <q-toggle v-model="state.primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label v-t="'primary'" />
            <q-item-label v-t="'primaryRepositoryDescription'" caption />
          </q-item-section>
        </q-item>

        <enum-select v-model:selected="state.repositoryType" i18n-prefix="repositoryType" :enum="RepositoryType" :readonly="!isNew" />

        <q-input v-model="state.description" type="textarea" :label="t('description')" />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('save')" color="primary" :disable="!isValid" @click="$emit('update:model-value', state)" />
        <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
      </q-card-actions>

      <q-inner-loading
        :showing="loading"
        :label="t('pleaseWait') + '...'"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Repository, RepositoryType } from '@onto-med/top-api'
import EnumSelect from 'src/components/EnumSelect.vue'
import Dialog from 'src/components/Dialog.vue'
import { useQuasar } from 'quasar'
import useDefaultHelpers from 'src/mixins/useDefaultHelpers'

const props = defineProps<{
  modelValue: Repository
  loading?: boolean
  show?: boolean
}>()

const emit = defineEmits(['update:show', 'update:model-value', 'delete-clicked'])

const { t } = useI18n()
const $q = useQuasar()
const { copy, toValidId } = useDefaultHelpers()
const state = ref(copy(props.modelValue))
const isNew = computed(() => !state.value.createdAt)
const isValid = computed(() => state.value.id && state.value.name && state.value.repositoryType)

watch(
  () => props.modelValue,
  (value) => state.value = copy(value)
)

function setId(id: string|number|null) {
  if (!isNew.value) return
  state.value.id = toValidId(id)
}

function showDeleteDialog() {
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('repositoryPage.confirmDelete')
    }
  }).onOk(() => {
    emit('delete-clicked', props.modelValue)
  })
}
</script>
