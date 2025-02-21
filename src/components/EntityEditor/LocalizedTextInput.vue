<template>
  <expandable-card
    v-model:show-help="showHelp"
    :title="label"
    :error="hasError"
    :help-text="helpText"
    :expanded="expanded"
    @update:expanded="$emit('update:expanded', $event)"
  >
    <template #default>
      <div v-for="(entry, index) in modelValue" :key="index" class="row">
        <q-input
          :model-value="modelValue[index]?.text"
          :type="textArea ? 'textarea' : 'text'"
          :rows="rows"
          :cols="cols"
          :readonly="readonly"
          :error="!modelValue[index]?.text"
          :autofocus="autofocus || !modelValue[index]?.text"
          debounce="200"
          class="col q-pb-none"
          @update:model-value="updateEntryByIndex(index, $event, modelValue[index]?.lang)"
        >
          <template #before>
            <q-select
              :model-value="modelValue[index]?.lang"
              :options="supportedLangs"
              :readonly="readonly"
              :error="!modelValue[index]?.lang"
              hide-bottom-space
              class="lang-input"
              @update:model-value="updateEntryByIndex(index, modelValue[index]?.text, $event)"
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
    <template v-if="!readonly" #append>
      <q-card-actions class="q-pa-md">
        <q-btn
          color="primary"
          icon="add"
          class="add-localized-text-btn"
          :label="t('addThing', { thing: name || t('entry') })"
          @click="addEntry()"
        />
      </q-card-actions>
    </template>
  </expandable-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import { LocalisableText } from '@onto-med/top-api'

const props = defineProps({
  modelValue: {
    type: Array as () => Array<LocalisableText>,
    default: () => [],
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
    default: () => ['de', 'en'],
  },
  expanded: Boolean,
  readonly: Boolean,
  required: Boolean,
  autofocus: Boolean,
})

const emit = defineEmits(['update:modelValue', 'update:expanded', 'update:showHelp'])

const { t } = useI18n()

const showHelp = ref(false)

const duplicatedLangs = computed((): (string | undefined)[] => {
  return props.modelValue
    .map((x) => x.lang)
    .filter((l: string | undefined, i: number, a: Array<string | undefined>) => a.indexOf(l) !== i)
})

const unusedSupportedLangs = computed((): (string | undefined)[] => {
  return props.supportedLangs.filter((l) => !props.modelValue.map((x) => x.lang).includes(l))
})

const empty = computed(() => !props.modelValue || props.modelValue.length < 1)

const hasError = computed(
  () =>
    (props.required && empty.value) ||
    (props.unique && duplicatedLangs.value.length > 0) ||
    (props.modelValue && props.modelValue?.findIndex((x) => !x.lang || !x.text) !== -1),
)

function removeEntryByIndex(index: number) {
  const newModelValue = props.modelValue.slice()
  newModelValue.splice(index, 1)
  emit('update:modelValue', newModelValue)
}

function updateEntryByIndex(index: number, text?: string | number | null, lang?: string) {
  const newModelValue = props.modelValue.slice()
  if (newModelValue[index] !== undefined) {
    newModelValue[index].text = text as string
    newModelValue[index].lang = lang as string
  }
  emit('update:modelValue', newModelValue)
}

function addEntry() {
  const newModelValue = props.modelValue.slice()
  newModelValue.push({ lang: unusedSupportedLangs.value[0] as string } as LocalisableText)
  emit('update:modelValue', newModelValue)
}
</script>

<style lang="scss" scoped>
.lang-input {
  width: 60px;
}
</style>
