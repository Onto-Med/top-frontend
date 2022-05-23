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
            @click="showDeleteDialog = true"
          />
        </div>
        <div v-else class="text-h6">
          {{ t('createThing', { thing: t('repository') }) }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input v-model="state.id" :readonly="!isNew" type="text" :label="t('id')" />
        <q-item :v-ripple="isNew" :tag="isNew ? 'label' : 'div'" class="q-pl-none">
          <q-item-section avatar>
            <q-toggle v-model="state.primary" :disable="!isNew" />
          </q-item-section>
          <q-item-section>
            <q-item-label v-t="'primary'" />
            <q-item-label v-t="'primaryRepositoryDescription'" caption />
          </q-item-section>
        </q-item>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input v-model="state.name" type="text" :label="t('name')" />
        <q-input v-model="state.description" type="textarea" :label="t('description')" />
      </q-card-section>

      <q-separator />

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
import { defineComponent, ref, watch, computed } from 'vue'
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
      isNew: computed(() => state.value.createdAt == null),
      showDeleteDialog: showDeleteDialog
    }
  }
})
</script>