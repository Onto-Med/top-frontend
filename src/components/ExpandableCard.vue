<template>
  <q-card>
    <q-card-section class="q-pa-sm cursor-pointer" @click="isExpanded = !isExpanded">
      <q-toolbar>
        <q-btn color="grey" round flat dense :icon="isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'" />
        <q-toolbar-title class="row items-center">
          <span v-if="title">{{ title }}</span>
          <q-icon v-show="error" name="error" color="negative" class="q-px-sm" />
          <small><slot name="error" /></small>
        </q-toolbar-title>
        <slot name="toolbar" />
        <q-btn
          v-if="helpText"
          flat
          round
          dense
          icon="info"
          :title="t('showThing', { thing: t('help') })"
          @click.stop="isHelpVisible = !(isHelpVisible && isExpanded); isExpanded = isHelpVisible || isExpanded"
        />
      </q-toolbar>
    </q-card-section>

    <q-slide-transition>
      <div v-show="isExpanded">
        <q-separator />

        <q-card-section class="row q-pa-none">
          <div class="col q-pa-md">
            <slot />
          </div>

          <q-separator v-show="isHelpVisible" vertical />

          <div v-show="isHelpVisible" class="col-6 q-pa-md">
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

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'ExpandableCard',
  props: {
    title: String,
    helpText: String,
    expanded: Boolean,
    showHelp: Boolean,
    error: Boolean
  },
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const isExpanded    = ref(props.expanded)
    const isHelpVisible = ref(props.showHelp)

    return { t, isExpanded, isHelpVisible }
  },
})
</script>
