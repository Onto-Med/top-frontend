<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card>
      <q-card-section>
        <div v-if="state.createdAt" class="text-h6">
          {{ t('editThing', { thing: t('organisation') }) }}
          <q-btn
            v-show="state.createdAt"
            dense
            color="red"
            icon="delete"
            class="float-right"
            :title="t('deleteThing', { thing: t('organisation') })"
            @click="showDeleteDialog"
          />
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

        <organisation-select-input v-model="state.superOrganisation" :label="t('superOrganisation')" />
      </q-card-section>

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

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Organisation } from '@onto-med/top-api'
import OrganisationSelectInput from 'src/components/Organisation/OrganisationSelectInput.vue'
import Dialog from 'src/components/Dialog.vue'
import { useQuasar } from 'quasar'

export default defineComponent({
  components: {
    OrganisationSelectInput
  },
  props: {
    modelValue: {
      type: Object as () => Organisation,
      required: true
    },
    show: Boolean,
    loading: Boolean
  },
  emits: ['update:show', 'update:model-value', 'delete-clicked'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const copy = (value: unknown) => {
      return JSON.parse(JSON.stringify(value)) as Organisation
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
            message: t('organisationPage.confirmDelete')
          }
        }).onOk(() => {
          emit('delete-clicked', props.modelValue)
        })
      },

      setId (id: string|number|null) {
        if (!isNew.value) return
        state.value.id = id ? (id as string).replace(/[^\w\d\-]/ig, '_').toLowerCase() : ''
      },

      isValid: computed(() => state.value.name && state.value.id)
    }
  }
})
</script>