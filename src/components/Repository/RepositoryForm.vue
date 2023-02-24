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

        <repository-type-select v-model="state.repositoryType" :readonly="!isNew" />

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
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Repository } from '@onto-med/top-api'
import RepositoryTypeSelect from 'src/components/EntityEditor/RepositoryTypeSelect.vue'
import Dialog from 'src/components/Dialog.vue'
import { useQuasar } from 'quasar'

export default defineComponent({
  components: {
    RepositoryTypeSelect
  },
  props: {
    modelValue: {
      type: Object as () => Repository,
      required: true
    },
    show: Boolean,
    loading: Boolean
  },
  emits: ['update:show', 'update:model-value', 'delete-clicked'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const copy = (value: unknown) => {
      return JSON.parse(JSON.stringify(value)) as Repository
    }
    const state = ref(copy(props.modelValue))
    const isNew = computed(() => !state.value.createdAt)
    const $q = useQuasar()

    watch(() => props.modelValue, (value) => {
      state.value = copy(value)
    })

    return {
      t,
      state,
      isNew,
      showDeleteDialog () {
        $q.dialog({
          component: Dialog,
          componentProps: {
            message: t('repositoryPage.confirmDelete')
          }
        }).onOk(() => {
          emit('delete-clicked', props.modelValue)
        })
      },

      setId (id: string|undefined) {
        if (!isNew.value) return
        state.value.id = id ? id.replace(/[^\w\d\-]/ig, '_').toLowerCase() : ''
      }
    }
  }
})
</script>
