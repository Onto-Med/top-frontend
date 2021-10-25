<template>
  <div class="q-pa-md">
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
    <q-btn color="primary" icon="add" class="add-localized-text-btn" @click="addEntry()" :label="`Add new ${name}`" />
    <div v-show="uniqueLangs && duplicatedLangs.length > 0">There can only be one {{ name }} per language!</div>
  </div>
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
