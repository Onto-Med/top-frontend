<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card>
      <q-card-section>
        <div v-if="state.createdAt != null" class="text-h6">
          {{ t('editThing', { thing: t('repository') }) }}
          <q-btn
            v-show="state.createdAt != null"
            dense
            color="red"
            icon="delete"
            class="float-right"
            :title="t('deleteThing', { thing: t('repository') })"
            @click="showDeleteDialog = true"
          />
        </div>
        <div v-else class="text-h6">
          {{ t('createThing', { thing: t('repository') }) }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-input :model-value="state.name" type="text" :label="t('name')" @update:model-value="state.name = $event" />
        <q-input :model-value="state.description" type="textarea" :label="t('description')" @update:model-value="state.description = $event" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="t('save')" color="primary" @click="$emit('update:model-value', state)" />
        <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
      </q-card-actions>

      <q-inner-loading
        :showing="loading"
        :label="t('pleaseWait') + '...'"
      />
    </q-card>

    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning_amber" color="red" text-color="white" />
          <span v-t="'confirmDelete'" class="q-ml-sm" />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
          <q-btn v-close-popup flat :label="t('ok')" color="primary" @click="$emit('delete-clicked', modelValue)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Repository } from '@onto-med/top-api'

export default defineComponent({
  name: 'RepositoryForm',
  props: {
    modelValue: {
      type: Object as () => Repository,
      required: true
    },
    show: Boolean,
    loading: Boolean
  },
  emits: ['update:show', 'update:model-value', 'delete-clicked'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const copy = (value: unknown) => {
      return JSON.parse(JSON.stringify(value)) as Repository
    }
    const state = ref(copy(props.modelValue))
    const showDeleteDialog = ref(false)

    watch(() => props.modelValue, (value) => {
      state.value = copy(value)
    })

    return {
      t,
      state,
      showDeleteDialog: showDeleteDialog
    }
  }
})
</script>