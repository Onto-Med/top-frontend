<template>
  <div>
    <pre>{{ modelValue }}</pre>
    <div v-for="(entry, index) in modelValue" :key="index">
      <select v-model="entry.lang">
        <option :value="lang" v-for="lang in supportedLangs" :key="lang">{{ lang }}</option>
      </select>
      <input type="text" :value="entry.text" />
    </div>
    <div v-show="uniqueLangs & duplicatedLangs > 0">There can only be one title per language!</div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'

@Options({
  props: {
    modelValue: Array,
    supportedLangs: {
      type: Array,
      default () {
        return ['en']
      }
    },
    uniqueLangs: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    duplicatedLangs () {
      return this.modelValue
        .map((x: Record<string, string>) => x.lang)
        .filter((l: string, i: number, a: Array<string>) => a.indexOf(l) !== i)
        .length
    }
  }
})
export default class LocalizedText extends Vue {
}
</script>
