<template>
  <div>
    <div v-for="(entry, index) in modelValue" :key="index">
      <select v-model="entry.lang">
        <option :value="lang" v-for="lang in supportedLangs" :key="lang">{{ lang }}</option>
      </select>
      <textarea v-if="textArea" :rows="rows" :cols="cols" v-model="entry.text" />
      <input v-else type="text" v-model="entry.text" />
      <button class="remove-localized-text-btn" @click="removeEntryByIndex(index)">Remove</button>
    </div>
    <button class="add-localized-text-btn" @click="addEntry()">Add new {{ name }}</button>
    <div v-show="uniqueLangs && duplicatedLangs > 0">There can only be one {{ name }} per language!</div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

@Options({
  props: {
    modelValue: {
      type: Array,
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
      type: Array,
      default: () => ['en']
    }
  },
  computed: {
    duplicatedLangs () {
      return this.modelValue
        .map((x: Record<string, string>) => x.lang)
        .filter((l: string, i: number, a: Array<string>) => a.indexOf(l) !== i)
        .length
    },
    unusedSupportedLangs () {
      return this.supportedLangs
    }
  },
  methods: {
    removeEntryByIndex (index: number) {
      this.modelValue.splice(index, 1)
    },
    addEntry () {
      this.modelValue.push({ lang: this.unusedSupportedLangs[0] })
    }
  }
})
export default class LocalizedTextInput extends Vue {
}
</script>
