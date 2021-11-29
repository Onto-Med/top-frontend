<template>
  <q-card>
    <q-card-section v-if="label" class="q-pa-sm" @click="isExpanded = !isExpanded">
      <q-toolbar>
        <q-btn color="grey" round flat dense :icon="isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'" />
        <q-toolbar-title>{{ label }}</q-toolbar-title>
        <q-btn
          v-if="helpText"
          flat
          round
          dense
          icon="info"
          :title="t('showThing', { thing: t('help') })"
          @click.stop="showHelp = !showHelp; isExpanded = showHelp || isExpanded"
        />
      </q-toolbar>
    </q-card-section>

    <q-slide-transition>
      <div v-show="isExpanded">
        <q-separator v-if="label" />

        <q-card-section class="row q-pa-none">
          <div class="col q-pa-md">
            <div v-for="(entry, index) in modelValue" :key="index" class="row">
              <q-input
                :model-value="modelValue[index].text"
                :type="textArea ? 'textarea' : 'text'"
                :rows="rows"
                :cols="cols"
                debounce="200"
                @update:modelValue="updateEntryByIndex(index, $event, modelValue[index].lang)"
              >
                <template #before>
                  <q-select
                    :model-value="modelValue[index].lang"
                    :options="supportedLangs"
                    @update:modelValue="updateEntryByIndex(index, modelValue[index].text, $event)"
                  />
                </template>
                <template #after>
                  <q-btn
                    color="red"
                    icon="remove"
                    class="remove-localized-text-btn"
                    :title="t('remove')"
                    @click="removeEntryByIndex(index)"
                  />
                </template>
              </q-input>
            </div>
            <div v-show="uniqueLangs && duplicatedLangs.length > 0">
              {{ t('oneThingPerThing', { thing1: name || t('entry'), thing2: t('language') }) }}
            </div>
          </div>

          <q-separator v-show="showHelp" vertical />

          <div v-show="showHelp" class="col-6 q-pa-md">
            <div class="text-subtitle1">
              {{ t('help') }}:
            </div>
            {{ helpText }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions>
          <q-btn
            color="primary"
            icon="add"
            class="add-localized-text-btn"
            :label="t('addThing', { thing: name || t('entry') })"
            @click="addEntry()"
          />
        </q-card-actions>
      </div>
    </q-slide-transition>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    modelValue: {
      type: Array as () => Array<Record<string, string|undefined>>,
      required: true
    },
    helpText: String,
    uniqueLangs: Boolean,
    textArea: Boolean,
    rows: [Number, String],
    cols: [Number, String],
    name: String,
    label: String,
    supportedLangs: {
      type: Array as () => string[],
      default: () => ['de', 'en']
    },
    expanded: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const showHelp = ref(false)
    const isExpanded = ref(props.expanded)

    const duplicatedLangs = computed((): (string|undefined)[] => {
      return props.modelValue
        .map(x => x.lang)
        .filter((l: string|undefined, i: number, a: Array<string|undefined>) => a.indexOf(l) !== i)
    })

    const unusedSupportedLangs = computed((): (string|undefined)[] => {
      return props.supportedLangs.filter(l => !duplicatedLangs.value.includes(l))
    })

    return {
      t, showHelp, duplicatedLangs, isExpanded,
      
      removeEntryByIndex (index: number) {
        let newModelValue = props.modelValue.slice()
        newModelValue.splice(index, 1)
        emit('update:modelValue', newModelValue)
      },
      updateEntryByIndex (index: number, text?: string, lang?: string) {
        let newModelValue = props.modelValue.slice()
        newModelValue[index].text = text
        newModelValue[index].lang = lang
        emit('update:modelValue', newModelValue)
      },
      addEntry () {
        let newModelValue = props.modelValue.slice()
        newModelValue.push({ lang: unusedSupportedLangs.value[0] })
        emit('update:modelValue', newModelValue)
      }
    }
  }
})
</script>
