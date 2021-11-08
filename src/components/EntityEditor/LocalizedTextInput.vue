<template>
  <q-card flat bordered>
    <q-card-section v-if="label" class="q-pa-sm">
      <q-toolbar>
        <q-toolbar-title>{{ label }}</q-toolbar-title>
        <q-btn
          v-if="helpText"
          flat
          round
          dense
          icon="info"
          :title="t('showThing', { thing: t('help') })"
          @click="showHelp = !showHelp"
        />
      </q-toolbar>
    </q-card-section>

    <q-separator v-if="label" />

    <q-card-section class="q-pa-none">
      <div class="row">
        <div class="col q-pa-md">
          <div v-for="(entry, index) in modelValue" :key="index" class="row">
            <q-input
              v-model="entry.text"
              outlined
              :type="textArea ? 'textarea' : 'text'"
              :rows="rows"
              :cols="cols"
            >
              <template #before>
                <q-select v-model="entry.lang" outlined :options="supportedLangs" />
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

        <q-separator v-if="showHelp" vertical />

        <div v-if="showHelp" class="col-6 q-pa-md">
          <div class="text-subtitle1">
            {{ t('help') }}:
          </div>
          {{ helpText }}
        </div>
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
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    modelValue: {
      type: Array as () => Array<Record<string, string>>,
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
    }
  },
  emits: ['update:modelValue'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const showHelp = ref(false)

    return { t, showHelp }
  },
  computed: {
    duplicatedLangs (): string[] {
      return this.modelValue
        .map(x => x.lang)
        .filter((l: string, i: number, a: Array<string>) => a.indexOf(l) !== i)
    },
    unusedSupportedLangs (): string[] {
      return this.supportedLangs.filter(l => !this.duplicatedLangs.includes(l))
    }
  },
  methods: {
    removeEntryByIndex (index: number) {
      let newModelValue = this.modelValue.slice()
      newModelValue.splice(index, 1)
      this.$emit('update:modelValue', newModelValue)
    },
    addEntry () {
      let newModelValue = this.modelValue.slice()
      newModelValue.push({ lang: this.unusedSupportedLangs[0] })
      this.$emit('update:modelValue', newModelValue)
    }
  }
})
</script>
