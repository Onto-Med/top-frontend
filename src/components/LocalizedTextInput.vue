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
