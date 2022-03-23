<template>
  <expandable-card :title="label" :error="hasError" :help-text="helpText" :expanded="expanded" :show-help="showHelp">
    <template #default>
      <div v-for="(entry, index) in modelValue" :key="index" class="row">
        <q-input
          :model-value="modelValue[index].text"
          :type="textArea ? 'textarea' : 'text'"
          :rows="rows"
          :cols="cols"
          :readonly="readonly"
          :error="!modelValue[index].text"
          debounce="200"
          class="col"
          @update:modelValue="updateEntryByIndex(index, $event, modelValue[index].lang)"
        >
          <template #before>
            <q-select
              :model-value="modelValue[index].lang"
              :options="supportedLangs"
              :readonly="readonly"
              :error="!modelValue[index].lang"
              class="lang-input"
              @update:modelValue="updateEntryByIndex(index, modelValue[index].text, $event)"
            />
          </template>
          <template #after>
            <q-btn
              color="red"
              icon="remove"
              class="remove-localized-text-btn"
              :disable="readonly"
              :title="t('remove')"
              @click="removeEntryByIndex(index)"
            />
          </template>
        </q-input>
      </div>
    </template>
    <template #error>
      <div v-show="required && empty" v-t="'mandatoryListField'" class="text-negative" />
      <div v-show="unique && duplicatedLangs.length > 0" class="text-negative">
        {{ t('oneThingPerThing', { thing1: name || t('entry'), thing2: t('language') }) }}
      </div>
    </template>
    <template #append>
      <q-card-actions class="q-pa-md">
        <q-btn
          color="primary"
          icon="add"
          class="add-localized-text-btn"
          :disable="readonly"
          :label="t('addThing', { thing: name || t('entry') })"
          @click="addEntry()"
        />
      </q-card-actions>
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'

export default defineComponent({
  name: 'LocalizedTextInput',
  components: {
    ExpandableCard
  },
  props: {
    modelValue: {
      type: Array as () => Array<Record<string, string|undefined>>,
      default: () => []
    },
    helpText: String,
    unique: Boolean,
    textArea: Boolean,
    rows: [Number, String],
    cols: [Number, String],
    name: String,
    label: String,
    supportedLangs: {
      type: Array as () => string[],
      default: () => ['de', 'en']
    },
    expanded: Boolean,
    showHelp: Boolean,
    readonly: Boolean,
    required: Boolean
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()

    const duplicatedLangs = computed((): (string|undefined)[] => {
      return props.modelValue
        .map(x => x.lang)
        .filter((l: string|undefined, i: number, a: Array<string|undefined>) => a.indexOf(l) !== i)
    })

    const unusedSupportedLangs = computed((): (string|undefined)[] => {
      return props.supportedLangs.filter(l => !props.modelValue.map(x => x.lang).includes(l))
    })

    const empty = computed(() => !props.modelValue || props.modelValue.length < 1)

    return {
      t,
      duplicatedLangs,
      empty,

      hasError: computed(() =>
        (props.required && empty.value)
        || props.unique && duplicatedLangs.value.length > 0
        || props.modelValue.findIndex(x => !x.lang || !x.text) !== -1
      ),

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

<style lang="sass" scoped>
.lang-input
  width: 60px
</style>