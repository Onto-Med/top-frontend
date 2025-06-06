<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card>
      <q-card-section class="text-h6 row items-center q-gutter-sm">
        <div class="col text-right ellipsis" :title="getTitle(origin)">
          {{ getTitle(origin, true) }}
        </div>
        <q-icon name="arrow_forward" size="sm" />
        <div v-if="repository" class="col ellipsis" :title="repository.name">
          {{ repository.name }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <i18n-t keypath="forkEntityToRepository" tag="p" scope="global">
          <template #entity>
            <b>{{ getTitle(origin, true) }}</b>
          </template>
          <template #repository>
            <b v-if="repository">{{ repository.name }}</b>
          </template>
        </i18n-t>

        <i18n-t
          v-if="origin && isRestricted(origin)"
          keypath="superEntityIsForkedToo"
          tag="p"
          scope="global"
        >
          <template #superEntity>
            <b>{{ getTitle(origin.superPhenotype) }}</b>
          </template>
        </i18n-t>

        {{ t('pleaseModifySettings') }}:
        <q-list dense>
          <q-item v-show="!origin || !isRestricted(origin)">
            <q-checkbox
              v-model="cascade"
              :label="t('includeThing', { thing: t('restriction', 2) })"
            />
          </q-item>
          <q-item>
            <q-checkbox
              v-model="update"
              :label="t('updateExistingThing', { thing: t('entity', 2) })"
            />
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

<script setup lang="ts">
import { ref } from 'vue'
import { Entity, ForkingInstruction } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useI18n } from 'vue-i18n'
import { useEntityStore } from 'src/stores/entity-store'
import { storeToRefs } from 'pinia'

defineProps<{
  show: boolean
  origin?: Entity
}>()

const emit = defineEmits(['update:show', 'createFork'])

const { t } = useI18n()
const { getTitle, isRestricted } = useEntityFormatter()
const { repository } = storeToRefs(useEntityStore())
const cascade = ref(false)
const update = ref(false)

function reset() {
  cascade.value = false
  update.value = false
}

function handleCreateFork() {
  emit('createFork', {
    cascade: cascade.value,
    update: update.value,
  } as ForkingInstruction)
  reset()
}
</script>
