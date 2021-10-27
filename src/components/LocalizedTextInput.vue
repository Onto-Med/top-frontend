<template>
  <q-card flat bordered class="q-pa-md bg-grey-1">
    <q-card-section v-if="label">
      <div class="text-h6">{{ label }}</div>
    </q-card-section>

    <q-separator v-if="label" />

    <q-card-section>
      <div class="row" v-for="(entry, index) in modelValue" :key="index">
        <q-input outlined :type="textArea ? 'textarea' : 'text'" :rows="rows" :cols="cols" v-model="entry.text">
          <template v-slot:before>
            <q-select outlined v-model="entry.lang" :options="supportedLangs" />
          </template>
          <template v-slot:after>
            <q-btn color="red" icon="remove" class="remove-localized-text-btn" @click="removeEntryByIndex(index)" />
          </template>
        </q-input>
      </div>
      <div v-show="uniqueLangs && duplicatedLangs.length > 0">There can only be one {{ name }} per language!</div>
    </q-card-section>

    <q-separator />

    <q-card-actions>
      <q-btn color="primary" icon="add" class="add-localized-text-btn" @click="addEntry()" :label="`Add new ${name}`" />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    modelValue: {
      type: Array as () => Array<Record<string, string>>,
      required: true
    },
    uniqueLangs: Boolean,
    textArea: Boolean,
    rows: [Number, String],
    cols: [Number, String],
    name: {
      type: String,
      default: 'entry'
    },
    label: String,
    supportedLangs: {
      type: Array as () => string[],
      default: () => ['en']
    }
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
