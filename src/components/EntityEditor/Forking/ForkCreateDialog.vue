<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card>
      <q-card-section class="text-h6 row items-center q-gutter-sm">
        <div class="col text-right ellipsis" :title="getTitle(origin)">
          {{ getTitle(origin) }}
        </div>
        <q-icon name="arrow_forward" size="sm" />
        <div class="col ellipsis" :title="repository.name">
          {{ repository.name }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <i18n-t keypath="forkEntityToRepository" tag="p" scope="global">
          <template #entity>
            <b>{{ getTitle(origin) }}</b>
          </template>
          <template #repository>
            <b>{{ repository.name }}</b>
          </template>
        </i18n-t>

        {{ t('pleaseModifySettings') }}:
        <q-list dense>
          <q-item>
            <q-checkbox v-model="cascade" :label="t('includeThing', { thing: t('restriction', 2) })" />
          </q-item>
          <q-item>
            <q-checkbox v-model="history" :label="t('includeThing', { thing: t('versionHistory', 2) })" />
          </q-item>
          <q-item>
            <q-checkbox v-model="update" :label="t('updateExistingThing', { thing: t('entity', 2) })" />
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('cancel')" />
        <q-btn
          v-close-popup
          color="primary"
          :label="t('performThing', { thing: t('fork') })"
          @click="handleCreateFork"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { Entity, ForkUpdateInstruction } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useI18n } from 'vue-i18n'
import { useEntity } from 'src/pinia/entity'
import { storeToRefs } from 'pinia'

export default defineComponent({
  props: {
    show: {
      type: Boolean,
      require: true
    },
    origin: Object as () => Entity
  },
  emits: ['update:show', 'createFork'],
  setup (props, { emit }) {
    const { t }          = useI18n()
    const { getTitle }   = useEntityFormatter()
    const { repository } = storeToRefs(useEntity())
    const cascade = ref(false)
    const history = ref(false)
    const update  = ref(false)

    const reset = () => {
      cascade.value = false
      history.value = false
      update.value  = false
    }

    return {
      t,
      getTitle,
      repository,
      cascade,
      history,
      update,

      handleCreateFork () {
        emit('createFork', {
          cascade: cascade.value,
          history: history.value,
          update:  update.value
        } as ForkUpdateInstruction)
        reset()
      }
    }
  },
})
</script>

