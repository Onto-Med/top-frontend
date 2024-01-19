<template>
  <q-card>
    <q-card-section class="q-pa-sm cursor-pointer" @click="$emit('update:expanded', !expanded)">
      <q-toolbar>
        <q-btn color="grey" round flat dense :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'" />
        <slot name="title">
          <q-toolbar-title class="row items-center">
            <span v-if="title">{{ title }}</span>
            <q-icon v-show="error" name="error" color="negative" class="q-px-sm" />
            <small><slot name="error" /></small>
          </q-toolbar-title>
        </slot>
        <slot name="toolbar" />
        <q-btn
          v-if="helpText"
          v-show="$q.screen.gt.sm"
          flat
          round
          dense
          icon="info"
          :title="t('showThing', { thing: t('help') })"
          @click.stop="toggleHelp"
        />
      </q-toolbar>
    </q-card-section>

    <q-slide-transition>
      <div v-show="expanded">
        <q-separator />

        <q-card-section class="row q-pa-none">
          <div class="col q-pa-md">
            <slot />
          </div>

          <q-separator v-show="$q.screen.gt.sm && showHelp" vertical />

          <div v-show="$q.screen.gt.sm && showHelp" class="col-6 q-pa-md">
            <div class="text-subtitle1">
              {{ t('help') }}:
            </div>
            {{ helpText }}
          </div>
        </q-card-section>

        <q-separator v-show="$slots['append']" />

        <slot name="append" />
      </div>
    </q-slide-transition>
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  title?: string
  helpText?: string
  expanded?: boolean
  showHelp?: boolean
  error?: boolean
}>()

const emit = defineEmits(['update:expanded', 'update:showHelp'])

const { t } = useI18n()

function toggleHelp() {
  if (!props.showHelp && !props.expanded)
    emit('update:expanded', true)
  emit('update:showHelp', !props.showHelp)
}
</script>
